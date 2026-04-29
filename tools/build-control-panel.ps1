Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$panelDir = Join-Path $repoRoot "web-control-panel"
. (Join-Path $PSScriptRoot "common.ps1")
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot
$npmCmd = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path $npmCmd)) {
  throw "npm.cmd not found under $nodeDir"
}

if (-not (Test-Path (Join-Path $panelDir "node_modules"))) {
  throw "web-control-panel dependencies not installed. Run tools\\install-node-deps.ps1 first."
}

Set-GailNodePath -NodeDir $nodeDir
Push-Location $panelDir
try {
  & $npmCmd run build
}
finally {
  Pop-Location
}
