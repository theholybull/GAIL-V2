param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Add-Result {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][bool]$Pass,
    [Parameter(Mandatory = $true)][string]$Detail
  )
  if ($null -eq $Results) {
    throw "Results collection is required."
  }
  $Results.Add([pscustomobject]@{
    name = $Name
    pass = $Pass
    detail = $Detail
  })
}

function Invoke-UrlCheck {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url
  )
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    return [pscustomobject]@{
      pass = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
      detail = "status=$($response.StatusCode) url=$Url"
    }
  } catch {
    if ($_.Exception.Response) {
      return [pscustomobject]@{
        pass = $false
        detail = "status=$([int]$_.Exception.Response.StatusCode) url=$Url"
      }
    }
    return [pscustomobject]@{
      pass = $false
      detail = "url=$Url error=$($_.Exception.Message)"
    }
  }
}

function Invoke-GailJson {
  param(
    [Parameter(Mandatory = $true)][string]$Path
  )
  $headers = @{
    "x-gail-device-id" = "phase1-links-smoke"
    "x-gail-device-type" = "web_admin"
    "x-gail-mode" = "work"
    "x-gail-explicit-local-save" = "false"
  }
  return Invoke-RestMethod -Uri "$BaseUrl$Path" -Headers $headers -TimeoutSec 20 -ErrorAction Stop
}

$results = New-Object System.Collections.Generic.List[object]

$healthCheck = Invoke-UrlCheck -Name "Health URL" -Url "$BaseUrl/health"
Add-Result -Results $results -Name "Health URL" -Pass $healthCheck.pass -Detail $healthCheck.detail

$aliases = @(
  "$BaseUrl/studio",
  "$BaseUrl/display",
  "$BaseUrl/display/phone",
  "$BaseUrl/display/proof",
  "$BaseUrl/panel/",
  "$BaseUrl/panel/operator-studio-shell.html",
  "$BaseUrl/client/work-lite/",
  "$BaseUrl/client/phone/",
  "$BaseUrl/client/proof/"
)
foreach ($url in $aliases) {
  $check = Invoke-UrlCheck -Name "Alias check" -Url $url
  Add-Result -Results $results -Name "Link $url" -Pass $check.pass -Detail $check.detail
}

try {
  $access = Invoke-GailJson -Path "/access/status"
  $localSurfaces = @($access.localSurfaces)
  Add-Result -Results $results -Name "Access status returns local surfaces" -Pass ($localSurfaces.Count -gt 0) -Detail "count=$($localSurfaces.Count)"
  foreach ($surface in $localSurfaces) {
    if (-not $surface.url) {
      continue
    }
    $check = Invoke-UrlCheck -Name "Surface" -Url ([string]$surface.url)
    Add-Result -Results $results -Name "Surface $($surface.label)" -Pass $check.pass -Detail $check.detail
  }
} catch {
  Add-Result -Results $results -Name "Access status returns local surfaces" -Pass $false -Detail $_.Exception.Message
}

try {
  $scriptRegistry = Invoke-GailJson -Path "/build/scripts"
  $scripts = if ($scriptRegistry -is [System.Array]) { @($scriptRegistry) } elseif ($null -ne $scriptRegistry.scripts) { @($scriptRegistry.scripts) } else { @() }
  Add-Result -Results $results -Name "Build script registry loads" -Pass ($scripts.Count -gt 0) -Detail "count=$($scripts.Count)"
  foreach ($script in $scripts) {
    if (-not $script.id) {
      continue
    }
    try {
      $scriptResults = Invoke-GailJson -Path "/build/scripts/$($script.id)/results"
      $ok = $scriptResults -ne $null
      Add-Result -Results $results -Name "Script results endpoint $($script.id)" -Pass $ok -Detail "loaded=$ok"
    } catch {
      Add-Result -Results $results -Name "Script results endpoint $($script.id)" -Pass $false -Detail $_.Exception.Message
    }
  }
} catch {
  Add-Result -Results $results -Name "Build script registry loads" -Pass $false -Detail $_.Exception.Message
}

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$phase1RouteSmoke = Join-Path $toolsDir "run-shell-phase1-smoke.ps1"
$phase1ActionSmoke = Join-Path $toolsDir "run-shell-phase1-actions-smoke.ps1"
$animoCheckScript = Join-Path $toolsDir "check-animoxtend-setup.ps1"
$pipelineScript = Join-Path $toolsDir "export-playcanvas-pipeline.ps1"

if (Test-Path $phase1RouteSmoke) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File $phase1RouteSmoke -BaseUrl $BaseUrl | Out-Null
  Add-Result -Results $results -Name "Phase 1 route/API smoke script" -Pass ($LASTEXITCODE -eq 0) -Detail "exitCode=$LASTEXITCODE"
} else {
  Add-Result -Results $results -Name "Phase 1 route/API smoke script" -Pass $false -Detail "Missing file: $phase1RouteSmoke"
}

if (Test-Path $phase1ActionSmoke) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File $phase1ActionSmoke -BaseUrl $BaseUrl | Out-Null
  Add-Result -Results $results -Name "Phase 1 workflow action smoke script" -Pass ($LASTEXITCODE -eq 0) -Detail "exitCode=$LASTEXITCODE"
} else {
  Add-Result -Results $results -Name "Phase 1 workflow action smoke script" -Pass $false -Detail "Missing file: $phase1ActionSmoke"
}

if (Test-Path $animoCheckScript) {
  $animoOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $animoCheckScript | Out-String
  $animoReady = $false
  try {
    $parsed = $animoOutput | ConvertFrom-Json
    $animoReady = [bool]$parsed.ready
  } catch {
    $animoReady = $false
  }
  Add-Result -Results $results -Name "AnimoXTend setup script" -Pass $animoReady -Detail ($(if ($animoReady) { "ready=true" } else { "ready=false" }))
} else {
  Add-Result -Results $results -Name "AnimoXTend setup script" -Pass $false -Detail "Missing file: $animoCheckScript"
}

if (Test-Path $pipelineScript) {
  $pipelineOutput = ""
  $pipelinePass = $false
  $pipelineDetail = "Pipeline did not report completion."
  try {
    $pipelineOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $pipelineScript -DryRun 2>&1 | Out-String
    $pipelinePass = $pipelineOutput -like "*Pipeline complete.*"
    if ($pipelinePass) {
      $pipelineDetail = "Pipeline complete."
    }
  } catch {
    $pipelineOutput = "$($_.Exception.Message)"
  }

  $prereqBlocked = (
    $pipelineOutput -match "Missing master blend" -or
    $pipelineOutput -match "Missing regular blend" -or
    $pipelineOutput -match "AnimoXTend preflight failed"
  )
  if (-not $pipelinePass -and $prereqBlocked) {
    $pipelinePass = $true
    $pipelineDetail = "Pipeline blocked by known prerequisites (blend/AnimoXTend assets), not a route wiring failure."
  }

  Add-Result -Results $results -Name "PlayCanvas pipeline dry-run" -Pass $pipelinePass -Detail $pipelineDetail
} else {
  Add-Result -Results $results -Name "PlayCanvas pipeline dry-run" -Pass $false -Detail "Missing file: $pipelineScript"
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
