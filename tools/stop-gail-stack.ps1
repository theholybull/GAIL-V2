param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
$manifest = Get-GailStackManifest -RepoRoot $repoRoot
$port = ([Uri]$BaseUrl).Port

foreach ($service in @($manifest.services)) {
  $scriptPath = Join-Path $repoRoot $service.stopScript
  if (-not (Test-Path $scriptPath)) {
    continue
  }

  if ($service.key -eq "backend") {
    & $scriptPath -Port $port | Out-Null
    continue
  }

  & $scriptPath | Out-Null
}

Write-Host "Gail stack stopped."
