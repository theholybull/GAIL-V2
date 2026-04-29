param(
    [bool]$OpenRegular = $true,
    [bool]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

$BlenderExe = "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe"
$MasterBlend = "F:\Gail\gail_rig_master.blend"
$MasterRebuiltBlend = "F:\Gail\gail_rig_master.rebuilt.blend"
$RegularBlend = "F:\Gail\gail_rig.blend"
$ScriptsRoot = "F:\Gail\blender\animation_master\scripts"
$ManifestsRoot = "F:\Gail\blender\animation_master\manifests"
$ReportsRoot = "F:\Gail\blender\animation_master\exports\reports"
$BackupsRoot = "F:\Gail\blender\animation_master\exports\backups"

$IdleConfig = Join-Path $ManifestsRoot "clip_tuning.idle_base_v1.json"
$RebuildScript = Join-Path $ScriptsRoot "rebuild_idle_from_action.py"
$RegularBuildScript = Join-Path $ScriptsRoot "generate_regular_avatar_from_master.py"
$RegularBuildManifest = Join-Path $ManifestsRoot "regular_avatar_build.gail.example.json"
$RegularBuildReport = Join-Path $ReportsRoot "regular_avatar_build_report.json"

function New-Timestamp {
    Get-Date -Format "yyyyMMdd_HHmmss"
}

function Backup-File {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path $Path)) {
        return
    }

    $timestamp = New-Timestamp
    $dir = Join-Path $BackupsRoot $timestamp
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $dest = Join-Path $dir ("{0}{1}" -f $Label, [System.IO.Path]::GetExtension($Path))
    Copy-Item $Path $dest -Force
    Write-Host "BACKUP $dest"
}

if (-not (Test-Path $BlenderExe)) {
    throw "Missing Blender executable: $BlenderExe"
}

if (-not $SkipBackup) {
    Backup-File -Path $MasterBlend -Label "gail_rig_master"
    Backup-File -Path $RegularBlend -Label "gail_rig"
}

& $BlenderExe $MasterBlend -b --python $RebuildScript -- `
    --config $IdleConfig `
    --output-temp $MasterRebuiltBlend

if (-not (Test-Path $MasterRebuiltBlend)) {
    throw "Rebuild did not produce $MasterRebuiltBlend"
}

Copy-Item $MasterRebuiltBlend $MasterBlend -Force
Write-Host "UPDATED $MasterBlend"

& $BlenderExe $MasterRebuiltBlend -b --python $RegularBuildScript -- `
    --manifest $RegularBuildManifest `
    --report-path $RegularBuildReport

if (-not (Test-Path $RegularBlend)) {
    throw "Regular build did not produce $RegularBlend"
}

Write-Host "UPDATED $RegularBlend"

if ($OpenRegular) {
    Start-Process -FilePath $BlenderExe -ArgumentList @($RegularBlend)
    Write-Host "OPENED $RegularBlend"
}
