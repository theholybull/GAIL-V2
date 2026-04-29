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
    "x-gail-device-id" = "phase4-verify"
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
$clientMainPath = "d:\Gail\playcanvas-app\src\main.ts"

if (Test-Path (Join-Path $toolsDir "run-shell-phase3-verify.ps1")) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $toolsDir "run-shell-phase3-verify.ps1") -BaseUrl $BaseUrl | Out-Null
  Add-Result -Results $results -Name "Phase 3 verify dependency" -Pass ($LASTEXITCODE -eq 0) -Detail "exitCode=$LASTEXITCODE"
} else {
  Add-Result -Results $results -Name "Phase 3 verify dependency" -Pass $false -Detail "Missing run-shell-phase3-verify.ps1"
}

try {
  $profiles = Invoke-GailJson -Method "GET" -Path "/client/device-display-profiles" -Body $null
  $count = if ($profiles.profiles -is [System.Array]) { @($profiles.profiles).Count } else { 0 }
  Add-Result -Results $results -Name "Device display profiles endpoint wired" -Pass ($count -ge 1) -Detail "profiles=$count selected=$($profiles.selectedDeviceId)"
} catch {
  Add-Result -Results $results -Name "Device display profiles endpoint wired" -Pass $false -Detail $_.Exception.Message
}

try {
  $patchedProfiles = Invoke-GailJson -Method "PATCH" -Path "/client/device-display-profiles" -Body @{ selectedDeviceId = "laptop" }
  $ok = ($patchedProfiles.selectedDeviceId -eq "laptop")
  Add-Result -Results $results -Name "Device display profile selection patch wired" -Pass $ok -Detail "selected=$($patchedProfiles.selectedDeviceId)"
} catch {
  Add-Result -Results $results -Name "Device display profile selection patch wired" -Pass $false -Detail $_.Exception.Message
}

try {
  $runtime = Invoke-GailJson -Method "PATCH" -Path "/client/runtime-settings" -Body @{ displayInputMode = "typed" }
  $ok = ($runtime.displayInputMode -eq "typed")
  Add-Result -Results $results -Name "Runtime display input mode patch wired" -Pass $ok -Detail "displayInputMode=$($runtime.displayInputMode)"
  $null = Invoke-GailJson -Method "PATCH" -Path "/client/runtime-settings" -Body @{ displayInputMode = "wake_word" }
} catch {
  Add-Result -Results $results -Name "Runtime display input mode patch wired" -Pass $false -Detail $_.Exception.Message
}

try {
  $voice = Invoke-GailJson -Method "PATCH" -Path "/voice/settings" -Body @{ mode = "always_listening" }
  $ok = ($voice.mode -eq "always_listening")
  Add-Result -Results $results -Name "Voice mode always_listening wired" -Pass $ok -Detail "mode=$($voice.mode)"
  $null = Invoke-GailJson -Method "PATCH" -Path "/voice/settings" -Body @{ mode = "wake_word" }
} catch {
  Add-Result -Results $results -Name "Voice mode always_listening wired" -Pass $false -Detail $_.Exception.Message
}

try {
  $startLocal = Test-Path "d:\Gail\tools\start-gail-local.ps1"
  $stopLocal = Test-Path "d:\Gail\tools\stop-gail-local.ps1"
  Add-Result -Results $results -Name "Local launcher scripts present" -Pass ($startLocal -and $stopLocal) -Detail "start=$startLocal stop=$stopLocal"
} catch {
  Add-Result -Results $results -Name "Local launcher scripts present" -Pass $false -Detail $_.Exception.Message
}

if (Test-Path $shellJsPath) {
  $shellJs = Get-Content -Raw -Path $shellJsPath
  $hasDisplayActions = $shellJs.Contains("display_refresh") -and $shellJs.Contains("display_apply")
  Add-Result -Results $results -Name "Shell display actions wired" -Pass $hasDisplayActions -Detail ($(if ($hasDisplayActions) { "present" } else { "missing" }))
} else {
  Add-Result -Results $results -Name "Shell display actions wired" -Pass $false -Detail "Missing $shellJsPath"
}

if (Test-Path $clientMainPath) {
  $mainTs = Get-Content -Raw -Path $clientMainPath
  $hasMenu = $mainTs.Contains("toggle-runtime-menu") -and $mainTs.Contains("runtime-input-mode")
  Add-Result -Results $results -Name "Work-lite runtime quick menu wired" -Pass $hasMenu -Detail ($(if ($hasMenu) { "present" } else { "missing" }))
} else {
  Add-Result -Results $results -Name "Work-lite runtime quick menu wired" -Pass $false -Detail "Missing $clientMainPath"
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

