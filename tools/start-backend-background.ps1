param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$BindHost = "0.0.0.0",
  [string]$AuthMode = "",
  [switch]$ForceRestart
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Clear-BackendStopFlag {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [int]$Attempts = 20,
    [int]$SleepMilliseconds = 150
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    Remove-Item -LiteralPath $Path -ErrorAction SilentlyContinue
    if (-not (Test-Path $Path)) {
      return $true
    }
    Start-Sleep -Milliseconds $SleepMilliseconds
  }

  return (-not (Test-Path $Path))
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
. (Join-Path $PSScriptRoot "common.ps1")
$storage = Initialize-GailStorageEnv -RepoRoot $repoRoot
$runtimeDir = $storage.runtimeDir
$dataDir = $storage.dataDir
$privateDataDir = $storage.privateDataDir
$nodeDir = Resolve-GailNodeDir -RepoRoot $repoRoot
$pidPath = Join-Path $runtimeDir "backend.pid"
$supervisorPidPath = Join-Path $runtimeDir "backend.supervisor.pid"
$stdoutPath = Join-Path $runtimeDir "backend.out.log"
$stderrPath = Join-Path $runtimeDir "backend.err.log"
$supervisorLogPath = Join-Path $runtimeDir "backend.supervisor.log"
$stopFlagPath = Join-Path $runtimeDir "backend.stop"
$launchNotePath = Join-Path $runtimeDir "backend.launch.txt"
$backendUri = [Uri]$BaseUrl
$backendPort = $backendUri.Port

if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  throw "node.exe not found under $nodeDir"
}

if (Test-Path $supervisorPidPath) {
  $existingPid = Get-Content -Path $supervisorPidPath -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existingPid -and -not $ForceRestart) {
    try {
      $existingProcess = Get-Process -Id ([int]$existingPid) -ErrorAction Stop
      if ($existingProcess) {
        & (Join-Path $PSScriptRoot "wait-backend-ready.ps1") -BaseUrl $BaseUrl -TimeoutSeconds 8 | Out-Null
        Write-Output "ALREADY_RUNNING:$existingPid"
        exit 0
      }
    }
    catch {
    }
  }
}

if ($ForceRestart) {
  & (Join-Path $PSScriptRoot "stop-backend.ps1") -Port $backendPort | Out-Null
}

Remove-Item $stdoutPath,$stderrPath,$supervisorLogPath -ErrorAction SilentlyContinue
$stopFlagCleared = Clear-BackendStopFlag -Path $stopFlagPath
if (-not $stopFlagCleared) {
  throw "Backend stop flag could not be cleared at $stopFlagPath."
}

Set-GailNodePath -NodeDir $nodeDir
$env:GAIL_BACKEND_HOST = $BindHost
if ($AuthMode) {
  $env:GAIL_AUTH_MODE = $AuthMode
}

$supervisorScript = Join-Path $PSScriptRoot "backend-supervisor.ps1"
$quotedSupervisorScript = '"' + $supervisorScript + '"'
$quotedRepoRoot = '"' + $repoRoot + '"'
$quotedBaseUrl = '"' + $BaseUrl + '"'
$quotedBindHost = '"' + $BindHost + '"'

$argumentList = "-NoProfile -ExecutionPolicy Bypass -File $quotedSupervisorScript -RepoRoot $quotedRepoRoot -BaseUrl $quotedBaseUrl -BindHost $quotedBindHost"
if ($AuthMode) {
  $escapedAuthMode = $AuthMode.Replace('"', '\"')
  $argumentList += " -AuthMode `"$escapedAuthMode`""
}

$process = Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList $argumentList `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $supervisorPidPath -Value ([string]$process.Id) -Encoding UTF8
Set-Content -Path $launchNotePath -Value "Backend launcher started backend-supervisor.ps1, which keeps the Node backend running and restarts it if it exits unexpectedly." -Encoding UTF8

try {
  & (Join-Path $PSScriptRoot "wait-backend-ready.ps1") -BaseUrl $BaseUrl -TimeoutSeconds 45 | Out-Null
}
catch {
  $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
  if ($running) {
    try {
      Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/health" -TimeoutSec 5 | Out-Null
      Write-Output "STARTED:$($process.Id)"
      exit 0
    }
    catch {
    }
  }
  $launchNote = if (Test-Path $launchNotePath) { Get-Content -Raw -Path $launchNotePath } else { "" }
  throw "Backend failed to become ready. ProcessRunning=$([bool]$running).`nLaunchNote:`n$launchNote"
}

Write-Output "STARTED:$($process.Id)"