param(
    [string]$BlenderExe = 'C:\Users\guysi\Desktop\blender-4.1.1-windows-x64\blender.exe',
    [string]$BlendPath = 'D:\test_v3_mapped.blend',
    [string]$OutputRoot = 'C:\Users\guysi\Desktop\animations',
    [string]$IndexPath = 'C:\Users\guysi\Desktop\animations\metadata\library_index.json',
    [string]$ApiKeyFile = 'D:\tools\animoxtend_api_key.txt',
    [string]$AddonRootParent = 'D:\tools\_animoxtend_1_2_2_unpack',
    [string]$TargetMappingPath = 'D:\tools\mapping_profiles\animo_target_victoria8_test_v2.json',
    [string]$TargetArmatureName = 'Victoria 8',
    [string]$SourceArmatureName = 'BufferArmature',
    [string]$Category,
    [string[]]$Id,
    [int]$MaxClips = 10,
    [switch]$ExportGlb,
    [switch]$GlbOnly,
    [switch]$SkipExistingConverted = $true,
    [switch]$ArmatureOnly,
    [switch]$PreviewProxy,
    [switch]$FullPreviewMesh,
    [string]$ManifestPathOverride,
    [string]$ReportPathOverride,
    [string]$ProgressPathOverride,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Read-JsonArray([string]$Path) {
    if (-not (Test-Path $Path)) {
        throw "Missing JSON file: $Path"
    }
    $raw = Get-Content -Path $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }
    $parsed = $raw | ConvertFrom-Json
    if (($parsed -isnot [System.Array]) -and ($parsed.PSObject.Properties.Name -contains 'value')) {
        return @($parsed.value)
    }
    return @($parsed)
}

function Slug([string]$Text, [int]$Max = 72) {
    $value = ($Text.ToLower() -replace '[^a-z0-9]+', '_').Trim('_')
    if ([string]::IsNullOrWhiteSpace($value)) { $value = 'motion' }
    if ($value.Length -gt $Max) { $value = $value.Substring(0, $Max).Trim('_') }
    return $value
}

if (-not (Test-Path $BlenderExe)) { throw "Missing Blender executable: $BlenderExe" }
if (-not (Test-Path $BlendPath)) { throw "Missing blend file: $BlendPath" }
if (-not (Test-Path $ApiKeyFile)) { throw "Missing API key file: $ApiKeyFile" }
if (-not (Test-Path $AddonRootParent)) { throw "Missing add-on root: $AddonRootParent" }
if (-not (Test-Path $TargetMappingPath)) { throw "Missing target mapping file: $TargetMappingPath" }

if ($GlbOnly) {
    $ExportGlb = $true
}

if ($ArmatureOnly -and $PreviewProxy) {
    throw 'ArmatureOnly and PreviewProxy cannot be used together.'
}

if ($FullPreviewMesh) {
    $PreviewProxy = $false
}

if ($GlbOnly -and -not $ArmatureOnly -and -not $FullPreviewMesh) {
    $PreviewProxy = $true
}

$exportMode = if ($ArmatureOnly) {
    'armature'
} elseif ($PreviewProxy) {
    'proxy'
} else {
    'full'
}

$items = @(Read-JsonArray -Path $IndexPath)
$filtered = $items | Where-Object {
    $_.status -ne 'trashed' -and $_.files -and $_.files.npz
}

if ($Category) {
    $filtered = $filtered | Where-Object { $_.category -eq $Category }
}

if ($Id -and $Id.Count -gt 0) {
    $idSet = @{}
    foreach ($value in $Id) { $idSet[[string]$value] = $true }
    $filtered = $filtered | Where-Object { $idSet.ContainsKey([string]$_.id) }
}

if ($SkipExistingConverted) {
    $filtered = $filtered | Where-Object {
        $hasGlb = $ExportGlb -and $_.files -and $_.files.glb -and (Test-Path ([string]$_.files.glb))
        $hasFbx = (-not $GlbOnly) -and $_.files -and $_.files.fbx -and (Test-Path ([string]$_.files.fbx))
        if ($GlbOnly) {
            return -not $hasGlb
        }
        if ($ExportGlb) {
            return -not ($hasGlb -and $hasFbx)
        }
        return -not $hasFbx
    }
}

