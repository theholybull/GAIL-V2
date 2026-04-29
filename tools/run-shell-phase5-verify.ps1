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
    "x-gail-device-id" = "phase5-verify"
    "x-gail-device-type" = "web_admin"
    "x-gail-mode" = "work"
    "x-gail-explicit-local-save" = "false"
    "Content-Type" = "application/json"
  }
  $params = @{
    Uri = "$BaseUrl$Path"
    Method = $Method
    Headers = $headers
    TimeoutSec = 25
    ErrorAction = "Stop"
  }
  if ($Body -ne $null) {
    $params.Body = ($Body | ConvertTo-Json -Depth 12)
  }
  return Invoke-RestMethod @params
}

$results = New-Object System.Collections.Generic.List[object]
$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$shellJsPath = "d:\Gail\web-control-panel\src\operator-studio-shell.js"
$clientMainPath = "d:\Gail\playcanvas-app\src\main.ts"

if (Test-Path (Join-Path $toolsDir "run-shell-phase4-verify.ps1")) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $toolsDir "run-shell-phase4-verify.ps1") -BaseUrl $BaseUrl | Out-Null
  Add-Result -Results $results -Name "Phase 4 verify dependency" -Pass ($LASTEXITCODE -eq 0) -Detail "exitCode=$LASTEXITCODE"
} else {
  Add-Result -Results $results -Name "Phase 4 verify dependency" -Pass $false -Detail "Missing run-shell-phase4-verify.ps1"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$title = "Phase5 feature $stamp"
$details = "Verify backlog capture and promotion path."

try {
  $created = Invoke-GailJson -Method "POST" -Path "/backlog/features" -Body @{
    title = $title
    details = $details
    source = "typed"
    stageTarget = "next_round"
    priority = "high"
    capturedBy = "phase5-verify"
  }
  $createdOk = ($created.id -ne $null) -and ($created.title -eq $title)
  Add-Result -Results $results -Name "Backlog create endpoint wired" -Pass $createdOk -Detail "id=$($created.id)"

  $list = Invoke-GailJson -Method "GET" -Path "/backlog/features?status=pending" -Body $null
  $items = @()
  if ($null -ne $list.items) {
    $items = @($list.items)
  }
  $found = (@($items | Where-Object { $_.id -eq $created.id })).Count -ge 1
  Add-Result -Results $results -Name "Backlog list endpoint wired" -Pass $found -Detail "pendingItems=$(@($items).Count)"

  $updated = Invoke-GailJson -Method "PATCH" -Path "/backlog/features/$($created.id)" -Body @{
    status = "planned"
    priority = "critical"
  }
  $updateOk = ($updated.status -eq "planned") -and ($updated.priority -eq "critical")
  Add-Result -Results $results -Name "Backlog update endpoint wired" -Pass $updateOk -Detail "status=$($updated.status) priority=$($updated.priority)"

  $promoted = Invoke-GailJson -Method "POST" -Path "/backlog/features/$($created.id)/promote" -Body @{
    target = "task"
    reviewer = "phase5-verify"
  }
  $promoteOk = ($promoted.linkedTaskId -ne $null) -and ($promoted.status -eq "planned")
  Add-Result -Results $results -Name "Backlog promote endpoint wired" -Pass $promoteOk -Detail "linkedTaskId=$($promoted.linkedTaskId)"
} catch {
  Add-Result -Results $results -Name "Backlog endpoint flow" -Pass $false -Detail $_.Exception.Message
}

if (Test-Path $shellJsPath) {
  $shellJs = Get-Content -Raw -Path $shellJsPath
  $hasFeatureInbox = $shellJs.Contains("feature-inbox") -and $shellJs.Contains("feature_add") -and $shellJs.Contains("feature_promote_first")
  Add-Result -Results $results -Name "Shell feature inbox wiring present" -Pass $hasFeatureInbox -Detail ($(if ($hasFeatureInbox) { "present" } else { "missing" }))
} else {
  Add-Result -Results $results -Name "Shell feature inbox wiring present" -Pass $false -Detail "Missing $shellJsPath"
}

if (Test-Path $clientMainPath) {
  $mainTs = Get-Content -Raw -Path $clientMainPath
  $hasRuntimeFeatureButton = $mainTs.Contains("runtime-add-feature") -and $mainTs.Contains("addFeatureRequestFromRuntime")
  Add-Result -Results $results -Name "Display quick-menu feature capture wiring present" -Pass $hasRuntimeFeatureButton -Detail ($(if ($hasRuntimeFeatureButton) { "present" } else { "missing" }))
} else {
  Add-Result -Results $results -Name "Display quick-menu feature capture wiring present" -Pass $false -Detail "Missing $clientMainPath"
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

$summary | ConvertTo-Json -Depth 10
if ($failed -gt 0) {
  exit 1
}
