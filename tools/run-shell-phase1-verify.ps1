param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$routeSmoke = Join-Path $toolsDir "run-shell-phase1-smoke.ps1"
$actionSmoke = Join-Path $toolsDir "run-shell-phase1-actions-smoke.ps1"
$linksAndScriptsSmoke = Join-Path $toolsDir "run-shell-phase1-links-scripts-smoke.ps1"

if (-not (Test-Path $routeSmoke)) {
  throw "Missing route smoke script: $routeSmoke"
}
if (-not (Test-Path $actionSmoke)) {
  throw "Missing action smoke script: $actionSmoke"
}
if (-not (Test-Path $linksAndScriptsSmoke)) {
  throw "Missing links/scripts smoke script: $linksAndScriptsSmoke"
}

$runs = New-Object System.Collections.Generic.List[object]

function Invoke-SmokeScript {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Path
  )
  & powershell -NoProfile -ExecutionPolicy Bypass -File $Path -BaseUrl $BaseUrl
  $exitCode = $LASTEXITCODE
  $runs.Add([pscustomobject]@{
    name = $Name
    path = $Path
    pass = ($exitCode -eq 0)
    exitCode = $exitCode
  })
}

Invoke-SmokeScript -Name "Phase1RouteAndApiSmoke" -Path $routeSmoke
Invoke-SmokeScript -Name "Phase1WorkflowActionSmoke" -Path $actionSmoke
Invoke-SmokeScript -Name "Phase1LinksAndScriptsSmoke" -Path $linksAndScriptsSmoke

$failed = @($runs | Where-Object { -not $_.pass }).Count
$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  passed = @($runs | Where-Object { $_.pass }).Count
  failed = $failed
  timestamp = (Get-Date).ToString("o")
  runs = $runs
}

$summary | ConvertTo-Json -Depth 8
if ($failed -gt 0) {
  exit 1
}
