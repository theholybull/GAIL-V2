Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$scripts = @(
  "build-backend.ps1",
  "build-control-panel.ps1",
  "build-playcanvas-app.ps1"
)

foreach ($script in $scripts) {
  $scriptPath = Join-Path $PSScriptRoot $script
  Write-Host "Running $script"
  & $scriptPath
}
