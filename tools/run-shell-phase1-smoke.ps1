param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Endpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Method,
    [hashtable]$Headers,
    [object]$Body,
    [int[]]$ExpectedStatus = @(200)
  )

  $uri = "$BaseUrl$Path"
  $result = [ordered]@{
    name = $Name
    method = $Method
    path = $Path
    pass = $false
    status = $null
    detail = ""
  }

  try {
    $params = @{
      Uri = $uri
      Method = $Method
      TimeoutSec = 15
      ErrorAction = "Stop"
      UseBasicParsing = $true
    }
    if ($Headers) {
      $params.Headers = $Headers
    }
    if ($Body -ne $null) {
      $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    $response = Invoke-WebRequest @params
    $result.status = [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response) {
      $result.status = [int]$_.Exception.Response.StatusCode
    } else {
      $result.detail = $_.Exception.Message
    }
  }

  if ($ExpectedStatus -contains $result.status) {
    $result.pass = $true
  } elseif (-not $result.detail) {
    $result.detail = "Expected status $($ExpectedStatus -join ',') but received $($result.status)."
  }

  return [pscustomobject]$result
}

$operatorHeaders = @{
  "x-gail-device-id" = "phase1-smoke"
  "x-gail-device-type" = "web_admin"
  "x-gail-mode" = "work"
  "x-gail-explicit-local-save" = "false"
  "Content-Type" = "application/json"
}

$checks = @(
  (Test-Endpoint -Name "Health" -Path "/health" -Method "GET"),
  (Test-Endpoint -Name "Studio Alias Redirect" -Path "/studio" -Method "GET" -ExpectedStatus @(200, 302)),
  (Test-Endpoint -Name "Studio Shell Page" -Path "/panel/operator-studio-shell.html" -Method "GET"),
  (Test-Endpoint -Name "Display Alias Redirect" -Path "/display" -Method "GET" -ExpectedStatus @(200, 302)),
  (Test-Endpoint -Name "Work Lite Client" -Path "/client/work-lite/" -Method "GET"),
  (Test-Endpoint -Name "Build Overview API" -Path "/build/overview" -Method "GET" -Headers $operatorHeaders),
  (Test-Endpoint -Name "Governance History API" -Path "/governance/history?limit=5" -Method "GET" -Headers $operatorHeaders),
  (Test-Endpoint -Name "Runtime Settings API" -Path "/client/runtime-settings" -Method "GET" -Headers $operatorHeaders),
  (Test-Endpoint -Name "Asset Manifest API" -Path "/client/asset-manifest" -Method "GET" -Headers $operatorHeaders)
)

$passed = @($checks | Where-Object { $_.pass }).Count
$failed = @($checks | Where-Object { -not $_.pass }).Count
$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  passed = $passed
  failed = $failed
  timestamp = (Get-Date).ToString("o")
  checks = $checks
}

$summary | ConvertTo-Json -Depth 8

if ($failed -gt 0) {
  exit 1
}
