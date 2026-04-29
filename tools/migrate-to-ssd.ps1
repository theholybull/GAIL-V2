param(
  [string]$SourceRoot = "E:\Gail",
  [string]$TargetRoot = "F:\Gail"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourceRoot)) {
  throw "Source root not found: $SourceRoot"
}

$targetParent = Split-Path -Parent $TargetRoot
if (-not (Test-Path $targetParent)) {
  throw "Target drive/path not found: $targetParent"
}

if (-not (Test-Path $TargetRoot)) {
  New-Item -ItemType Directory -Force -Path $TargetRoot | Out-Null
}

$excludeDirs = @(
  ".git",
  "node_modules",
  "dist",
  "Library",
  "__pycache__"
)

$robocopyArgs = @(
  $SourceRoot,
  $TargetRoot,
  "/E",
  "/R:2",
  "/W:1",
  "/NFL",
  "/NDL",
  "/NP",
  "/XD"
) + $excludeDirs

Write-Host "Mirroring $SourceRoot -> $TargetRoot"
Write-Host "Excluded directories: $($excludeDirs -join ', ')"

& robocopy @robocopyArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ge 8) {
  throw "robocopy failed with exit code $exitCode"
}

Write-Host ""
Write-Host "Migration copy completed."
Write-Host "Next steps:"
Write-Host "1. powershell -ExecutionPolicy Bypass -File `"$TargetRoot\\tools\\install-backend-deps.ps1`""
Write-Host "2. powershell -ExecutionPolicy Bypass -File `"$TargetRoot\\tools\\build-backend.ps1`""
Write-Host "3. powershell -ExecutionPolicy Bypass -File `"$TargetRoot\\tools\\build-control-panel.ps1`""
Write-Host "4. powershell -ExecutionPolicy Bypass -File `"$TargetRoot\\tools\\run-backend.ps1`""
