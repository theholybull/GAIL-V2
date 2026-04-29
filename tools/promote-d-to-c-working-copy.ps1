param(
  [string]$SourceRoot = "",
  [string]$TargetRoot = "",
  [switch]$IncludeReports,
  [switch]$Execute,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
  $SourceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
}

if ([string]::IsNullOrWhiteSpace($TargetRoot)) {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $TargetRoot = Join-Path $desktop "Gail 2.1\working_copy"
}

if (-not $Execute) {
  $DryRun = $true
  Write-Host "Safety default: running as dry-run. Re-run with -Execute to copy files." -ForegroundColor Yellow
}

if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
  throw "Missing source root: $SourceRoot"
}

New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null
$logDir = Join-Path $TargetRoot "promotion_logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "promote-$stamp.log"

$includeDirs = @(
  "backend",
  "shared",
  "playcanvas-app",
  "web-control-panel",
  "tools",
  "docs",
  "rebuild 4_9"
)

$excludeDirs = @(
  ".git",
  "node_modules",
  "temp",
  "dist-temp",
  "data",
  "docs\reports",
  "playcanvas-app\dist-temp",
  "playcanvas-app\temp"
)

$excludeFiles = @(
  "test-*.cjs",
  "test-*.js",
  "test-*.mjs",
  "tmp-*.cjs",
  "tmp-*.js",
  "tmp-*.mjs",
  "*.log"
)

$rootFiles = @(
  "README.md",
  "ANIMATION_RIGGING_RULES.md"
)

if ($IncludeReports) {
  $includeDirs += "docs\reports"
}

function Invoke-RobocopySafe {
  param(
    [string]$FromPath,
    [string]$ToPath
  )

  $args = @(
    $FromPath,
    $ToPath,
    "/E",
    "/R:1",
    "/W:1",
    "/NP"
  )

  foreach ($dir in $excludeDirs) {
    $args += @("/XD", $dir)
  }
  foreach ($file in $excludeFiles) {
    $args += @("/XF", $file)
  }

  if ($DryRun) {
    $args += "/L"
  }

  & robocopy @args | Tee-Object -FilePath $logPath -Append | Out-Null
  $rc = $LASTEXITCODE
  if ($rc -gt 7) {
    throw "Robocopy failed with exit code $rc for $FromPath"
  }
}

"Promotion started: $(Get-Date -Format s)" | Set-Content -Path $logPath -Encoding UTF8
"Source: $SourceRoot" | Add-Content -Path $logPath
"Target: $TargetRoot" | Add-Content -Path $logPath
"DryRun: $DryRun" | Add-Content -Path $logPath
"Execute: $Execute" | Add-Content -Path $logPath

foreach ($dir in $includeDirs) {
  $src = Join-Path $SourceRoot $dir
  if (-not (Test-Path -LiteralPath $src -PathType Container)) {
    "Skip missing dir: $src" | Add-Content -Path $logPath
    continue
  }
  $dst = Join-Path $TargetRoot $dir
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  Write-Host "Promoting directory: $dir"
  Invoke-RobocopySafe -FromPath $src -ToPath $dst
}

foreach ($file in $rootFiles) {
  $srcFile = Join-Path $SourceRoot $file
  if (-not (Test-Path -LiteralPath $srcFile -PathType Leaf)) {
    continue
  }
  $dstFile = Join-Path $TargetRoot $file
  if ($DryRun) {
    "Would copy file: $srcFile -> $dstFile" | Add-Content -Path $logPath
    continue
  }
  Copy-Item -LiteralPath $srcFile -Destination $dstFile -Force
  "Copied file: $srcFile -> $dstFile" | Add-Content -Path $logPath
}

"Promotion completed: $(Get-Date -Format s)" | Add-Content -Path $logPath
Write-Host "Promotion complete. Log: $logPath"
