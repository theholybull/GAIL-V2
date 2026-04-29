param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function To-Array {
  param([object]$Value)
  if ($null -eq $Value) { return @() }
  if ($Value -is [string]) { return @($Value) }
  if ($Value -is [System.Collections.IEnumerable]) { return @($Value) }
  return @($Value)
}

function Invoke-GailRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body
  )
  $headers = @{
    "x-gail-device-id" = "phase1-actions-smoke"
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
    $params.Body = ($Body | ConvertTo-Json -Depth 12)
  }
  return Invoke-RestMethod @params
}

$results = New-Object System.Collections.Generic.List[object]
function Add-Result {
  param([string]$Name, [bool]$Pass, [string]$Detail)
  $results.Add([pscustomobject]@{
    name = $Name
    pass = $Pass
    detail = $Detail
  })
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$workflow = Invoke-GailRequest -Method "POST" -Path "/workflows" -Body @{
  title = "Phase1 Actions Smoke $stamp"
  objective = "Validate core workflow action path for shell."
  providerPreference = "local-llm"
}
$planned = Invoke-GailRequest -Method "POST" -Path "/workflows/$($workflow.id)/plan" -Body @{}
$readyStep = $planned.step
if ($null -eq $readyStep) {
  $readyStep = To-Array($planned.workflow.steps) | Where-Object { $_.status -eq "ready" } | Select-Object -First 1
}
Add-Result -Name "CreateAndPlanWorkflow" -Pass ($null -ne $readyStep) -Detail "workflow=$($workflow.id)"
if (-not $readyStep) {
  $summary = [pscustomobject]@{
    baseUrl = $BaseUrl
    failed = 1
    passed = 0
    timestamp = (Get-Date).ToString("o")
    results = $results
  }
  $summary | ConvertTo-Json -Depth 8
  exit 1
}

Invoke-GailRequest -Method "POST" -Path "/build/steps/$($readyStep.id)/submit" -Body @{
  summary = "Phase 1 action smoke submission."
  artifactPaths = @("docs/PROFESSIONAL_SHELL_BUILD_PLAN.md")
} | Out-Null
Add-Result -Name "SubmitReadyStep" -Pass $true -Detail "step=$($readyStep.id)"

$gateStatus = 0
try {
  Invoke-GailRequest -Method "POST" -Path "/build/steps/$($readyStep.id)/approve" -Body @{
    decision = "approve"
    notes = "pre-evidence gate check"
    requireScreenshotEvidence = $true
  } | Out-Null
  $gateStatus = 200
} catch {
  if ($_.Exception.Response) {
    $gateStatus = [int]$_.Exception.Response.StatusCode
  } else {
    throw
  }
}
Add-Result -Name "ApprovalGateRequiresEvidence" -Pass ($gateStatus -eq 409) -Detail "status=$gateStatus"

$featureTag = "phase1-actions-$stamp"
$capture = Invoke-GailRequest -Method "POST" -Path "/build/screenshots/capture" -Body @{
  feature = $featureTag
  stepId = $readyStep.id
  label = "phase1-actions"
}
$analysis = Invoke-GailRequest -Method "POST" -Path "/build/screenshots/analyze" -Body @{
  feature = $featureTag
  stepId = $readyStep.id
  screenshotPath = $capture.screenshotPath
}
$captureExists = $false
if ($capture.screenshotPath) {
  if ([System.IO.Path]::IsPathRooted([string]$capture.screenshotPath)) {
    $captureExists = Test-Path -LiteralPath ([string]$capture.screenshotPath)
  } else {
    $capturePathCandidates = @(
      (Join-Path $repoRoot ([string]$capture.screenshotPath)),
      (Join-Path "d:\Gail" ([string]$capture.screenshotPath))
    )
    $captureExists = @($capturePathCandidates | Where-Object { Test-Path -LiteralPath $_ }).Count -ge 1
  }
}
Add-Result -Name "CaptureAndAnalyzeEvidence" -Pass (($capture.screenshotPath -ne $null) -and ($analysis.createdAt -ne $null) -and $captureExists) -Detail $capture.screenshotPath

Invoke-GailRequest -Method "POST" -Path "/build/steps/$($readyStep.id)/approve" -Body @{
  decision = "approve"
  notes = "approved after evidence"
  requireScreenshotEvidence = $true
} | Out-Null
$workflowAfter = Invoke-GailRequest -Method "GET" -Path "/workflows/$($workflow.id)"
$stepAfter = To-Array($workflowAfter.steps) | Where-Object { $_.id -eq $readyStep.id } | Select-Object -First 1
Add-Result -Name "ApproveCompletesStep" -Pass ($stepAfter.status -eq "completed") -Detail "status=$($stepAfter.status)"

$governanceChanges = To-Array(Invoke-GailRequest -Method "GET" -Path "/governance/changes")
$changeForStep = $governanceChanges | Where-Object { $_.sourceId -eq $readyStep.id } | Select-Object -First 1
Add-Result -Name "GovernanceChangeRecorded" -Pass ($null -ne $changeForStep) -Detail "sourceStep=$($readyStep.id)"

$rollback = Invoke-GailRequest -Method "POST" -Path "/governance/rollback/last-approved" -Body @{}
Add-Result -Name "RollbackLastApproved" -Pass (($rollback.changeId -ne $null) -and ($rollback.snapshotId -ne $null)) -Detail "change=$($rollback.changeId)"

$passCount = @($results | Where-Object { $_.pass }).Count
$failCount = @($results | Where-Object { -not $_.pass }).Count
$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  passed = $passCount
  failed = $failCount
  timestamp = (Get-Date).ToString("o")
  results = $results
}

$summary | ConvertTo-Json -Depth 8
if ($failCount -gt 0) {
  exit 1
}
