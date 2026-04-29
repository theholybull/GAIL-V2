param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$AssetRoot = "gail_lite"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
$storage = Initialize-GailStorageEnv -RepoRoot $repoRoot
$runtimeDir = $storage.runtimeDir
$statusPath = Join-Path $runtimeDir "stack.status.json"
$backendPidPath = Join-Path $runtimeDir "backend.pid"
$supervisorPidPath = Join-Path $runtimeDir "backend.supervisor.pid"

function Get-FirstLine {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return $null
  }

  return Get-Content -Path $Path -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Test-ProcessId {
  param([object]$PidValue)

  if (-not $PidValue) {
    return $false
  }

  try {
    $process = Get-Process -Id ([int]$PidValue) -ErrorAction Stop
    return [bool]$process
  }
  catch {
    return $false
  }
}

function Invoke-JsonProbe {
  param([string]$Uri)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 5
    $body = $null
    if ($response.Content) {
      $body = $response.Content | ConvertFrom-Json
    }

    return [pscustomobject]@{
      ok = ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300)
      statusCode = [int]$response.StatusCode
      body = $body
      error = $null
    }
  }
  catch {
    return [pscustomobject]@{
      ok = $false
      statusCode = 0
      body = $null
      error = $_.Exception.Message
    }
  }
}

$gitHead = ""
$gitBranch = ""
$gitDirtyCount = 0
try {
  $gitHead = (git -C $repoRoot rev-parse --short HEAD).Trim()
  $gitBranch = (git -C $repoRoot branch --show-current).Trim()
  $gitDirtyCount = (git -C $repoRoot status --short | Measure-Object).Count
}
catch {
  $gitHead = "unavailable"
  $gitBranch = "unavailable"
}

$backendPid = Get-FirstLine -Path $backendPidPath
$supervisorPid = Get-FirstLine -Path $supervisorPidPath
$health = Invoke-JsonProbe -Uri "$BaseUrl/health"
$runtimeSettings = Invoke-JsonProbe -Uri "$BaseUrl/client/runtime-settings"
$assetManifest = Invoke-JsonProbe -Uri "$BaseUrl/client/asset-manifest?assetRoot=$AssetRoot"
$stackStatus = $null
if (Test-Path $statusPath) {
  try {
    $rawStackStatus = Get-Content -Raw -Path $statusPath | ConvertFrom-Json
    $stackStatus = [ordered]@{
      startedAt = [string]$rawStackStatus.startedAt
      baseUrl = [string]$rawStackStatus.baseUrl
      bindHost = [string]$rawStackStatus.bindHost
      authMode = [string]$rawStackStatus.authMode
      nodeDir = [string]$rawStackStatus.nodeDir
      manifestVersion = [string]$rawStackStatus.manifestVersion
    }
  }
  catch {
    $stackStatus = $null
  }
}

$manifestResolvedRoot = $null
$manifestReady = $false
if ($assetManifest.ok -and $assetManifest.body) {
  if ($assetManifest.body | Get-Member -Name resolvedRoot -ErrorAction SilentlyContinue) {
    $manifestResolvedRoot = [string]$assetManifest.body.resolvedRoot
  }
  if ($assetManifest.body | Get-Member -Name ready -ErrorAction SilentlyContinue) {
    $manifestReady = [bool]$assetManifest.body.ready
  }
  if ($assetManifest.body | Get-Member -Name avatarReady -ErrorAction SilentlyContinue) {
    $manifestReady = [bool]$assetManifest.body.avatarReady
  }
}

$latestBackup = Get-ChildItem -LiteralPath (Join-Path (Split-Path -Parent $repoRoot) "lockdown-backups") -Directory -Filter "working_copy_lockdown_*" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

$childRunning = Test-ProcessId -PidValue $backendPid
$supervisorRunning = Test-ProcessId -PidValue $supervisorPid
$latestBackupPath = if ($latestBackup) { $latestBackup.FullName } else { "none found" }
$stackLine = if ($stackStatus) {
  "startedAt=$($stackStatus.startedAt); baseUrl=$($stackStatus.baseUrl); authMode=$($stackStatus.authMode); nodeDir=$($stackStatus.nodeDir)"
}
else {
  "none"
}

Write-Output "Gail status generated at $(Get-Date -Format s)"
Write-Output "Repo: $repoRoot"
Write-Output "Git: branch=$gitBranch head=$gitHead dirtyCount=$gitDirtyCount"
Write-Output "Backend: baseUrl=$BaseUrl childPid=$backendPid childRunning=$childRunning supervisorPid=$supervisorPid supervisorRunning=$supervisorRunning healthOk=$($health.ok) healthStatusCode=$($health.statusCode)"
Write-Output "Runtime: settingsOk=$($runtimeSettings.ok) assetRoot=$AssetRoot assetManifestOk=$($assetManifest.ok) avatarReady=$manifestReady resolvedRoot=$manifestResolvedRoot"
Write-Output "Stack status: $stackLine"
Write-Output "Latest lockdown backup: $latestBackupPath"
Write-Output "GitHub snapshot branch: backup/d-root-lockdown-20260429"
