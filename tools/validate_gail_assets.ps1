param(
    [string]$AssetRoot = "e:\Gail\rebuild\godot\assets\gail"
)

$ErrorActionPreference = "Stop"

$states = @("idle", "talk", "wave", "dance", "laugh", "angry", "thinking", "bored")
$basePriority = @("avatar_base.glb", "rig.glb", "mix.glb")
$allowedRuntimeExts = @(".glb", ".gltf", ".png", ".jpg", ".jpeg", ".webp", ".import")
$warningCount = 0
$errorCount = 0

function Add-WarningMessage([string]$message) {
    $script:warningCount++
    Write-Host "WARNING: $message" -ForegroundColor Yellow
}

function Add-ErrorMessage([string]$message) {
    $script:errorCount++
    Write-Host "ERROR: $message" -ForegroundColor Red
}

function Write-Section([string]$title) {
    Write-Host ""
    Write-Host "=== $title ==="
}

function Get-StateKeywords {
    param([string]$State)

    switch ($State.ToLowerInvariant()) {
        "idle" { return @("idle", "stand", "rest", "breathe") }
        "talk" { return @("talk", "speak", "chat", "conversation") }
        "wave" { return @("wave", "greet", "hello") }
        "dance" { return @("dance", "dancing", "hip hop", "party") }
        "laugh" { return @("laugh", "giggle", "chuckle") }
        "angry" { return @("angry", "mad", "frustrated", "rage") }
        "thinking" { return @("thinking", "think", "ponder") }
        "bored" { return @("bored", "yawn", "tired") }
        default { return @($State.ToLowerInvariant()) }
    }
}

function Test-StateNameMatch {
    param(
        [string]$State,
        [string]$FileName
    )

    $name = [System.IO.Path]::GetFileNameWithoutExtension($FileName).ToLowerInvariant()
    foreach ($keyword in (Get-StateKeywords -State $State)) {
        if ($name.Contains($keyword)) {
            return $true
        }
    }
    return $false
}

function Get-BaseCandidate {
    param([string]$Root)
    $allRootGlbs = Get-ChildItem -Path $Root -File -Filter *.glb -ErrorAction SilentlyContinue
    if (-not $allRootGlbs) { return $null }

    foreach ($name in $basePriority) {
        $hit = $allRootGlbs | Where-Object { $_.Name -ieq $name } | Select-Object -First 1
        if ($hit) { return $hit }
    }
    return ($allRootGlbs | Sort-Object Length -Descending | Select-Object -First 1)
}

if (-not (Test-Path $AssetRoot)) {
    Write-Error "Asset root not found: $AssetRoot"
    exit 2
}

Write-Section "Asset Root"
Write-Host "Path: $AssetRoot"

$base = Get-BaseCandidate -Root $AssetRoot
if (-not $base) {
    Write-Error "No base GLB found in $AssetRoot"
    exit 3
}

$baseImport = "$($base.FullName).import"
$basePrefix = [System.IO.Path]::GetFileNameWithoutExtension($base.Name)
$baseTextures = Get-ChildItem -Path $AssetRoot -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "$basePrefix*" -and ($_.Extension -in @(".png", ".jpg", ".jpeg", ".webp")) }

Write-Section "Base Avatar"
Write-Host "Base file: $($base.Name) ($([math]::Round($base.Length / 1MB, 2)) MB)"
Write-Host "Has .import: $([bool](Test-Path $baseImport))"
Write-Host "Prefixed texture files: $($baseTextures.Count)"
if ($base.Name -ine "avatar_base.glb") {
    Add-WarningMessage "Canonical base avatar filename is 'avatar_base.glb', but current base file is '$($base.Name)'."
}

$eyeTextures = $baseTextures | Where-Object { $_.Name -match '(?i)(eye|iris)' }
$lashTextures = $baseTextures | Where-Object { $_.Name -match '(?i)(lash|eyelash)' }
$faceTextures = $baseTextures | Where-Object { $_.Name -match '(?i)(face|head|mouth|lip)' }
Write-Host "Eye textures: $($eyeTextures.Count)"
Write-Host "Lash textures: $($lashTextures.Count)"
Write-Host "Face/mouth textures: $($faceTextures.Count)"

