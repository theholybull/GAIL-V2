param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$BindHost = "0.0.0.0",
  [string]$AuthMode = "",
  [switch]$ForceRestart,
  [switch]$BuildFirst
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$startScript = Join-Path $PSScriptRoot "start-gail-stack.ps1"
if (-not (Test-Path $startScript)) {
  throw "Missing stack start script: $startScript"
}

& $startScript -BaseUrl $BaseUrl -BindHost $BindHost -AuthMode $AuthMode -ForceRestart:$ForceRestart -BuildFirst:$BuildFirst

