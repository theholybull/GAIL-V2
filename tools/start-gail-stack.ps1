param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$BindHost = "0.0.0.0",
  [string]$AuthMode = "",
  [switch]$ForceRestart,
  [switch]$BuildFirst
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot
Set-GailNodePath -NodeDir $nodeDir
$storage = Initialize-GailStorageEnv -RepoRoot $repoRoot
$manifest = Get-GailStackManifest -RepoRoot $repoRoot

if ($BuildFirst) {
  & (Join-Path $PSScriptRoot "build-node-projects.ps1")
}

foreach ($service in @($manifest.services)) {
  if (-not $service.required) {
    continue
  }

  $scriptPath = Join-Path $repoRoot $service.startScript
  if ($service.key -eq "backend") {
    & $scriptPath -BaseUrl $BaseUrl -BindHost $BindHost -AuthMode $AuthMode -ForceRestart:$ForceRestart | Out-Null
    continue
  }

  & $scriptPath | Out-Null
}

$statusPath = Join-Path $storage.runtimeDir "stack.status.json"
$status = [pscustomobject]@{
  startedAt = (Get-Date).ToString("s")
  baseUrl = $BaseUrl
  bindHost = $BindHost
  authMode = $(if ($AuthMode) { $AuthMode } else { "open" })
  nodeDir = $nodeDir
  manifestVersion = $manifest.version
}
$status | ConvertTo-Json -Depth 6 | Set-Content -Path $statusPath -Encoding UTF8

Write-Host "Gail stack started."
Write-Host ("Node: {0}" -f $nodeDir)
Write-Host ("Status: {0}" -f $statusPath)
& (Join-Path $PSScriptRoot "show-access.ps1") -BaseUrl $BaseUrl
