param(
    [string]$BlenderExe = "",
    [string]$MasterBlendSource = "",
    [string]$RegularBlendSource = "",
    [switch]$SkipRegularRefresh,
    [switch]$SkipModuleExport,
    [switch]$SkipClipExport,
    [switch]$IncludeReview,
    [switch]$StrictValidation,
    [bool]$CopyApprovedClipsToClientAssets = $true,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$AnimationRoot = Join-Path $RepoRoot "blender\animation_master"
$ScriptsRoot = Join-Path $AnimationRoot "scripts"
$ManifestsRoot = Join-Path $AnimationRoot "manifests"
$ReportsRoot = Join-Path $AnimationRoot "exports\reports"
$PlayCanvasAssetsRoot = Join-Path $RepoRoot "playcanvas-app\assets"

$RegularBuildScript = Join-Path $ScriptsRoot "generate_regular_avatar_from_master.py"
$RegularBuildManifest = Join-Path $ManifestsRoot "regular_avatar_build.gail.example.json"
$RegularBuildReport = Join-Path $ReportsRoot "regular_avatar_build_report.json"

$ModuleExportScript = Join-Path $ScriptsRoot "export_playcanvas_assets.py"
$PartitionManifest = Join-Path $ManifestsRoot "asset_partition.gail.json"
$ShapeKeyManifest = Join-Path $ManifestsRoot "runtime_shape_keys.gail.json"
$ModuleExportReport = Join-Path $ReportsRoot "playcanvas_asset_export_report.json"

$ClipValidationScript = Join-Path $ScriptsRoot "validate_animation_master.py"
$ClipExportScript = Join-Path $ScriptsRoot "export_actions_glb.py"
$ClipManifest = Join-Path $ManifestsRoot "clip_registry.gail.example.json"

function Resolve-ManifestPath {
    param(
        [string]$PathValue
    )

    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        throw "Manifest path value is empty."
    }

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return $PathValue
    }

    return Join-Path $RepoRoot $PathValue
}

function Resolve-BlenderExecutable {
    param(
        [string]$PreferredPath
    )

    $candidates = @()

    if ($PreferredPath) {
        $candidates += $PreferredPath
    }

    if ($env:BLENDER_EXE) {
        $candidates += $env:BLENDER_EXE
    }

    try {
        $command = Get-Command blender -ErrorAction Stop
        if ($command.Source) {
            $candidates += $command.Source
        }
    } catch {
    }

    $candidates += @(
        "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 5.0\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
        "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe"
    )

    foreach ($candidate in $candidates | Where-Object { $_ } | Select-Object -Unique) {
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    throw "Unable to resolve Blender executable. Pass -BlenderExe or set BLENDER_EXE."
}

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path $Path)) {
        throw "Missing ${Label}: ${Path}"
    }
}

function Invoke-LoggedCommand {
    param(
        [string]$Label,
        [string[]]$ArgumentList,
        [switch]$AllowFailure
    )

    Write-Host ""
    Write-Host "=== $Label ==="
    Write-Host ("CMD {0} {1}" -f $script:ResolvedBlenderExe, ($ArgumentList -join " "))

    if ($DryRun) {
        return
    }

    & $script:ResolvedBlenderExe @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        if ($AllowFailure) {
            Write-Warning "$Label failed with exit code $LASTEXITCODE"
            return $LASTEXITCODE
        }
        throw "$Label failed with exit code $LASTEXITCODE"
    }

    return 0
}

function Get-JsonFile {
    param([string]$Path)
    return Get-Content $Path -Raw | ConvertFrom-Json
}

function Get-ExportProfile {
    param(
        [object]$Manifest,
        [string]$Name
    )

    foreach ($profile in $Manifest.export_profiles) {
        if ($profile.name -eq $Name) {
            return $profile
        }
    }

    throw "Export profile not found: ${Name}"
}

function Copy-ApprovedClipExports {
    param(
        [object]$Manifest,
        [string]$TargetRoot,
        [bool]$IncludeReviewClips
    )

    $profile = Get-ExportProfile -Manifest $Manifest -Name "playcanvas_glb"
    $pathRoot = $profile.path_root
    $allowedStatuses = @($profile.include_statuses)
    if ($IncludeReviewClips) {
        $allowedStatuses += "review"
    }

    $copied = @()
    New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null

    foreach ($clip in $Manifest.clips) {
        if ($clip.partition -ne "body") {
            continue
        }
        if ($allowedStatuses -notcontains $clip.status) {
            continue
        }

        $relativePath = $clip.export.relative_path
        $sourcePath = Join-Path $pathRoot $relativePath
        if (-not (Test-Path $sourcePath)) {
            throw "Expected exported clip not found: ${sourcePath}"
        }

        $flatTarget = Join-Path $TargetRoot ("{0}.glb" -f $clip.clip_name)
        Copy-Item $sourcePath $flatTarget -Force
        $copied += $flatTarget
        Write-Host ("COPIED {0}" -f $flatTarget)

        if ($clip.category -eq "idle") {
            $idleAlias = Join-Path $TargetRoot "idle.glb"
            Copy-Item $sourcePath $idleAlias -Force
            $copied += $idleAlias
            Write-Host ("COPIED {0}" -f $idleAlias)
        }
    }

    return $copied
}

Assert-PathExists -Path $RegularBuildScript -Label "regular avatar build script"
Assert-PathExists -Path $RegularBuildManifest -Label "regular avatar build manifest"
Assert-PathExists -Path $ModuleExportScript -Label "PlayCanvas module export script"
Assert-PathExists -Path $PartitionManifest -Label "asset partition manifest"
Assert-PathExists -Path $ShapeKeyManifest -Label "runtime shape-key manifest"
Assert-PathExists -Path $ClipValidationScript -Label "clip validation script"
Assert-PathExists -Path $ClipExportScript -Label "clip export script"
Assert-PathExists -Path $ClipManifest -Label "clip registry manifest"

