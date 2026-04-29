param(
    [string]$OutputRoot = 'C:\Users\guysi\Desktop\animations',
    [int]$Port = 8778
)

$ErrorActionPreference = 'Stop'

$indexPath = Join-Path $OutputRoot 'metadata\library_index.json'
$htmlPath = Join-Path $OutputRoot 'metadata\viewer_runtime.html'

if (-not (Test-Path -LiteralPath $indexPath)) {
    throw "Missing index file: $indexPath"
}

if (-not (Test-Path -LiteralPath $htmlPath)) {
    throw "Missing viewer file: $htmlPath"
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    throw 'python was not found on PATH'
}

Start-Process -FilePath $python.Source -WorkingDirectory $OutputRoot -ArgumentList @('-m', 'http.server', "$Port") -WindowStyle Hidden | Out-Null
Start-Sleep -Seconds 2

$url = "http://localhost:$Port/metadata/viewer_runtime.html"
Write-Host "Viewer running at $url"
Start-Process $url | Out-Null
