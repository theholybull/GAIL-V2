# Gail Animation Importer — Launcher
# Usage: .\start.ps1

$ErrorActionPreference = "Stop"
$ToolDir = $PSScriptRoot
$ToolsRoot = Split-Path -Parent $ToolDir

. (Join-Path $ToolsRoot "common.ps1")

$RepoRoot = Get-GailRepoRoot -ToolsRoot $ToolsRoot
$NodeDir = Resolve-GailNodeDir -RepoRoot $RepoRoot
Set-GailNodePath -NodeDir $NodeDir
$NodeExe = Join-Path $NodeDir "node.exe"

Write-Host ""
Write-Host "  Gail Animation Importer" -ForegroundColor Cyan
Write-Host "  Port 8888" -ForegroundColor DarkCyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = & $NodeExe --version 2>&1
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js runtime not found." -ForegroundColor Red
    exit 1
}

# Check animation library
$repoLibraryPath = Join-Path $RepoRoot "data\animation-library\converted_animations_20260401"
$legacyLibraryPath = Join-Path (Split-Path $RepoRoot -Parent) "converted_animations_20260401"
$libPath = if (Test-Path $repoLibraryPath) { $repoLibraryPath } else { $legacyLibraryPath }
if (Test-Path $libPath) {
    $clipCount = (Get-ChildItem $libPath -Recurse -Filter "*.glb" | Measure-Object).Count
    Write-Host "  Animation library: $clipCount clips found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Animation library not found at:" -ForegroundColor Yellow
    Write-Host "    $libPath" -ForegroundColor Yellow
    Write-Host "  Catalog will be empty until library is available." -ForegroundColor Yellow
}

# Check catalog
$catalogPath = Join-Path $RepoRoot "data\animation-importer\catalog.json"
if (Test-Path $catalogPath) {
    $catalog = Get-Content $catalogPath | ConvertFrom-Json
    Write-Host "  Catalog: $($catalog.Count) entries cached" -ForegroundColor Green
} else {
    Write-Host "  Catalog: not built yet (use Rebuild Catalog button in UI)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Starting server..." -ForegroundColor Cyan
Write-Host "  Open: http://127.0.0.1:8888/" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

Set-Location $ToolDir
& $NodeExe server.js