Write-Section "Optional Swaps"
$clothesDir = Join-Path $AssetRoot "clothes"
$hairDir = Join-Path $AssetRoot "hair"
$bodyhairDir = Join-Path $AssetRoot "bodyhair"

$clothesCount = if (Test-Path $clothesDir) { (Get-ChildItem $clothesDir -File -Filter *.glb -ErrorAction SilentlyContinue).Count } else { 0 }
$hairCount = if (Test-Path $hairDir) { (Get-ChildItem $hairDir -File -Filter *.glb -ErrorAction SilentlyContinue).Count } else { 0 }
$bodyhairCount = if (Test-Path $bodyhairDir) { (Get-ChildItem $bodyhairDir -File -Filter *.glb -ErrorAction SilentlyContinue).Count } else { 0 }

Write-Host "Clothes GLBs: $clothesCount"
Write-Host "Hair GLBs: $hairCount"
Write-Host "Body hair GLBs: $bodyhairCount"

Write-Section "Runtime Hygiene"
$unexpectedRuntimeFiles = Get-ChildItem -Path $AssetRoot -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension.ToLowerInvariant() -notin $allowedRuntimeExts }
if ($unexpectedRuntimeFiles.Count -eq 0) {
    Write-Host "Unexpected runtime files: 0"
} else {
    Write-Host "Unexpected runtime files: $($unexpectedRuntimeFiles.Count)"
    foreach ($file in $unexpectedRuntimeFiles | Select-Object -First 10) {
        Add-WarningMessage ("Non-runtime file in asset tree: {0}" -f $file.FullName)
    }
    if ($unexpectedRuntimeFiles.Count -gt 10) {
        Add-WarningMessage ("Additional unexpected files omitted from report: {0}" -f ($unexpectedRuntimeFiles.Count - 10))
    }
}

Write-Section "Animation States"
$animRoot = Join-Path $AssetRoot "animations"
$missingStates = @()
$emptyStates = @()
$totalClips = 0
$mismatchedClipNames = @()

foreach ($s in $states) {
    $stateDir = Join-Path $animRoot $s
    if (-not (Test-Path $stateDir)) {
        $missingStates += $s
        Write-Host ("{0,-10} : missing folder" -f $s)
        continue
    }
    $clips = Get-ChildItem $stateDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in @(".glb", ".gltf") }
    $clipCount = $clips.Count
    $totalClips += $clipCount
    if ($clipCount -eq 0) { $emptyStates += $s }
    Write-Host ("{0,-10} : {1} clip(s)" -f $s, $clipCount)
    foreach ($clip in $clips) {
        if (-not (Test-StateNameMatch -State $s -FileName $clip.Name)) {
            $mismatchedClipNames += ("{0}/{1}" -f $s, $clip.Name)
        }
    }
}

Write-Section "Summary"
$okBaseImport = Test-Path $baseImport
$hasIdle = -not ($missingStates -contains "idle") -and -not ($emptyStates -contains "idle")
$hasFaceMaps = ($eyeTextures.Count -gt 0) -and ($faceTextures.Count -gt 0)

Write-Host "Base import ready: $okBaseImport"
Write-Host "Idle clip present: $hasIdle"
Write-Host "Base face texture set present: $hasFaceMaps"
Write-Host "Total animation clips: $totalClips"

if ($missingStates.Count -gt 0) {
    Write-Host "Missing animation folders: $($missingStates -join ', ')"
}
if ($emptyStates.Count -gt 0) {
    Write-Host "Empty animation folders: $($emptyStates -join ', ')"
}
if ($mismatchedClipNames.Count -gt 0) {
    foreach ($entry in $mismatchedClipNames) {
        Add-ErrorMessage "Animation clip name does not match its state folder: $entry"
    }
}

if (-not $okBaseImport -or -not $hasIdle -or $errorCount -gt 0) {
    Write-Error "Validation failed: missing critical base import, idle animation, or pipeline integrity checks."
    exit 4
}

Write-Host ""
if ($warningCount -gt 0) {
    Write-Host "Validation passed with $warningCount warning(s)."
} else {
    Write-Host "Validation passed."
}
exit 0
