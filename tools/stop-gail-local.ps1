param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$stopScript = Join-Path $PSScriptRoot "stop-gail-stack.ps1"
if (-not (Test-Path $stopScript)) {
  throw "Missing stack stop script: $stopScript"
}

& $stopScript -BaseUrl $BaseUrl

