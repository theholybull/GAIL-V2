param(
  [int]$Port = 4180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $repoRoot "data\runtime\backend.pid"
$supervisorPidPath = Join-Path $repoRoot "data\runtime\backend.supervisor.pid"
$stopFlagPath = Join-Path $repoRoot "data\runtime\backend.stop"

New-Item -ItemType File -Force -Path $stopFlagPath | Out-Null

$pidValue = $null
$listener = $null

try {
  $supervisorPidValue = Get-Content -Path $supervisorPidPath -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($supervisorPidValue) {
    try {
      Stop-Process -Id ([int]$supervisorPidValue) -Force -ErrorAction Stop
    }
    catch {
    }
  }

  $supervisorProcesses = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*backend-supervisor.ps1*" }

  foreach ($process in @($supervisorProcesses)) {
    try {
      Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
    }
    catch {
    }
  }

  if (-not (Test-Path $pidPath)) {
    Remove-Item $supervisorPidPath -ErrorAction SilentlyContinue
    $pidValue = $null
  }
  else {
    $pidValue = Get-Content -Path $pidPath -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $pidValue) {
      Remove-Item $pidPath -ErrorAction SilentlyContinue
    }
  }

  if ($pidValue) {
    try {
      Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
    }
    catch {
    }
  }

  Remove-Item $pidPath -ErrorAction SilentlyContinue
  Remove-Item $supervisorPidPath -ErrorAction SilentlyContinue

  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty OwningProcess

  if ($listener) {
    try {
      Stop-Process -Id $listener -Force -ErrorAction Stop
    }
    catch {
    }
  }
}
finally {
  # Always clear the stop marker so a subsequent start is not blocked by stale state.
  Remove-Item $stopFlagPath -ErrorAction SilentlyContinue
}

if ($pidValue -or $listener) {
  Write-Output "STOPPED:$pidValue"
}
else {
  Write-Output "NOT_RUNNING"
}