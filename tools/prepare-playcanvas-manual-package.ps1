param(
  [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($OutDir)) {
  $OutDir = Join-Path $repoRoot "data\runtime\playcanvas_manual_package"
}

$handoffRoot = Join-Path $repoRoot "playcanvas-app\assets\handoffs\playcanvas_handoff_20260330\assets\avatar"
$partsDir = Join-Path $handoffRoot "parts"
$texturesDir = Join-Path $handoffRoot "textures"
$manifestSrc = Join-Path $repoRoot "playcanvas-app\assets\handoffs\playcanvas_handoff_20260330\manifests\integration_asset_manifest.json"

if (-not (Test-Path $partsDir)) { throw "Missing parts dir: $partsDir" }
if (-not (Test-Path $texturesDir)) { throw "Missing textures dir: $texturesDir" }
if (-not (Test-Path $manifestSrc)) { throw "Missing manifest: $manifestSrc" }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$outParts = Join-Path $OutDir "parts"
$outTextures = Join-Path $OutDir "textures"
New-Item -ItemType Directory -Force -Path $outParts | Out-Null
New-Item -ItemType Directory -Force -Path $outTextures | Out-Null

$required = @("body.glb", "hair.glb", "clothing.glb", "accessories.glb")
foreach ($name in $required) {
  $src = Join-Path $partsDir $name
  if (-not (Test-Path $src)) { throw "Missing required part: $src" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $outParts $name) -Force
}

Copy-Item -LiteralPath (Join-Path $texturesDir "base_avatar_flat.png") -Destination (Join-Path $outTextures "base_avatar_flat.png") -Force -ErrorAction SilentlyContinue
Copy-Item -LiteralPath $manifestSrc -Destination (Join-Path $OutDir "integration_asset_manifest.json") -Force

$readme = @"
PlayCanvas Manual Package
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Contents:
- parts/body.glb
- parts/hair.glb
- parts/clothing.glb
- parts/accessories.glb
- textures/base_avatar_flat.png (if present)
- integration_asset_manifest.json

Recommended first orientation in PlayCanvas Editor:
- X: 180
- Y: 0
- Z: 90
"@

Set-Content -Path (Join-Path $OutDir "README.txt") -Value $readme -Encoding UTF8

Write-Host "Manual package ready: $OutDir"
Get-ChildItem -Path $OutDir -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize
