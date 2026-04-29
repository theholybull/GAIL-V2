Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
. (Join-Path $PSScriptRoot "common.ps1")
$storage = Initialize-GailStorageEnv -RepoRoot $repoRoot
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot

if (-not (Test-Path (Join-Path $nodeDir "npm.cmd"))) {
  throw "npm.cmd not found under $nodeDir"
}

Set-GailNodePath -NodeDir $nodeDir

Push-Location $backendDir
try {
  & (Join-Path $nodeDir "npm.cmd") start
}
finally {
  Pop-Location
}
