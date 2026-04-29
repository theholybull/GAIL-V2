Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "common.ps1")
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot
$npmCmd = Join-Path $nodeDir "npm.cmd"
$projects = @(
  "backend",
  "web-control-panel",
  "playcanvas-app"
)

if (-not (Test-Path $npmCmd)) {
  throw "npm.cmd not found under $nodeDir"
}

Set-GailNodePath -NodeDir $nodeDir

foreach ($project in $projects) {
  $projectDir = Join-Path $repoRoot $project
  Write-Host "Installing Node dependencies in $project"
  Push-Location $projectDir
  try {
    & $npmCmd install
  }
  finally {
    Pop-Location
  }
}
