Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot
Set-GailNodePath -NodeDir $nodeDir

$integratedRoot = Join-Path $repoRoot "tools\anim-avatar-importer"
$legacyRoot = Join-Path (Split-Path -Parent $repoRoot) "anim_avatar_importer"

if (Test-Path (Join-Path $integratedRoot "server.js")) {
  $toolRoot = $integratedRoot
  $mode = "integrated"
}
elseif (Test-Path (Join-Path $legacyRoot "server.js")) {
  $toolRoot = $legacyRoot
  $mode = "legacy-sidecar"
}
else {
  throw "Animation importer was not found in '$integratedRoot' or '$legacyRoot'."
}

$serverPath = Join-Path $toolRoot "server.js"
$nodeExe = Join-Path $nodeDir "node.exe"

Write-Host "Starting animation importer ($mode) from $toolRoot"
Write-Host "Importer URL: http://127.0.0.1:8888/"

Push-Location $toolRoot
try {
  & $nodeExe $serverPath
}
finally {
  Pop-Location
}