$regularBuildManifestJson = Get-JsonFile -Path $RegularBuildManifest

$MasterBlend = if ($MasterBlendSource) {
    $MasterBlendSource
} else {
    Resolve-ManifestPath -PathValue $regularBuildManifestJson.source_master_file
}

$RegularBlend = if ($RegularBlendSource) {
    $RegularBlendSource
} else {
    Resolve-ManifestPath -PathValue $regularBuildManifestJson.output_regular_file
}

Assert-PathExists -Path $MasterBlend -Label "master blend"
if ($SkipRegularRefresh -and -not $SkipClipExport) {
    Assert-PathExists -Path $RegularBlend -Label "regular blend"
}

$ResolvedBlenderExe = $null
if ($DryRun) {
    try {
        $ResolvedBlenderExe = Resolve-BlenderExecutable -PreferredPath $BlenderExe
    } catch {
        $ResolvedBlenderExe = "<dryrun-no-blender>"
    }
} else {
    $ResolvedBlenderExe = Resolve-BlenderExecutable -PreferredPath $BlenderExe
}
$script:ResolvedBlenderExe = $ResolvedBlenderExe

Write-Host "Repo root: $RepoRoot"
Write-Host "Blender: $ResolvedBlenderExe"
Write-Host "Master blend: $MasterBlend"
Write-Host "Regular blend: $RegularBlend"

if (-not $SkipRegularRefresh) {
    [void](Invoke-LoggedCommand -Label "Refresh Regular Avatar Blend" -ArgumentList @(
        $MasterBlend,
        "-b",
        "--python-exit-code",
        "1",
        "--python",
        $RegularBuildScript,
        "--",
        "--manifest",
        $RegularBuildManifest,
        "--report-path",
        $RegularBuildReport
    ))

    if (-not $DryRun) {
        Assert-PathExists -Path $RegularBlend -Label "refreshed regular blend"
    }
}

if (-not $SkipModuleExport) {
    [void](Invoke-LoggedCommand -Label "Export Modular PlayCanvas Assets" -ArgumentList @(
        $MasterBlend,
        "-b",
        "--python-exit-code",
        "1",
        "--python",
        $ModuleExportScript,
        "--",
        "--partition-manifest",
        $PartitionManifest,
        "--shape-key-manifest",
        $ShapeKeyManifest,
        "--report-path",
        $ModuleExportReport
    ))
}

if (-not $SkipClipExport) {
    $validationExitCode = Invoke-LoggedCommand -Label "Validate Animation Library" -ArgumentList @(
        $MasterBlend,
        "-b",
        "--python-exit-code",
        "1",
        "--python",
        $ClipValidationScript,
        "--",
        "--manifest",
        $ClipManifest
    ) -AllowFailure:(!$StrictValidation)

    if ($validationExitCode -ne 0 -and -not $StrictValidation) {
        Write-Warning "Continuing despite validation failure. The current regular blend does not match the stricter collection/action contract."
    }

    $clipExportArgs = @(
        $RegularBlend,
        "-b",
        "--python-exit-code",
        "1",
        "--python",
        $ClipExportScript,
        "--",
        "--manifest",
        $ClipManifest,
        "--profile",
        "playcanvas_glb"
    )

    if ($IncludeReview) {
        $clipExportArgs += "--include-review"
    }

    [void](Invoke-LoggedCommand -Label "Export Animation Clips" -ArgumentList $clipExportArgs)
}

$clipCopies = @()
if ($CopyApprovedClipsToClientAssets -and -not $SkipClipExport) {
    Write-Host ""
    Write-Host "=== Mirror Approved Clips Into PlayCanvas Assets ==="
    if (-not $DryRun) {
        $clipCopies = Copy-ApprovedClipExports -Manifest (Get-JsonFile -Path $ClipManifest) -TargetRoot (Join-Path $PlayCanvasAssetsRoot "animations") -IncludeReviewClips:$IncludeReview
    } else {
        Write-Host ("COPY approved clips into {0}" -f (Join-Path $PlayCanvasAssetsRoot "animations"))
    }
} elseif ($CopyApprovedClipsToClientAssets -and $SkipClipExport) {
    Write-Host ""
    Write-Host "=== Mirror Approved Clips Into PlayCanvas Assets ==="
    Write-Host "SKIPPED clip mirroring because -SkipClipExport was requested."
}

$summary = [ordered]@{
    generated_at = (Get-Date).ToString("s")
    repo_root = $RepoRoot
    blender_exe = $ResolvedBlenderExe
    regular_refresh_skipped = [bool]$SkipRegularRefresh
    module_export_skipped = [bool]$SkipModuleExport
    clip_export_skipped = [bool]$SkipClipExport
    include_review = [bool]$IncludeReview
    strict_validation = [bool]$StrictValidation
    dry_run = [bool]$DryRun
    copied_client_animation_files = @($clipCopies)
    module_export_report = $ModuleExportReport
    regular_build_report = $RegularBuildReport
}

if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path $ReportsRoot | Out-Null
    $pipelineReport = Join-Path $ReportsRoot "playcanvas_pipeline_report.json"
    $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $pipelineReport -Encoding UTF8
    Write-Host ""
    Write-Host "REPORT $pipelineReport"
}

Write-Host ""
Write-Host "Pipeline complete."

exit 0
