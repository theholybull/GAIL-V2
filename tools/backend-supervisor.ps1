param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [Parameter(Mandatory = $true)][string]$BindHost,
  [string]$AuthMode = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $RepoRoot "tools\common.ps1")

$storage = Initialize-GailStorageEnv -RepoRoot $RepoRoot
$runtimeDir = $storage.runtimeDir
$backendDir = Join-Path $RepoRoot "backend"
$nodeDir = Resolve-GailNodeDir -RepoRoot $RepoRoot
$nodeExe = Join-Path $NodeDir "node.exe"
$backendPidPath = Join-Path $runtimeDir "backend.pid"
$supervisorPidPath = Join-Path $runtimeDir "backend.supervisor.pid"
$stdoutPath = Join-Path $runtimeDir "backend.out.log"
$stderrPath = Join-Path $runtimeDir "backend.err.log"
$supervisorLogPath = Join-Path $runtimeDir "backend.supervisor.log"
$stopFlagPath = Join-Path $runtimeDir "backend.stop"

Set-GailNodePath -NodeDir $NodeDir
$env:GAIL_BACKEND_HOST = $BindHost
if ($AuthMode) {
  $env:GAIL_AUTH_MODE = $AuthMode
}

Set-Content -Path $supervisorPidPath -Value ([string]$PID) -Encoding UTF8
"[$(Get-Date -Format s)] Supervisor started for $BaseUrl using $nodeExe" | Add-Content -Path $supervisorLogPath

if (Test-Path $stopFlagPath) {
  try {
    Remove-Item -LiteralPath $stopFlagPath -ErrorAction Stop
    "[$(Get-Date -Format s)] Removed stale stop flag before first launch." | Add-Content -Path $supervisorLogPath
  }
  catch {
    "[$(Get-Date -Format s)] Stop flag exists before first launch and could not be removed: $($_.Exception.Message)" | Add-Content -Path $supervisorLogPath
  }
}

$restartDelaySeconds = 3
$consecutiveFailures = 0
$maxConsecutiveFailures = 5

try {
  while ($true) {
    if (Test-Path $stopFlagPath) {
      "[$(Get-Date -Format s)] Stop flag detected before launch. Exiting supervisor." | Add-Content -Path $supervisorLogPath
      break
    }

    $process = Start-Process `
      -FilePath $nodeExe `
      -ArgumentList "dist/backend/server.js" `
      -WorkingDirectory $backendDir `
      -PassThru

    Set-Content -Path $backendPidPath -Value ([string]$process.Id) -Encoding UTF8
    "[$(Get-Date -Format s)] Backend child started with pid $($process.Id)." | Add-Content -Path $supervisorLogPath

    Wait-Process -Id $process.Id
    $exitCode = $process.ExitCode
    Remove-Item $backendPidPath -ErrorAction SilentlyContinue
    "[$(Get-Date -Format s)] Backend child exited with code $exitCode." | Add-Content -Path $supervisorLogPath

    if (Test-Path $stopFlagPath) {
      "[$(Get-Date -Format s)] Stop flag detected after child exit. Supervisor will not restart backend." | Add-Content -Path $supervisorLogPath
      break
    }

    if ($exitCode -eq 0) {
      $consecutiveFailures = 0
    }
    else {
      $consecutiveFailures += 1
      if ($consecutiveFailures -ge $maxConsecutiveFailures) {
        "[$(Get-Date -Format s)] Backend child failed $consecutiveFailures times in a row. Supervisor is exiting instead of looping." | Add-Content -Path $supervisorLogPath
        break
      }
    }

    Start-Sleep -Seconds $restartDelaySeconds
  }
}
finally {
  Remove-Item $backendPidPath -ErrorAction SilentlyContinue
  Remove-Item $supervisorPidPath -ErrorAction SilentlyContinue
  Remove-Item $stopFlagPath -ErrorAction SilentlyContinue
  "[$(Get-Date -Format s)] Supervisor exited." | Add-Content -Path $supervisorLogPath
}