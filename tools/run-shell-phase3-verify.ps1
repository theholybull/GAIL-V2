param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Add-Result {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [string]$Name,
    [bool]$Pass,
    [string]$Detail
  )
  $Results.Add([pscustomobject]@{
    name = $Name
    pass = $Pass
    detail = $Detail
  })
}

function Invoke-GailJson {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body
  )
  $headers = @{
    "x-gail-device-id" = "phase3-verify"
    "x-gail-device-type" = "web_admin"
    "x-gail-mode" = "work"
    "x-gail-explicit-local-save" = "false"
    "Content-Type" = "application/json"
  }
  $params = @{
    Uri = "$BaseUrl$Path"
    Method = $Method
    Headers = $headers
    TimeoutSec = 20
    ErrorAction = "Stop"
  }
  if ($Body -ne $null) {
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }
  return Invoke-RestMethod @params
}

$results = New-Object System.Collections.Generic.List[object]
$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$shellJsPath = "d:\Gail\web-control-panel\src\operator-studio-shell.js"

if (Test-Path (Join-Path $toolsDir "run-shell-phase2-verify.ps1")) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $toolsDir "run-shell-phase2-verify.ps1") -BaseUrl $BaseUrl | Out-Null
  Add-Result -Results $results -Name "Phase 2 verify dependency" -Pass ($LASTEXITCODE -eq 0) -Detail "exitCode=$LASTEXITCODE"
} else {
  Add-Result -Results $results -Name "Phase 2 verify dependency" -Pass $false -Detail "Missing run-shell-phase2-verify.ps1"
}

if (Test-Path (Join-Path $toolsDir "run-shell-phase1-links-scripts-smoke.ps1")) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $toolsDir "run-shell-phase1-links-scripts-smoke.ps1") -BaseUrl $BaseUrl | Out-Null
  Add-Result -Results $results -Name "Phase 1 links/scripts dependency" -Pass ($LASTEXITCODE -eq 0) -Detail "exitCode=$LASTEXITCODE"
} else {
  Add-Result -Results $results -Name "Phase 1 links/scripts dependency" -Pass $false -Detail "Missing run-shell-phase1-links-scripts-smoke.ps1"
}

try {
  $intentCommand = Invoke-GailJson -Method "POST" -Path "/control/intents" -Body @{
    text = "open build control tower"
    source = "typed"
    autoPlan = $true
  }
  $intentCommandOk = ($intentCommand.action -eq "command") -and ($intentCommand.status -in @("accepted", "planned"))
  Add-Result -Results $results -Name "Control intent routes command phrasing" -Pass $intentCommandOk -Detail "action=$($intentCommand.action) status=$($intentCommand.status)"
} catch {
  Add-Result -Results $results -Name "Control intent routes command phrasing" -Pass $false -Detail $_.Exception.Message
}

try {
  $intentWorkflow = Invoke-GailJson -Method "POST" -Path "/control/intents" -Body @{
    text = "create a structured follow-up workflow for customer quote review and approvals"
    source = "typed"
    autoPlan = $true
  }
  $intentWorkflowOk = ($intentWorkflow.action -eq "workflow") -and ($intentWorkflow.workflow.plannedStepCount -ge 1)
  Add-Result -Results $results -Name "Control intent creates planned workflow" -Pass $intentWorkflowOk -Detail "action=$($intentWorkflow.action) steps=$($intentWorkflow.workflow.plannedStepCount)"
} catch {
  Add-Result -Results $results -Name "Control intent creates planned workflow" -Pass $false -Detail $_.Exception.Message
}

try {
  $history = Invoke-GailJson -Method "GET" -Path "/governance/history?limit=20" -Body $null
  $historyCount = if ($history -is [System.Array]) { @($history).Count } elseif ($history.events) { @($history.events).Count } else { 0 }
  Add-Result -Results $results -Name "Governance history available for audit panel" -Pass ($historyCount -ge 1) -Detail "events=$historyCount"
} catch {
  Add-Result -Results $results -Name "Governance history available for audit panel" -Pass $false -Detail $_.Exception.Message
}

if (Test-Path $shellJsPath) {
  $shellJs = Get-Content -Raw -Path $shellJsPath
  $hasQuickActions = $shellJs.Contains("COMMAND_PALETTE_QUICK_ACTIONS")
  $hasHotkeys = $shellJs.Contains("event.key.toLowerCase() === ""k""") -and
    $shellJs.Contains("event.key.toLowerCase() === ""l""") -and
    $shellJs.Contains("event.key.toLowerCase() === ""g""") -and
    $shellJs.Contains("event.key === ""1""") -and
    $shellJs.Contains("event.key === ""2""") -and
    $shellJs.Contains("event.key === ""3""") -and
    $shellJs.Contains("event.key === ""4""")
  $hasReviewQueueAction = $shellJs.Contains("workflow_open_review_queue")
  Add-Result -Results $results -Name "Command palette quick actions wired" -Pass $hasQuickActions -Detail ($(if ($hasQuickActions) { "present" } else { "missing" }))
  Add-Result -Results $results -Name "Keyboard-first hotkeys wired" -Pass $hasHotkeys -Detail ($(if ($hasHotkeys) { "present" } else { "missing one or more hotkeys" }))
  Add-Result -Results $results -Name "Workflow review queue checkpoint action wired" -Pass $hasReviewQueueAction -Detail ($(if ($hasReviewQueueAction) { "present" } else { "missing" }))
} else {
  Add-Result -Results $results -Name "Shell source file exists" -Pass $false -Detail "Missing $shellJsPath"
}

$passed = @($results | Where-Object { $_.pass }).Count
$failed = @($results | Where-Object { -not $_.pass }).Count
$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  passed = $passed
  failed = $failed
  timestamp = (Get-Date).ToString("o")
  results = $results
}

$summary | ConvertTo-Json -Depth 8
if ($failed -gt 0) {
  exit 1
}
