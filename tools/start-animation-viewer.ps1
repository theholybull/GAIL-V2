param(
  [string]$OutputRoot = "",
  [int]$Port = 8778,
  [switch]$RefreshRuntime
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $repoRoot "data\animation_viewer"
}

$metaDir = Join-Path $OutputRoot "metadata"
$indexPath = Join-Path $metaDir "library_index.json"
$htmlPath = Join-Path $metaDir "viewer_runtime.html"
$runtimeIndex = Join-Path $repoRoot "tools\animation_viewer_runtime\index.html"

New-Item -ItemType Directory -Force -Path $metaDir | Out-Null

if ($RefreshRuntime -or -not (Test-Path -LiteralPath $htmlPath -PathType Leaf)) {
  if (-not (Test-Path -LiteralPath $runtimeIndex -PathType Leaf)) {
    throw "Animation viewer runtime not found at $runtimeIndex"
  }
  Copy-Item -LiteralPath $runtimeIndex -Destination $htmlPath -Force
}

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
  "[]" | Set-Content -LiteralPath $indexPath -Encoding UTF8
}

$pythonArgs = @()
$py = Get-Command py -ErrorAction SilentlyContinue
if ($py) {
  $pythonExe = $py.Source
  $pythonArgs = @('-3.11')
} else {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) {
    throw 'python/py launcher was not found on PATH'
  }
  $pythonExe = $python.Source
}

Start-Process -FilePath $pythonExe -WorkingDirectory $OutputRoot -ArgumentList @($pythonArgs + @('-m', 'http.server', "$Port")) -WindowStyle Hidden | Out-Null
Start-Sleep -Seconds 2

$url = "http://127.0.0.1:$Port/metadata/viewer_runtime.html"
Write-Host "Viewer running at $url"
