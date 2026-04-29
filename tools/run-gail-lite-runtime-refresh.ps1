param(
  [string]$BlendPath = "D:\Avatars\Gail\gail.blend",
  [string]$BlenderExe = "",
  [string]$HairSourcePath = "",
  [ValidateSet("high", "medium", "low")]
  [string]$Profile = "medium",
  [string]$RunLabel = ("gail-lite-runtime-refresh-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "blender-common.ps1")

function Get-RepoRelativePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot,

    [Parameter(Mandatory = $true)]
    [string]$TargetPath
  )

  $NormalizedRepoRoot = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd('\')
  $NormalizedTargetPath = [System.IO.Path]::GetFullPath($TargetPath)

  if ($NormalizedTargetPath.StartsWith($NormalizedRepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $NormalizedTargetPath.Substring($NormalizedRepoRoot.Length).TrimStart('\')
  }

  return Split-Path -Path $NormalizedTargetPath -Leaf
}

function Format-NativeProcessArgument {
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return '""'
  }

  $Text = [string]$Value
  if ($Text -notmatch '[\s"]') {
    return $Text
  }

  $Escaped = $Text -replace '(\\*)"', '$1$1\"'
  $Escaped = $Escaped -replace '(\\+)$', '$1$1'
  return '"' + $Escaped + '"'
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ResolvedBlenderExe = if ($BlenderExe) { $BlenderExe } else { Resolve-GailBlenderExe -RepoRoot $RepoRoot }
$ScriptPath = Join-Path $RepoRoot "tools\export_gail_split.py"
$RunRoot = Join-Path $RepoRoot ("cleanup-hub\" + $RunLabel)
$ExportRoot = Join-Path $RunRoot "exports"
$BackupRoot = Join-Path $RunRoot "before"
$ReportPath = Join-Path $RunRoot "gail-lite-runtime-report.json"
$LogPath = Join-Path $RunRoot "blender.log"
$PromotionManifestPath = Join-Path $RunRoot "promotion-manifest.json"

if (-not (Test-Path -LiteralPath $BlendPath -PathType Leaf)) {
  throw "Blend file not found: $BlendPath"
}

if (-not (Test-Path -LiteralPath $ScriptPath -PathType Leaf)) {
  throw "Runtime export script not found: $ScriptPath"
}

New-Item -ItemType Directory -Force -Path $RunRoot, $ExportRoot, $BackupRoot | Out-Null

$StdOutPath = Join-Path $RunRoot "blender.stdout.log"
$StdErrPath = Join-Path $RunRoot "blender.stderr.log"

$ArgumentList = @(
  $BlendPath,
  "-b",
  "--python-exit-code", "1",
  "--python", $ScriptPath,
  "--",
  "--output-root", $ExportRoot,
  "--report-path", $ReportPath,
  "--profile", $Profile
)

if (Test-Path -LiteralPath $StdOutPath) {
  Remove-Item -LiteralPath $StdOutPath -Force
}
if (Test-Path -LiteralPath $StdErrPath) {
  Remove-Item -LiteralPath $StdErrPath -Force
}

$QuotedArgumentList = $ArgumentList | ForEach-Object { Format-NativeProcessArgument -Value $_ }
$Process = Start-Process `
  -FilePath $ResolvedBlenderExe `
  -ArgumentList ($QuotedArgumentList -join " ") `
  -Wait `
  -PassThru `
  -NoNewWindow `
  -RedirectStandardOutput $StdOutPath `
  -RedirectStandardError $StdErrPath

$StdOutText = if (Test-Path -LiteralPath $StdOutPath) { Get-Content -Path $StdOutPath -Raw } else { "" }
$StdErrText = if (Test-Path -LiteralPath $StdErrPath) { Get-Content -Path $StdErrPath -Raw } else { "" }
($StdOutText + $StdErrText) | Set-Content -Path $LogPath -Encoding UTF8

if ($Process.ExitCode -ne 0) {
  throw "Gail lite runtime export failed. See $LogPath"
}

if (-not (Test-Path -LiteralPath $ReportPath -PathType Leaf)) {
  throw "Gail lite runtime export completed without report: $ReportPath"
}

$ExportHairPath = Join-Path $ExportRoot "hair\meili_hair\meili_hair.glb"
$ResolvedHairSource = if ($HairSourcePath -and (Test-Path -LiteralPath $HairSourcePath -PathType Leaf)) { $HairSourcePath } else { $ExportHairPath }

$Targets = @(
  [ordered]@{
    source = Join-Path $ExportRoot "avatar\base_face\gail_base_avatar.glb"
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\avatar\base_face\gail_base_avatar.glb"
  },
  [ordered]@{
    source = $ResolvedHairSource
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\hair\meili_hair\meili_hair.glb"
  },
  [ordered]@{
    source = Join-Path $ExportRoot "clothes\gail_top\gail_top.glb"
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\clothes\gail_top\gail_top.glb"
  },
  [ordered]@{
    source = Join-Path $ExportRoot "clothes\gail_pants\gail_pants.glb"
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\clothes\gail_pants\gail_pants.glb"
  },
  [ordered]@{
    source = Join-Path $ExportRoot "clothes\gail_sandals\gail_sandals.glb"
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\clothes\gail_sandals\gail_sandals.glb"
  },
  [ordered]@{
    source = Join-Path $ExportRoot "accessories\gail_bundle\gail_accessories.glb"
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\accessories\gail_bundle\gail_accessories.glb"
  },
  [ordered]@{
    source = Join-Path $ExportRoot "accessories\gail_bundle\gail_accessories.glb"
    target = Join-Path $RepoRoot "playcanvas-app\assets\gail_lite\accessories\gail_bundle\gail_bracelets.glb"
  }
)

$PromotionRecords = @()

foreach ($Entry in $Targets) {
  if (-not (Test-Path -LiteralPath $Entry.source -PathType Leaf)) {
    continue
  }

  $TargetDirectory = Split-Path -Path $Entry.target -Parent
  New-Item -ItemType Directory -Force -Path $TargetDirectory | Out-Null

  if (Test-Path -LiteralPath $Entry.target -PathType Leaf) {
    $BackupTarget = Join-Path $BackupRoot (Get-RepoRelativePath -RepoRoot $RepoRoot -TargetPath $Entry.target)
    $BackupDirectory = Split-Path -Path $BackupTarget -Parent
    New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
    Copy-Item -LiteralPath $Entry.target -Destination $BackupTarget -Force
  }

  Copy-Item -LiteralPath $Entry.source -Destination $Entry.target -Force

  $SourceItem = Get-Item -LiteralPath $Entry.source
  $TargetItem = Get-Item -LiteralPath $Entry.target
  $PromotionRecords += [ordered]@{
    source = $Entry.source
    target = $Entry.target
    size_bytes = $TargetItem.Length
    last_write_time = $TargetItem.LastWriteTime.ToString("s")
    source_last_write_time = $SourceItem.LastWriteTime.ToString("s")
  }
}

$Manifest = [ordered]@{
  generated_at = (Get-Date).ToString("s")
  blender_exe = $ResolvedBlenderExe
  blend_path = $BlendPath
  profile = $Profile
  hair_source_path = $ResolvedHairSource
  run_root = $RunRoot
  export_root = $ExportRoot
  report_path = $ReportPath
  log_path = $LogPath
  promoted = $PromotionRecords
}

$Manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $PromotionManifestPath -Encoding UTF8

Write-Host ""
Write-Host "REPORT $ReportPath"
Write-Host "REPORT $PromotionManifestPath"