$selected = @($filtered | Sort-Object {[int]($_.id -as [int])}, id | Select-Object -First $MaxClips)
if ($selected.Count -eq 0) {
    throw 'No matching clips with local NPZ files were found.'
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$metaDir = Join-Path $OutputRoot 'metadata'
if (-not (Test-Path $metaDir)) {
    New-Item -ItemType Directory -Force -Path $metaDir | Out-Null
}

$clips = @()
foreach ($item in $selected) {
    $slug = Slug ([string]$item.annotation)
    $clipName = '{0}_{1}' -f $item.id, $slug
    $categoryName = if ($item.category) { [string]$item.category } else { 'other' }
    $targetFbxPath = Join-Path (Join-Path (Join-Path $OutputRoot 'converted\fbx') $categoryName) ($clipName + '.fbx')
    $targetGlbPath = Join-Path (Join-Path (Join-Path $OutputRoot 'converted\glb') $categoryName) ($clipName + '.glb')

    if ($SkipExistingConverted) {
        $diskHasGlb = $ExportGlb -and (Test-Path $targetGlbPath)
        $diskHasFbx = (-not $GlbOnly) -and (Test-Path $targetFbxPath)
        if ($GlbOnly -and $diskHasGlb) {
            continue
        }
        if ((-not $GlbOnly) -and $ExportGlb -and $diskHasGlb -and $diskHasFbx) {
            continue
        }
        if ((-not $GlbOnly) -and (-not $ExportGlb) -and $diskHasFbx) {
            continue
        }
    }

    $clip = [ordered]@{
        id = [string]$item.id
        annotation = [string]$item.annotation
        clip_name = $clipName
        npz_path = [string]$item.files.npz
    }
    if (-not $GlbOnly) {
        $clip.fbx_path = $targetFbxPath
    }
    if ($ExportGlb) {
        $clip.glb_path = $targetGlbPath
    }
    $clips += [pscustomobject]$clip
}

if ($clips.Count -eq 0) {
    throw 'No matching clips require conversion after skip-existing filtering.'
}

$manifestPath = if ($ManifestPathOverride) { $ManifestPathOverride } else { Join-Path $metaDir ("local_pipeline_manifest_{0}.json" -f $timestamp) }
$reportPath = if ($ReportPathOverride) { $ReportPathOverride } else { Join-Path $metaDir ("local_pipeline_report_{0}.json" -f $timestamp) }
$progressPath = if ($ProgressPathOverride) { $ProgressPathOverride } else { Join-Path $metaDir 'local_pipeline_progress.json' }
$manifest = [ordered]@{
    created_at = (Get-Date).ToString('s')
    blend_path = $BlendPath
    addon_root_parent = $AddonRootParent
    api_key_file = $ApiKeyFile
    target_mapping_path = $TargetMappingPath
    source_armature_name = $SourceArmatureName
    target_armature_name = $TargetArmatureName
    export_mode = $exportMode
    export_include_meshes = (-not $ArmatureOnly)
    server_host = 'https://zoe-api.sensetime.com'
    report_path = $reportPath
    progress_path = $progressPath
    clips = $clips
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path $manifestPath -Encoding UTF8

$initialProgress = [ordered]@{
    status = 'queued'
    total = $clips.Count
    completed = 0
    failed = 0
    current_clip = $null
    percent = 0
    report_path = $reportPath
}
$initialProgress | ConvertTo-Json -Depth 6 | Set-Content -Path $progressPath -Encoding UTF8

Write-Host ("Selected clips=" + $selected.Count)
Write-Host ("Manifest=" + $manifestPath)
Write-Host ("Report=" + $reportPath)
Write-Host ("Progress=" + $progressPath)
Write-Host ("ExportMode=" + $exportMode)
foreach ($clip in $clips) {
    Write-Host ("- " + $clip.clip_name)
}

if ($DryRun) {
    return
}

$scriptPath = 'D:\tools\animoxtend_local_retarget_export.py'
& $BlenderExe --factory-startup -b $BlendPath --python $scriptPath -- --manifest $manifestPath
if ($LASTEXITCODE -ne 0) {
    throw "Blender pipeline failed with exit code $LASTEXITCODE. See $reportPath"
}

if (Test-Path $reportPath) {
    $report = Get-Content -Path $reportPath -Raw | ConvertFrom-Json
    $processedItems = @($report.processed)
    if ($processedItems.Count -gt 0) {
        $indexItems = @(Read-JsonArray -Path $IndexPath)
        $byId = @{}
        foreach ($indexItem in $indexItems) {
            $byId[[string]$indexItem.id] = $indexItem
            if (-not $indexItem.files) {
                $indexItem | Add-Member -NotePropertyName files -NotePropertyValue ([pscustomobject]@{
                    fbx = $null
                    glb = $null
                    npz = $null
                }) -Force
            }
        }

        foreach ($processed in $processedItems) {
            $key = [string]$processed.id
            if (-not $byId.ContainsKey($key)) { continue }
            $item = $byId[$key]
            if ($processed.fbx_path) { $item.files.fbx = [string]$processed.fbx_path }
            if ($processed.glb_path) { $item.files.glb = [string]$processed.glb_path }
        }

        $indexItems | ConvertTo-Json -Depth 8 | Set-Content -Path $IndexPath -Encoding UTF8
        Write-Host 'Updated library index with converted outputs.'
    }
    Write-Host ("Processed=" + @($report.processed).Count)
    Write-Host ("Errors=" + @($report.errors).Count)
}
