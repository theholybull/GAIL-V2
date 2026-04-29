Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$appDir = Join-Path $repoRoot "playcanvas-app"
. (Join-Path $PSScriptRoot "common.ps1")
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot
$npmCmd = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path $npmCmd)) {
  throw "npm.cmd not found under $nodeDir"
}

if (-not (Test-Path (Join-Path $appDir "node_modules"))) {
  throw "playcanvas-app dependencies not installed. Run tools\\install-node-deps.ps1 first."
}

Set-GailNodePath -NodeDir $nodeDir
Push-Location $appDir
try {
  & $npmCmd run build
}
finally {
  Pop-Location
}

# --- Validate animation GLBs (Animation Laws) ---
$animDir = Join-Path $appDir "assets\animations"
if (Test-Path $animDir) {
  $nodeCmd = Join-Path $nodeDir "node.exe"
  $validator = Join-Path $PSScriptRoot "validate-animation-glbs.js"
  if (Test-Path $validator) {
    Write-Host "Validating animation GLBs..."
    & $nodeCmd $validator
    if ($LASTEXITCODE -ne 0) {
      throw "Animation GLB validation failed. Run 'node tools/fix-animation-coordinate-space.js' to fix."
    }
    Write-Host "Animation validation passed."
  }
}
