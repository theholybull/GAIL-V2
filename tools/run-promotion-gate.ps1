param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$BindHost = "0.0.0.0",
  [string]$AuthMode = "open",
  [switch]$SkipBackup,
  [switch]$KeepBackendRunning
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
$storage = Initialize-GailStorageEnv -RepoRoot $repoRoot
$reportDir = Join-Path $repoRoot "docs\reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$results = New-Object System.Collections.Generic.List[object]

function Add-GateResult {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Details
  )

  $results.Add([pscustomobject]@{
    name = $Name
    passed = $Passed
    details = $Details
  }) | Out-Null
}

function Invoke-GateStep {
  param(
    [string]$Name,
    [scriptblock]$Step
  )

  Write-Host "Gate: $Name"
  try {
    $global:LASTEXITCODE = 0
    & $Step
    if ($global:LASTEXITCODE -ne 0) {
      throw "Step exited with code $global:LASTEXITCODE."
    }
    Add-GateResult -Name $Name -Passed $true -Details "Completed."
  }
  catch {
    Add-GateResult -Name $Name -Passed $false -Details $_.Exception.Message
    throw
  }
}

try {
  if (-not $SkipBackup) {
    Invoke-GateStep -Name "Create lockdown backup" -Step {
      & (Join-Path $PSScriptRoot "create-lockdown-backup.ps1") | Out-Host
    }
  }
  else {
    Add-GateResult -Name "Create lockdown backup" -Passed $true -Details "Skipped by operator request."
  }

  Invoke-GateStep -Name "Build backend" -Step {
    & (Join-Path $PSScriptRoot "build-backend.ps1") | Out-Host
  }

  Invoke-GateStep -Name "Build web control panel" -Step {
    & (Join-Path $PSScriptRoot "build-control-panel.ps1") | Out-Host
  }

  Invoke-GateStep -Name "Build PlayCanvas app and validate animations" -Step {
    & (Join-Path $PSScriptRoot "build-playcanvas-app.ps1") | Out-Host
  }

  Invoke-GateStep -Name "Backend regression" -Step {
    & (Join-Path $PSScriptRoot "run-backend-tests.ps1") -BaseUrl $BaseUrl -EnsureBackend -ShutdownWhenDone -AuthMode $AuthMode | Out-Host
  }

  Invoke-GateStep -Name "Start D-root backend" -Step {
    & (Join-Path $PSScriptRoot "start-backend-background.ps1") -BaseUrl $BaseUrl -BindHost $BindHost -AuthMode $AuthMode -ForceRestart | Out-Host
  }

  Invoke-GateStep -Name "Route smoke" -Step {
    $health = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/health" -TimeoutSec 10
    if ([int]$health.StatusCode -ne 200) {
      throw "Health returned HTTP $($health.StatusCode)."
    }

    $settings = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/client/runtime-settings" -TimeoutSec 10
    if ([int]$settings.StatusCode -ne 200) {
      throw "Runtime settings returned HTTP $($settings.StatusCode)."
    }

    $assetManifestResponse = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/client/asset-manifest?assetRoot=gail_lite" -TimeoutSec 10
    if ([int]$assetManifestResponse.StatusCode -ne 200) {
      throw "Asset manifest returned HTTP $($assetManifestResponse.StatusCode)."
    }

    $assetManifest = $assetManifestResponse.Content | ConvertFrom-Json
    $manifestJson = $assetManifest | ConvertTo-Json -Depth 10
    if ($manifestJson -notlike "*$($repoRoot.Replace('\', '\\'))*" -and $manifestJson -notlike "*$repoRoot*") {
      throw "Asset manifest did not clearly reference the active repo root: $repoRoot"
    }
  }
}
finally {
  if (-not $KeepBackendRunning) {
    try {
      & (Join-Path $PSScriptRoot "stop-backend.ps1") -Port ([Uri]$BaseUrl).Port | Out-Null
    }
    catch {
    }
  }

  $passedCount = @($results | Where-Object { $_.passed }).Count
  $failedCount = @($results | Where-Object { -not $_.passed }).Count
  $summary = [pscustomobject]@{
    runId = $runId
    generatedAt = (Get-Date).ToString("s")
    repoRoot = $repoRoot
    baseUrl = $BaseUrl
    passed = $passedCount
    failed = $failedCount
    results = $results
  }

  $jsonPath = Join-Path $reportDir "promotion-gate-$runId.json"
  $mdPath = Join-Path $reportDir "promotion-gate-$runId.md"
  $summary | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

  $md = @()
  $md += "# Promotion Gate Report"
  $md += ""
  $md += "- Run ID: $runId"
  $md += "- Generated At: $(Get-Date -Format s)"
  $md += "- Repo Root: $repoRoot"
  $md += "- Base URL: $BaseUrl"
  $md += "- Passed: $passedCount"
  $md += "- Failed: $failedCount"
  $md += ""
  $md += "## Results"
  $md += ""
  foreach ($result in $results) {
    $status = if ($result.passed) { "PASS" } else { "FAIL" }
    $md += "- **$status** $($result.name): $($result.details)"
  }
  $md -join "`r`n" | Set-Content -Path $mdPath -Encoding UTF8

  Write-Host "Promotion gate report:"
  Write-Host $mdPath

  if ($failedCount -gt 0) {
    exit 1
  }
}
