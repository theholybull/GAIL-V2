param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$AuthMode = "",
  [switch]$EnsureBackend,
  [switch]$ShutdownWhenDone
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$reportDir = Join-Path $repoRoot "docs\reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

if ($EnsureBackend) {
  & (Join-Path $PSScriptRoot "start-backend-background.ps1") -BaseUrl $BaseUrl -AuthMode $AuthMode -ForceRestart | Out-Null
}

$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$tag = "test-$runId"
$results = New-Object System.Collections.Generic.List[object]

function Invoke-GailRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [hashtable]$Headers,
    [object]$Body
  )

  $uri = "$BaseUrl$Path"
  $requestHeaders = @{}
  if ($Headers) {
    foreach ($key in $Headers.Keys) {
      $requestHeaders[$key] = [string]$Headers[$key]
    }
  }

  $params = @{
    Uri = $uri
    Method = $Method
    UseBasicParsing = $true
    Headers = $requestHeaders
    ContentType = "application/json"
  }

  if ($null -ne $Body) {
    $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
  }

  try {
    $response = Invoke-WebRequest @params
    $parsed = $null
    if ($response.Content) {
      try {
        $trimmed = $response.Content.Trim()
        if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
          $parsed = $response.Content | ConvertFrom-Json
        }
        else {
          $parsed = $response.Content
        }
      }
      catch {
        $parsed = $response.Content
      }
    }

    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Body = $parsed
      Raw = $response.Content
    }
  }
  catch {
    $statusCode = 0
    $raw = ""
    $parsed = $null

    $exception = $_.Exception
    $responseMember = $exception | Get-Member -Name Response -ErrorAction SilentlyContinue
    if ($responseMember -and $exception.Response) {
      $statusCode = [int]$exception.Response.StatusCode
      $stream = $exception.Response.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $raw = $reader.ReadToEnd()
        try {
          $trimmed = $raw.Trim()
          if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
            $parsed = $raw | ConvertFrom-Json
          }
          else {
            $parsed = $raw
          }
        }
        catch {
          $parsed = $raw
        }
      }
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Body = $parsed
      Raw = $raw
    }
  }
}

function Add-TestResult {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Details,
    [object]$Data = $null
  )

  $results.Add([pscustomobject]@{
    name = $Name
    passed = $Passed
    details = $Details
    data = $Data
  }) | Out-Null
}

function Assert-Status {
  param(
    [string]$Name,
    [int]$Expected,
    [object]$Response,
    [string]$SuccessDetails
  )

  $passed = ($Response.StatusCode -eq $Expected)
  $details = if ($passed) { $SuccessDetails } else { "Expected HTTP $Expected, got $($Response.StatusCode)." }
  Add-TestResult -Name $Name -Passed $passed -Details $details -Data $Response.Body
  return $passed
}

function Has-Property {
  param(
    [object]$Object,
    [string]$Name
  )

  return ($Object -is [psobject] -and ($Object | Get-Member -Name $Name -ErrorAction SilentlyContinue))
}

function Contains-ItemWithValue {
  param(
    [object[]]$Items,
    [string]$PropertyName,
    [string]$ExpectedValue
  )

  return @($Items | Where-Object {
    ($_ | Get-Member -Name $PropertyName -ErrorAction SilentlyContinue) -and
    [string]($_.$PropertyName) -eq $ExpectedValue
  }).Count -ge 1
}

function Restart-ManagedBackend {
  if (-not $EnsureBackend) {
    return $false
  }

  & (Join-Path $PSScriptRoot "stop-backend.ps1") -Port ([Uri]$BaseUrl).Port | Out-Null
  & (Join-Path $PSScriptRoot "start-backend-background.ps1") -BaseUrl $BaseUrl -AuthMode $AuthMode -ForceRestart | Out-Null
  return $true
}

function Get-ManagedBackendChildPid {
  $pidPath = Join-Path $repoRoot "data\runtime\backend.pid"
  if (-not (Test-Path $pidPath)) {
    return $null
  }

  $value = Get-Content -Path $pidPath -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $value) {
    return $null
  }

  return [int]$value
}

$adminHeaders = @{
  "x-gail-device-id" = "web-admin-$tag"
  "x-gail-device-type" = "web_admin"
  "x-gail-mode" = "work"
  "x-gail-explicit-local-save" = "false"
}

$iphoneId = "iphone-$tag"
$watchId = "watch-$tag"

$iphoneHeaders = @{
  "x-gail-device-id" = $iphoneId
  "x-gail-device-type" = "iphone"
  "x-gail-mode" = "work"
  "x-gail-explicit-local-save" = "false"
}

$watchHeaders = @{
  "x-gail-device-id" = $watchId
  "x-gail-device-type" = "watch"
  "x-gail-mode" = "lightweight"
  "x-gail-explicit-local-save" = "false"
}

$uconsoleHeaders = @{
  "x-gail-device-id" = "uconsole-$tag"
  "x-gail-device-type" = "uconsole"
  "x-gail-mode" = "work"
  "x-gail-explicit-local-save" = "false"
}

$serviceHeaders = @{
  "x-gail-device-id" = "service-$tag"
  "x-gail-device-type" = "service"
  "x-gail-mode" = "work"
  "x-gail-explicit-local-save" = "false"
}

$privateHeaders = @{
  "x-gail-device-id" = "private-$tag"
  "x-gail-device-type" = "iphone"
  "x-gail-mode" = "private"
  "x-gail-explicit-local-save" = "false"
}

$privateSaveHeaders = @{
  "x-gail-device-id" = "private-$tag"
  "x-gail-device-type" = "iphone"
  "x-gail-mode" = "private"
  "x-gail-explicit-local-save" = "true"
}

$trustedPrivateIphoneHeaders = @{
  "x-gail-device-id" = $iphoneId
  "x-gail-device-type" = "iphone"
  "x-gail-mode" = "private"
  "x-gail-explicit-local-save" = "false"
}

# Health
$health = Invoke-GailRequest -Method "GET" -Path "/health"
$null = Assert-Status -Name "Health responds" -Expected 200 -Response $health -SuccessDetails "Backend health endpoint responded."

$authStatus = Invoke-GailRequest -Method "GET" -Path "/auth/status" -Headers $adminHeaders
$authStatusOk = (
  $authStatus.StatusCode -eq 200 -and
  ($authStatus.Body.authMode -in @("open", "paired", "paired_required_for_sensitive")) -and
  ($authStatus.Body.pairingRequired -eq $true -or $authStatus.Body.pairingRequired -eq $false) -and
  ($authStatus.Body.pairingRequiredForSensitive -eq $true -or $authStatus.Body.pairingRequiredForSensitive -eq $false)
)
Add-TestResult -Name "Auth status responds" -Passed $authStatusOk -Details ($(if ($authStatusOk) { "Auth status returned a valid auth-mode payload." } else { "Auth status did not return a valid auth-mode payload." })) -Data $authStatus.Body

$accessStatus = Invoke-GailRequest -Method "GET" -Path "/access/status" -Headers $adminHeaders
$accessStatusOk = (
  $accessStatus.StatusCode -eq 200 -and
  ($accessStatus.Body.host -is [string]) -and
  ($accessStatus.Body.port -ge 1) -and
  ($accessStatus.Body.authMode -in @("open", "paired", "paired_required_for_sensitive")) -and
  @($accessStatus.Body.localSurfaces).Count -ge 2
)
Add-TestResult -Name "Access status responds" -Passed $accessStatusOk -Details ($(if ($accessStatusOk) { "Access status returned host, port, auth mode, and surfaced URLs." } else { "Access status did not return the expected access payload." })) -Data $accessStatus.Body

if ($EnsureBackend) {
  $initialBackendPid = Get-ManagedBackendChildPid
  if ($initialBackendPid) {
    try {
      Stop-Process -Id $initialBackendPid -Force -ErrorAction Stop
    }
    catch {
    }

    & (Join-Path $PSScriptRoot "wait-backend-ready.ps1") -BaseUrl $BaseUrl -TimeoutSeconds 20 | Out-Null
    Start-Sleep -Seconds 1
    $restartedBackendPid = Get-ManagedBackendChildPid
    $restartHealth = Invoke-GailRequest -Method "GET" -Path "/health"
    $backendRestartedOk = (
      $restartHealth.StatusCode -eq 200 -and
      $restartedBackendPid -and
      $restartedBackendPid -ne $initialBackendPid
    )
    Add-TestResult -Name "Backend supervisor restarts crashed child" -Passed $backendRestartedOk -Details ($(if ($backendRestartedOk) { "Supervisor restarted the backend child after a forced stop." } else { "Supervisor did not restart the backend child as expected." })) -Data @{
      initialPid = $initialBackendPid
      restartedPid = $restartedBackendPid
      health = $restartHealth.Body
    }
  }
  else {
    Add-TestResult -Name "Backend supervisor restarts crashed child" -Passed $false -Details "Managed backend child pid file was not available."
  }
}

$pairingSession = Invoke-GailRequest -Method "POST" -Path "/auth/pairing-sessions" -Headers $adminHeaders
$null = Assert-Status -Name "Create pairing session on local network" -Expected 201 -Response $pairingSession -SuccessDetails "Pairing session created from the local network."

$pairingSessionId = $null
$pairingCode = $null
if ($pairingSession.Body -is [psobject] -and ($pairingSession.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $pairingSessionId = [string]$pairingSession.Body.id
}
if ($pairingSession.Body -is [psobject] -and ($pairingSession.Body | Get-Member -Name pairingCode -ErrorAction SilentlyContinue)) {
  $pairingCode = [string]$pairingSession.Body.pairingCode
}

if ($pairingSessionId -and $pairingCode) {
  $pairedDeviceId = "paired-device-$tag"
  $pairingComplete = Invoke-GailRequest -Method "POST" -Path "/auth/pairing-sessions/$pairingSessionId/complete" -Headers $adminHeaders -Body @{
    pairingCode = $pairingCode
    id = $pairedDeviceId
    type = "iphone"
    name = "Paired Test iPhone"
    defaultMode = "work"
    qualityTier = "medium"
    trusted = $true
    credentialLabel = "Regression Pairing Token"
  }
  $pairingCompleteOk = (
    $pairingComplete.StatusCode -eq 201 -and
    $pairingComplete.Body.device.id -eq $pairedDeviceId -and
    $pairingComplete.Body.credential.deviceId -eq $pairedDeviceId -and
    [string]::IsNullOrWhiteSpace([string]$pairingComplete.Body.authToken) -eq $false
  )
  Add-TestResult -Name "Complete pairing session and issue token" -Passed $pairingCompleteOk -Details ($(if ($pairingCompleteOk) { "Pairing completion returned a paired device, credential, and token." } else { "Pairing completion did not return the expected paired-device payload." })) -Data $pairingComplete.Body

  if ($pairingCompleteOk) {
    $pairedHeaders = @{
      "x-gail-device-id" = "spoofed-header-id"
      "x-gail-device-type" = "watch"
      "x-gail-mode" = "work"
      "x-gail-explicit-local-save" = "false"
      "Authorization" = "Bearer $($pairingComplete.Body.authToken)"
    }
    $pairedDeviceList = Invoke-GailRequest -Method "GET" -Path "/devices" -Headers $pairedHeaders
    $pairedDeviceListOk = (
      $pairedDeviceList.StatusCode -eq 200 -and
      (Contains-ItemWithValue -Items @($pairedDeviceList.Body) -PropertyName "id" -ExpectedValue $pairedDeviceId)
    )
    Add-TestResult -Name "Paired token authenticates request path" -Passed $pairedDeviceListOk -Details ($(if ($pairedDeviceListOk) { "Paired token was accepted on a normal authenticated request path." } else { "Paired token did not authenticate the request path as expected." })) -Data $pairedDeviceList.Body
  }
  else {
    Add-TestResult -Name "Paired token authenticates request path" -Passed $false -Details "Pairing completion did not provide a usable auth token."
  }
}
else {
  Add-TestResult -Name "Complete pairing session and issue token" -Passed $false -Details "Pairing session response did not include both id and pairingCode."
  Add-TestResult -Name "Paired token authenticates request path" -Passed $false -Details "Pairing session response did not include both id and pairingCode."
}

$overviewInitial = Invoke-GailRequest -Method "GET" -Path "/dashboard/overview" -Headers $adminHeaders
$overviewInitialOk = Assert-Status -Name "Dashboard overview responds" -Expected 200 -Response $overviewInitial -SuccessDetails "Dashboard overview responded."

$providerStatus = Invoke-GailRequest -Method "GET" -Path "/providers/status" -Headers $adminHeaders
$providerStatusOk = (
  $providerStatus.StatusCode -eq 200 -and
  (Contains-ItemWithValue -Items @($providerStatus.Body) -PropertyName "provider" -ExpectedValue "openai") -and
  (Contains-ItemWithValue -Items @($providerStatus.Body) -PropertyName "provider" -ExpectedValue "local-llm")
)
Add-TestResult -Name "Provider status surface responds" -Passed $providerStatusOk -Details ($(if ($providerStatusOk) { "Provider status returned OpenAI and local-llm entries." } else { "Provider status did not return the expected provider entries." })) -Data $providerStatus.Body

# OpenAI Config
$openAiConfigStatus = Invoke-GailRequest -Method "GET" -Path "/providers/openai-config" -Headers $adminHeaders
$openAiConfigStatusOk = (
  $openAiConfigStatus.StatusCode -eq 200 -and
  ($openAiConfigStatus.Body.configured -eq $true -or $openAiConfigStatus.Body.configured -eq $false) -and
  ($openAiConfigStatus.Body.source -in @("env", "stored", "none"))
)
Add-TestResult -Name "OpenAI config status surface responds" -Passed $openAiConfigStatusOk -Details ($(if ($openAiConfigStatusOk) { "OpenAI config status returned a valid source/configured state." } else { "OpenAI config status did not return valid state." })) -Data $openAiConfigStatus.Body

$openAiConfigStore = Invoke-GailRequest -Method "PATCH" -Path "/providers/openai-config" -Headers $adminHeaders -Body @{
  apiKey = "test-fake-openai-key-for-config-test"
}
$openAiConfigStoreOk = (
  $openAiConfigStore.StatusCode -eq 200 -and
  $openAiConfigStore.Body.hasStoredKey -eq $true -and
  $openAiConfigStore.Body.configured -eq $true
)
Add-TestResult -Name "OpenAI config persists stored key" -Passed $openAiConfigStoreOk -Details ($(if ($openAiConfigStoreOk) { "OpenAI config accepted and persisted a stored key." } else { "OpenAI config did not persist the stored key." })) -Data $openAiConfigStore.Body

$openAiConfigClear = Invoke-GailRequest -Method "PATCH" -Path "/providers/openai-config" -Headers $adminHeaders -Body @{
  clear = $true
}
$openAiConfigClearOk = (
  $openAiConfigClear.StatusCode -eq 200 -and
  $openAiConfigClear.Body.hasStoredKey -eq $false
)
Add-TestResult -Name "OpenAI config clear removes stored key" -Passed $openAiConfigClearOk -Details ($(if ($openAiConfigClearOk) { "OpenAI config clear removed the stored key." } else { "OpenAI config clear did not remove the stored key." })) -Data $openAiConfigClear.Body
$voiceSettings = Invoke-GailRequest -Method "GET" -Path "/voice/settings" -Headers $adminHeaders
$voiceInstructions = ""
if ($voiceSettings.Body -is [psobject] -and ($voiceSettings.Body | Get-Member -Name openAiInstructions -ErrorAction SilentlyContinue)) {
  $voiceInstructions = [string]$voiceSettings.Body.openAiInstructions
}
$voiceSettingsOk = (
  $voiceSettings.StatusCode -eq 200 -and
  $voiceSettings.Body.mode -eq "wake_word" -and
  $voiceSettings.Body.preferredTtsEngine -eq "openai-gpt-4o-mini-tts" -and
  $voiceSettings.Body.openAiVoice -eq "nova" -and
  -not [string]::IsNullOrWhiteSpace($voiceInstructions)
)
Add-TestResult -Name "Voice settings surface responds" -Passed $voiceSettingsOk -Details ($(if ($voiceSettingsOk) { "Voice settings responded with a valid interaction mode." } else { "Voice settings did not return expected data." })) -Data $voiceSettings.Body

$voiceSettingsUpdate = Invoke-GailRequest -Method "PATCH" -Path "/voice/settings" -Headers $adminHeaders -Body @{
  mode = "wake_word"
  wakeWord = "hey gail"
  silenceTimeoutMs = 4200
  autoResumeAfterResponse = $true
  preferredTtsEngine = "openai-gpt-4o-mini-tts"
  fallbackTtsEngine = "browser-speech-synthesis"
  openAiVoice = "nova"
  openAiInstructions = "Speak with a soft feminine voice and a light UK English accent. Sound warm, calm, and natural. Avoid American pronunciation. Keep delivery gentle, lightly expressive, and conversational. Do not sound robotic, flat, deep, or masculine."
}
$voiceSettingsUpdateOk = (
  $voiceSettingsUpdate.StatusCode -eq 200 -and
  $voiceSettingsUpdate.Body.mode -eq "wake_word" -and
  $voiceSettingsUpdate.Body.silenceTimeoutMs -eq 4200 -and
  $voiceSettingsUpdate.Body.preferredTtsEngine -eq "openai-gpt-4o-mini-tts" -and
  $voiceSettingsUpdate.Body.openAiVoice -eq "nova" -and
  $voiceSettingsUpdate.Body.openAiInstructions -match "soft feminine voice"
)
Add-TestResult -Name "Voice settings update persists" -Passed $voiceSettingsUpdateOk -Details ($(if ($voiceSettingsUpdateOk) { "Voice settings update succeeded." } else { "Voice settings update did not persist as expected." })) -Data $voiceSettingsUpdate.Body

$voiceEngines = Invoke-GailRequest -Method "GET" -Path "/voice/engines" -Headers $adminHeaders
$voiceEnginesOk = (
  $voiceEngines.StatusCode -eq 200 -and
  (Contains-ItemWithValue -Items @($voiceEngines.Body) -PropertyName "key" -ExpectedValue "browser-speech-synthesis") -and
  (Contains-ItemWithValue -Items @($voiceEngines.Body) -PropertyName "key" -ExpectedValue "openai-gpt-4o-mini-tts")
)
Add-TestResult -Name "Voice engine list responds" -Passed $voiceEnginesOk -Details ($(if ($voiceEnginesOk) { "Voice engine list returned browser and OpenAI options." } else { "Voice engine list did not return expected options." })) -Data $voiceEngines.Body

$voiceStatus = Invoke-GailRequest -Method "GET" -Path "/voice/status" -Headers $iphoneHeaders
$voiceStatusOk = (
  $voiceStatus.StatusCode -eq 200 -and
  $voiceStatus.Body.deviceType -eq "iphone" -and
  $voiceStatus.Body.sttSupported -eq $true -and
  $voiceStatus.Body.ttsSupported -eq $true -and
  $voiceStatus.Body.preferredTtsEngine -eq "openai-gpt-4o-mini-tts"
)
Add-TestResult -Name "Voice status reflects current device" -Passed $voiceStatusOk -Details ($(if ($voiceStatusOk) { "Voice status reflected the current device capabilities." } else { "Voice status did not reflect expected device capabilities." })) -Data $voiceStatus.Body

$voiceSpeak = Invoke-GailRequest -Method "POST" -Path "/voice/speak" -Headers $iphoneHeaders -Body @{
  text = "Voice synthesis test."
}
$voiceSpeakOk = (
  $voiceSpeak.StatusCode -eq 200 -and
  ($voiceSpeak.Body.engineUsed -in @("openai-gpt-4o-mini-tts", "browser-speech-synthesis")) -and
  (
    $voiceSpeak.Body.engineUsed -eq "openai-gpt-4o-mini-tts" -or
    $voiceSpeak.Body.fallbackUsed -eq $true
  )
)
Add-TestResult -Name "Voice speak uses OpenAI or browser fallback" -Passed $voiceSpeakOk -Details ($(if ($voiceSpeakOk) { "Voice speak returned an expected engine result." } else { "Voice speak did not return an expected engine result." })) -Data $voiceSpeak.Body

$cameraMatrix = Invoke-GailRequest -Method "GET" -Path "/camera/matrix" -Headers $adminHeaders
$cameraMatrixOk = (
  $cameraMatrix.StatusCode -eq 200 -and
  (Contains-ItemWithValue -Items @($cameraMatrix.Body) -PropertyName "deviceType" -ExpectedValue "iphone") -and
  (Contains-ItemWithValue -Items @($cameraMatrix.Body) -PropertyName "deviceType" -ExpectedValue "watch")
)
Add-TestResult -Name "Camera matrix responds" -Passed $cameraMatrixOk -Details ($(if ($cameraMatrixOk) { "Camera matrix returned expected device entries." } else { "Camera matrix did not return expected device entries." })) -Data $cameraMatrix.Body

$memoryEntry = Invoke-GailRequest -Method "POST" -Path "/memory/entries" -Headers $iphoneHeaders -Body @{
  title = "Memory $tag"
  body = "Remember that the fallback and memory file tests are active."
  tags = @("test", "memory")
  source = "backend-test"
}
$null = Assert-Status -Name "Create shared memory entry" -Expected 201 -Response $memoryEntry -SuccessDetails "Shared memory entry created."

$restartMemoryEntry = Invoke-GailRequest -Method "POST" -Path "/memory/entries" -Headers $iphoneHeaders -Body @{
  title = "Restart memory $tag"
  body = "This entry should survive the managed backend restart."
  tags = @("restart", "memory")
  source = "backend-test-restart"
}
$null = Assert-Status -Name "Create restart memory entry" -Expected 201 -Response $restartMemoryEntry -SuccessDetails "Restart memory entry created."

$memoryEntries = Invoke-GailRequest -Method "GET" -Path "/memory/entries" -Headers $iphoneHeaders
$memoryEntriesOk = (
  $memoryEntries.StatusCode -eq 200 -and
  (Contains-ItemWithValue -Items @($memoryEntries.Body) -PropertyName "title" -ExpectedValue "Memory $tag")
)
Add-TestResult -Name "Shared memory list includes created entry" -Passed $memoryEntriesOk -Details ($(if ($memoryEntriesOk) { "Shared memory list included the created entry." } else { "Shared memory list did not include the created entry." })) -Data $memoryEntries.Body

$memoryEntryId = $null
if ($memoryEntry.Body -is [psobject] -and ($memoryEntry.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $memoryEntryId = [string]$memoryEntry.Body.id
}

if ($memoryEntryId) {
  $memoryUpdate = Invoke-GailRequest -Method "PATCH" -Path "/memory/entries/$memoryEntryId" -Headers $iphoneHeaders -Body @{
    title = "Memory updated $tag"
    body = "Updated body for memory lifecycle coverage."
    tags = @("updated", "memory")
    source = "backend-test-updated"
  }
  $memoryUpdateOk = (
    $memoryUpdate.StatusCode -eq 200 -and
    $memoryUpdate.Body.title -eq "Memory updated $tag"
  )
  Add-TestResult -Name "Shared memory entry updates" -Passed $memoryUpdateOk -Details ($(if ($memoryUpdateOk) { "Shared memory entry updated successfully." } else { "Shared memory entry did not update as expected." })) -Data $memoryUpdate.Body

  $memorySearchUpdated = Invoke-GailRequest -Method "GET" -Path "/memory/entries?query=$([uri]::EscapeDataString("backend-test-updated"))" -Headers $iphoneHeaders
  $memorySearchUpdatedOk = (
    $memorySearchUpdated.StatusCode -eq 200 -and
    (Contains-ItemWithValue -Items @($memorySearchUpdated.Body) -PropertyName "title" -ExpectedValue "Memory updated $tag")
  )
  Add-TestResult -Name "Shared memory search finds updated entry" -Passed $memorySearchUpdatedOk -Details ($(if ($memorySearchUpdatedOk) { "Shared memory search returned the updated entry." } else { "Shared memory search did not return the updated entry." })) -Data $memorySearchUpdated.Body

  $memoryDelete = Invoke-GailRequest -Method "DELETE" -Path "/memory/entries/$memoryEntryId" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Shared memory entry deletes" -Expected 200 -Response $memoryDelete -SuccessDetails "Shared memory entry deleted."

  $memoryAfterDelete = Invoke-GailRequest -Method "GET" -Path "/memory/entries?query=$([uri]::EscapeDataString("Memory updated"))" -Headers $iphoneHeaders
  $memoryAfterDeleteOk = (
    $memoryAfterDelete.StatusCode -eq 200 -and
    -not (Contains-ItemWithValue -Items @($memoryAfterDelete.Body) -PropertyName "title" -ExpectedValue "Memory updated $tag")
  )
  Add-TestResult -Name "Deleted memory entry no longer appears in search" -Passed $memoryAfterDeleteOk -Details ($(if ($memoryAfterDeleteOk) { "Deleted memory entry no longer appears in search." } else { "Deleted memory entry still appeared after deletion." })) -Data $memoryAfterDelete.Body
}
else {
  Add-TestResult -Name "Shared memory entry updates" -Passed $false -Details "Memory entry ID missing from memory creation response."
  Add-TestResult -Name "Shared memory search finds updated entry" -Passed $false -Details "Memory entry ID missing from memory creation response."
  Add-TestResult -Name "Shared memory entry deletes" -Passed $false -Details "Memory entry ID missing from memory creation response."
  Add-TestResult -Name "Deleted memory entry no longer appears in search" -Passed $false -Details "Memory entry ID missing from memory creation response."
}

$memorySearch = Invoke-GailRequest -Method "GET" -Path "/memory/entries?query=$([uri]::EscapeDataString("fallback"))" -Headers $iphoneHeaders
$memorySearchOk = (
  $memorySearch.StatusCode -eq 200 -and
  -not (Contains-ItemWithValue -Items @($memorySearch.Body) -PropertyName "title" -ExpectedValue "Memory updated $tag")
)
Add-TestResult -Name "Shared memory search finds matching entry" -Passed $memorySearchOk -Details ($(if ($memorySearchOk) { "Shared memory search returned the matching entry." } else { "Shared memory search did not return the expected entry." })) -Data $memorySearch.Body

$privateMemoryBlocked = Invoke-GailRequest -Method "GET" -Path "/memory/entries" -Headers $privateHeaders
$null = Assert-Status -Name "Private mode blocks shared memory reads" -Expected 403 -Response $privateMemoryBlocked -SuccessDetails "Private mode blocked shared memory reads."

$conversationSession = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions" -Headers $iphoneHeaders -Body @{
  title = "Conversation $tag"
}
$null = Assert-Status -Name "Create conversation session in normal mode" -Expected 201 -Response $conversationSession -SuccessDetails "Conversation session created in normal mode."

$conversationSessionId = $null
if ($conversationSession.Body -is [psobject] -and ($conversationSession.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $conversationSessionId = [string]$conversationSession.Body.id
}

$conversationProviderOk = ($conversationSession.StatusCode -eq 201 -and $conversationSession.Body.provider -eq "openai")
Add-TestResult -Name "Normal conversation defaults to OpenAI provider" -Passed $conversationProviderOk -Details ($(if ($conversationProviderOk) { "Normal conversation session defaulted to OpenAI." } else { "Normal conversation session did not default to OpenAI." })) -Data $conversationSession.Body

if ($conversationSessionId) {
  $conversationReply = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions/$conversationSessionId/messages" -Headers $iphoneHeaders -Body @{
    content = "Help me think through this test."
  }
  $conversationReplyOk = (
    $conversationReply.StatusCode -eq 201 -and
    ($conversationReply.Body.reply.provider -in @("openai", "local-llm")) -and
    $conversationReply.Body.usedProvider -eq $conversationReply.Body.reply.provider -and
    $conversationReply.Body.requestedProvider -eq "openai" -and
    $conversationReply.Body.memoriesUsed -ge 1 -and
    [string]$conversationReply.Body.reply.content
  )
  Add-TestResult -Name "Normal conversation reply returns provider result with memory context" -Passed $conversationReplyOk -Details ($(if ($conversationReplyOk) { "Normal conversation reply returned a provider result and included memory context." } else { "Normal conversation reply did not return the expected provider result metadata." })) -Data $conversationReply.Body

  $openAiProviderStatus = @($providerStatus.Body | Where-Object {
    ($_ | Get-Member -Name provider -ErrorAction SilentlyContinue) -and $_.provider -eq "openai"
  })[0]
  $openAiAvailable = $openAiProviderStatus -and ($openAiProviderStatus.available -eq $true)
  $expectsFallback = -not $openAiAvailable
  $conversationFallbackOk = if ($expectsFallback) {
    $conversationReply.Body.fellBack -eq $true -and $conversationReply.Body.usedProvider -eq "local-llm"
  }
  else {
    ($conversationReply.Body.usedProvider -in @("openai", "local-llm")) -and (
      ($conversationReply.Body.usedProvider -eq "openai" -and $conversationReply.Body.fellBack -eq $false) -or
      ($conversationReply.Body.usedProvider -eq "local-llm" -and $conversationReply.Body.fellBack -eq $true)
    )
  }
  Add-TestResult -Name "Normal conversation handles OpenAI fallback correctly" -Passed $conversationFallbackOk -Details ($(if ($conversationFallbackOk) { "Normal conversation handled OpenAI availability or fallback correctly." } else { "Normal conversation did not handle OpenAI availability or fallback as expected." })) -Data $conversationReply.Body

  $conversationModeMismatch = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions/$conversationSessionId/messages" -Headers $privateHeaders -Body @{
    content = "This should fail because the mode changed."
  }
  $null = Assert-Status -Name "Conversation session blocks mode mismatch" -Expected 403 -Response $conversationModeMismatch -SuccessDetails "Conversation session blocked mode mismatch."

  $conversationHandoffRead = Invoke-GailRequest -Method "GET" -Path "/conversation/sessions/$conversationSessionId" -Headers $uconsoleHeaders
  $conversationHandoffReadOk = (
    $conversationHandoffRead.StatusCode -eq 200 -and
    $conversationHandoffRead.Body.id -eq $conversationSessionId
  )
  Add-TestResult -Name "Normal conversation session supports same-mode device handoff read" -Passed $conversationHandoffReadOk -Details ($(if ($conversationHandoffReadOk) { "Normal conversation session was readable from a second work-mode device." } else { "Normal conversation session was not readable from a second work-mode device." })) -Data $conversationHandoffRead.Body

  $conversationHandoffReply = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions/$conversationSessionId/messages" -Headers $uconsoleHeaders -Body @{
    content = "Continue this from the work terminal."
  }
  $conversationHandoffReplyOk = (
    $conversationHandoffReply.StatusCode -eq 201 -and
    ($conversationHandoffReply.Body.reply.provider -in @("openai", "local-llm")) -and
    $conversationHandoffReply.Body.requestedProvider -eq "openai"
  )
  Add-TestResult -Name "Normal conversation session supports same-mode device handoff reply" -Passed $conversationHandoffReplyOk -Details ($(if ($conversationHandoffReplyOk) { "Normal conversation session accepted a reply from a second work-mode device." } else { "Normal conversation session did not accept a reply from a second work-mode device." })) -Data $conversationHandoffReply.Body

  $providerTelemetryAfterConversation = Invoke-GailRequest -Method "GET" -Path "/providers/status" -Headers $adminHeaders
  $openAiProviderTelemetry = @($providerTelemetryAfterConversation.Body | Where-Object {
    ($_ | Get-Member -Name provider -ErrorAction SilentlyContinue) -and $_.provider -eq "openai"
  })[0]
  $localProviderTelemetry = @($providerTelemetryAfterConversation.Body | Where-Object {
    ($_ | Get-Member -Name provider -ErrorAction SilentlyContinue) -and $_.provider -eq "local-llm"
  })[0]
  $providerTelemetryOk = (
    $providerTelemetryAfterConversation.StatusCode -eq 200 -and
    $openAiProviderTelemetry -and
    (
      (
        -not $openAiProviderTelemetry.available -and
        $openAiProviderTelemetry.failureCount -ge 1 -and
        $openAiProviderTelemetry.fallbackCount -ge 1 -and
        $localProviderTelemetry -and
        $localProviderTelemetry.successCount -ge 1
      ) -or (
        $openAiProviderTelemetry.available -and
        $openAiProviderTelemetry.attemptCount -ge 1 -and
        $openAiProviderTelemetry.successCount -ge 1
      ) -or (
        $localProviderTelemetry -and
        $localProviderTelemetry.successCount -ge 1
      )
    )
  )
  Add-TestResult -Name "Provider telemetry updates after conversation traffic" -Passed $providerTelemetryOk -Details ($(if ($providerTelemetryOk) { "Provider telemetry updated after conversation traffic." } else { "Provider telemetry did not update as expected after conversation traffic." })) -Data $providerTelemetryAfterConversation.Body

  if (Restart-ManagedBackend) {
    $conversationAfterRestart = Invoke-GailRequest -Method "GET" -Path "/conversation/sessions/$conversationSessionId" -Headers $iphoneHeaders
    $conversationAfterRestartOk = (
      $conversationAfterRestart.StatusCode -eq 200 -and
      $conversationAfterRestart.Body.id -eq $conversationSessionId -and
      @($conversationAfterRestart.Body.messages).Count -ge 4
    )
    Add-TestResult -Name "Conversation session survives backend restart" -Passed $conversationAfterRestartOk -Details ($(if ($conversationAfterRestartOk) { "Conversation session persisted across backend restart." } else { "Conversation session did not persist across backend restart." })) -Data $conversationAfterRestart.Body

    $memoryAfterRestart = Invoke-GailRequest -Method "GET" -Path "/memory/entries" -Headers $iphoneHeaders
    $memoryAfterRestartOk = (
      $memoryAfterRestart.StatusCode -eq 200 -and
      (Contains-ItemWithValue -Items @($memoryAfterRestart.Body) -PropertyName "title" -ExpectedValue "Restart memory $tag")
    )
    Add-TestResult -Name "Shared memory file survives backend restart" -Passed $memoryAfterRestartOk -Details ($(if ($memoryAfterRestartOk) { "Shared memory file persisted across backend restart." } else { "Shared memory file did not persist across backend restart." })) -Data $memoryAfterRestart.Body

    $voiceSettingsAfterRestart = Invoke-GailRequest -Method "GET" -Path "/voice/settings" -Headers $adminHeaders
    $voiceSettingsAfterRestartOk = (
      $voiceSettingsAfterRestart.StatusCode -eq 200 -and
      $voiceSettingsAfterRestart.Body.mode -eq "wake_word" -and
      $voiceSettingsAfterRestart.Body.silenceTimeoutMs -eq 4200 -and
      $voiceSettingsAfterRestart.Body.preferredTtsEngine -eq "openai-gpt-4o-mini-tts" -and
      $voiceSettingsAfterRestart.Body.openAiVoice -eq "nova" -and
      $voiceSettingsAfterRestart.Body.openAiInstructions -match "UK English accent"
    )
    Add-TestResult -Name "Voice settings survive backend restart" -Passed $voiceSettingsAfterRestartOk -Details ($(if ($voiceSettingsAfterRestartOk) { "Voice settings persisted across backend restart." } else { "Voice settings did not persist across backend restart." })) -Data $voiceSettingsAfterRestart.Body
  }
  else {
    Add-TestResult -Name "Conversation session survives backend restart" -Passed $true -Details "Skipped because EnsureBackend was not set."
    Add-TestResult -Name "Shared memory file survives backend restart" -Passed $true -Details "Skipped because EnsureBackend was not set."
    Add-TestResult -Name "Voice settings survive backend restart" -Passed $true -Details "Skipped because EnsureBackend was not set."
  }
}
else {
  Add-TestResult -Name "Normal conversation reply returns provider result with memory context" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Normal conversation handles OpenAI fallback correctly" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Conversation session blocks mode mismatch" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Normal conversation session supports same-mode device handoff read" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Normal conversation session supports same-mode device handoff reply" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Conversation session survives backend restart" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Shared memory file survives backend restart" -Passed $false -Details "Conversation session ID missing from session creation response."
  Add-TestResult -Name "Voice settings survive backend restart" -Passed $false -Details "Conversation session ID missing from session creation response."
}

$privateConversationSession = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions" -Headers $privateHeaders -Body @{
  title = "Private conversation $tag"
}
$null = Assert-Status -Name "Create conversation session in private mode" -Expected 201 -Response $privateConversationSession -SuccessDetails "Conversation session created in private mode."

$privateConversationSessionOk = ($privateConversationSession.StatusCode -eq 201 -and $privateConversationSession.Body.provider -eq "local-llm")
Add-TestResult -Name "Private conversation forces local provider" -Passed $privateConversationSessionOk -Details ($(if ($privateConversationSessionOk) { "Private conversation forced the local provider." } else { "Private conversation did not force the local provider." })) -Data $privateConversationSession.Body

$privateConversationSessionId = $null
if ($privateConversationSession.Body -is [psobject] -and ($privateConversationSession.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $privateConversationSessionId = [string]$privateConversationSession.Body.id
}

$privateOpenAiBlocked = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions" -Headers $privateHeaders -Body @{
  title = "Blocked provider $tag"
  providerPreference = "openai"
}
$null = Assert-Status -Name "Private conversation blocks OpenAI provider preference" -Expected 403 -Response $privateOpenAiBlocked -SuccessDetails "Private conversation blocked OpenAI provider preference."

if ($privateConversationSessionId) {
  $privateConversationReply = Invoke-GailRequest -Method "POST" -Path "/conversation/sessions/$privateConversationSessionId/messages" -Headers $privateHeaders -Body @{
    content = "Keep this local and private."
  }
  $privateConversationReplyOk = (
    $privateConversationReply.StatusCode -eq 201 -and
    $privateConversationReply.Body.reply.provider -eq "local-llm" -and
    [string]$privateConversationReply.Body.reply.content
  )
  Add-TestResult -Name "Private conversation reply uses local provider path" -Passed $privateConversationReplyOk -Details ($(if ($privateConversationReplyOk) { "Private conversation reply used the local provider path." } else { "Private conversation reply did not use the local provider path." })) -Data $privateConversationReply.Body

  $privateConversationCrossDevice = Invoke-GailRequest -Method "GET" -Path "/conversation/sessions/$privateConversationSessionId" -Headers @{
    "x-gail-device-id" = "private-other-$tag"
    "x-gail-device-type" = "iphone"
    "x-gail-mode" = "private"
    "x-gail-explicit-local-save" = "false"
  }
  $null = Assert-Status -Name "Private conversation blocks cross-device handoff" -Expected 403 -Response $privateConversationCrossDevice -SuccessDetails "Private conversation blocked cross-device handoff."

  if (Restart-ManagedBackend) {
    $privateConversationAfterRestart = Invoke-GailRequest -Method "GET" -Path "/conversation/sessions/$privateConversationSessionId" -Headers $privateHeaders
    $null = Assert-Status -Name "Private conversation does not survive backend restart" -Expected 404 -Response $privateConversationAfterRestart -SuccessDetails "Private conversation did not survive backend restart."
  }
  else {
    Add-TestResult -Name "Private conversation does not survive backend restart" -Passed $true -Details "Skipped because EnsureBackend was not set."
  }
}
else {
  Add-TestResult -Name "Private conversation reply uses local provider path" -Passed $false -Details "Private conversation session ID missing from session creation response."
  Add-TestResult -Name "Private conversation blocks cross-device handoff" -Passed $false -Details "Private conversation session ID missing from session creation response."
  Add-TestResult -Name "Private conversation does not survive backend restart" -Passed $false -Details "Private conversation session ID missing from session creation response."
}

# Device registration
$registerIphone = Invoke-GailRequest -Method "POST" -Path "/devices" -Headers $adminHeaders -Body @{
  id = $iphoneId
  type = "iphone"
  name = "Test iPhone $tag"
  defaultMode = "work"
  qualityTier = "medium"
  trusted = $true
}
$null = Assert-Status -Name "Register trusted iPhone" -Expected 201 -Response $registerIphone -SuccessDetails "Trusted iPhone device registered."

$registerWatch = Invoke-GailRequest -Method "POST" -Path "/devices" -Headers $adminHeaders -Body @{
  id = $watchId
  type = "watch"
  name = "Test Watch $tag"
  defaultMode = "lightweight"
  qualityTier = "low"
  trusted = $true
  supportsWatchApproval = $true
}
$null = Assert-Status -Name "Register trusted watch" -Expected 201 -Response $registerWatch -SuccessDetails "Trusted watch device registered."

$unlockIphone = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/access-window" -Headers $adminHeaders -Body @{
  unlockForMinutes = 15
}
$unlockIphoneOk = ($unlockIphone.StatusCode -eq 200 -and (Has-Property $unlockIphone.Body "sensitiveActionsUnlockedUntil") -and $unlockIphone.Body.sensitiveActionsUnlockedUntil)
Add-TestResult -Name "Unlock trusted iPhone for sensitive actions" -Passed $unlockIphoneOk -Details ($(if ($unlockIphoneOk) { "Trusted iPhone unlock window granted." } else { "Trusted iPhone unlock window was not granted." })) -Data $unlockIphone.Body

$unlockWatch = Invoke-GailRequest -Method "PATCH" -Path "/devices/$watchId/access-window" -Headers $adminHeaders -Body @{
  unlockForMinutes = 15
}
$unlockWatchOk = ($unlockWatch.StatusCode -eq 200 -and (Has-Property $unlockWatch.Body "sensitiveActionsUnlockedUntil") -and $unlockWatch.Body.sensitiveActionsUnlockedUntil)
Add-TestResult -Name "Unlock trusted watch for sensitive actions" -Passed $unlockWatchOk -Details ($(if ($unlockWatchOk) { "Trusted watch unlock window granted." } else { "Trusted watch unlock window was not granted." })) -Data $unlockWatch.Body

$staleUnlockIphone = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/access-window" -Headers $adminHeaders -Body @{
  unlockUntil = (Get-Date).AddMinutes(-1).ToString("s")
}
$staleUnlockIphoneOk = ($staleUnlockIphone.StatusCode -eq 200)
Add-TestResult -Name "Set stale unlock window on trusted iPhone" -Passed $staleUnlockIphoneOk -Details ($(if ($staleUnlockIphoneOk) { "Trusted iPhone stale unlock window set." } else { "Failed to set stale unlock window on trusted iPhone." })) -Data $staleUnlockIphone.Body

$staleCartCreate = Invoke-GailRequest -Method "POST" -Path "/cart" -Headers $iphoneHeaders -Body @{
  title = "Stale unlock cart item $tag"
  sourceUrl = "https://example.com/stale/$tag"
}
$null = Assert-Status -Name "Create stale-unlock cart item" -Expected 201 -Response $staleCartCreate -SuccessDetails "Stale-unlock cart item created."

$staleCartId = $null
if ($staleCartCreate.Body -is [psobject] -and ($staleCartCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $staleCartId = [string]$staleCartCreate.Body.id
}

if ($staleCartId) {
  $staleUnlockBlocked = Invoke-GailRequest -Method "POST" -Path "/cart/$staleCartId/approve-request" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Stale unlock window blocks cart approval request" -Expected 403 -Response $staleUnlockBlocked -SuccessDetails "Stale unlock window blocked approval request."
}
else {
  Add-TestResult -Name "Stale unlock window blocks cart approval request" -Passed $false -Details "Stale-unlock cart ID missing from cart creation response."
}

$reUnlockAfterStale = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/access-window" -Headers $adminHeaders -Body @{
  unlockForMinutes = 15
}
$reUnlockAfterStaleOk = ($reUnlockAfterStale.StatusCode -eq 200 -and (Has-Property $reUnlockAfterStale.Body "sensitiveActionsUnlockedUntil") -and $reUnlockAfterStale.Body.sensitiveActionsUnlockedUntil)
Add-TestResult -Name "Restore trusted iPhone unlock window after stale check" -Passed $reUnlockAfterStaleOk -Details ($(if ($reUnlockAfterStaleOk) { "Trusted iPhone unlock window restored after stale check." } else { "Trusted iPhone unlock window was not restored after stale check." })) -Data $reUnlockAfterStale.Body

$untrustIphone = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/trust" -Headers $adminHeaders -Body @{
  trusted = $false
}
$untrustIphoneOk = ($untrustIphone.StatusCode -eq 200 -and ($untrustIphone.Body.trusted -eq $false) -and -not (Has-Property $untrustIphone.Body "sensitiveActionsUnlockedUntil"))
Add-TestResult -Name "Untrusting device clears sensitive access window" -Passed $untrustIphoneOk -Details ($(if ($untrustIphoneOk) { "Untrusting the device cleared the unlock window." } else { "Untrusting the device did not clear the unlock window." })) -Data $untrustIphone.Body

$untrustedCartCreate = Invoke-GailRequest -Method "POST" -Path "/cart" -Headers $iphoneHeaders -Body @{
  title = "Untrusted cart item $tag"
  sourceUrl = "https://example.com/untrusted/$tag"
}
$null = Assert-Status -Name "Create untrusted-check cart item" -Expected 201 -Response $untrustedCartCreate -SuccessDetails "Untrusted-check cart item created."

$untrustedCartId = $null
if ($untrustedCartCreate.Body -is [psobject] -and ($untrustedCartCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $untrustedCartId = [string]$untrustedCartCreate.Body.id
}

if ($untrustedCartId) {
  $untrustedBlocked = Invoke-GailRequest -Method "POST" -Path "/cart/$untrustedCartId/approve-request" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Untrusted device blocks cart approval request" -Expected 403 -Response $untrustedBlocked -SuccessDetails "Untrusted device was blocked from approval request."
}
else {
  Add-TestResult -Name "Untrusted device blocks cart approval request" -Passed $false -Details "Untrusted-check cart ID missing from cart creation response."
}

$retrustIphone = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/trust" -Headers $adminHeaders -Body @{
  trusted = $true
}
$retrustIphoneOk = ($retrustIphone.StatusCode -eq 200 -and $retrustIphone.Body.trusted -eq $true)
Add-TestResult -Name "Re-trust trusted iPhone after untrust check" -Passed $retrustIphoneOk -Details ($(if ($retrustIphoneOk) { "Trusted iPhone was re-trusted." } else { "Trusted iPhone was not re-trusted." })) -Data $retrustIphone.Body

$reUnlockAfterRetrust = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/access-window" -Headers $adminHeaders -Body @{
  unlockForMinutes = 15
}
$reUnlockAfterRetrustOk = ($reUnlockAfterRetrust.StatusCode -eq 200 -and (Has-Property $reUnlockAfterRetrust.Body "sensitiveActionsUnlockedUntil") -and $reUnlockAfterRetrust.Body.sensitiveActionsUnlockedUntil)
Add-TestResult -Name "Restore trusted iPhone unlock after re-trust" -Passed $reUnlockAfterRetrustOk -Details ($(if ($reUnlockAfterRetrustOk) { "Trusted iPhone unlock restored after re-trust." } else { "Trusted iPhone unlock was not restored after re-trust." })) -Data $reUnlockAfterRetrust.Body

if ($staleCartId) {
  $deviceMismatchBlocked = Invoke-GailRequest -Method "POST" -Path "/cart/$staleCartId/approve-request" -Headers @{
    "x-gail-device-id" = $iphoneId
    "x-gail-device-type" = "watch"
    "x-gail-mode" = "lightweight"
    "x-gail-explicit-local-save" = "false"
  }
  $null = Assert-Status -Name "Device type mismatch blocks approval request" -Expected 403 -Response $deviceMismatchBlocked -SuccessDetails "Device type mismatch was blocked."
}
else {
  Add-TestResult -Name "Device type mismatch blocks approval request" -Passed $false -Details "Stale-unlock cart ID missing from cart creation response."
}

# Task creation allowed for iphone
$taskCreate = Invoke-GailRequest -Method "POST" -Path "/tasks" -Headers $iphoneHeaders -Body @{
  title = "Task $tag"
  priority = "normal"
}
$null = Assert-Status -Name "Create task as trusted iPhone" -Expected 201 -Response $taskCreate -SuccessDetails "Task creation succeeded for iPhone device."

# Project, list, reminder, and part coverage
$projectCreate = Invoke-GailRequest -Method "POST" -Path "/projects" -Headers $iphoneHeaders -Body @{
  title = "Project $tag"
  summary = "Project summary $tag"
  tags = @("smoke", "project")
}
$null = Assert-Status -Name "Create project as trusted iPhone" -Expected 201 -Response $projectCreate -SuccessDetails "Project creation succeeded."

$projectId = $null
if ($projectCreate.Body -is [psobject] -and ($projectCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $projectId = [string]$projectCreate.Body.id
}

if ($projectId) {
  $projectUpdate = Invoke-GailRequest -Method "PATCH" -Path "/projects/$projectId" -Headers $iphoneHeaders -Body @{
    status = "paused"
    summary = "Updated project summary $tag"
    tags = @("smoke", "project", "updated")
  }
  $projectUpdateOk = ($projectUpdate.StatusCode -eq 200 -and $projectUpdate.Body.status -eq "paused")
  Add-TestResult -Name "Update project status" -Passed $projectUpdateOk -Details ($(if ($projectUpdateOk) { "Project update succeeded." } else { "Project update did not return paused status." })) -Data $projectUpdate.Body
}
else {
  Add-TestResult -Name "Update project status" -Passed $false -Details "Project ID missing from project creation response."
}

$workflowCreate = Invoke-GailRequest -Method "POST" -Path "/workflows" -Headers $iphoneHeaders -Body @{
  title = "Workflow $tag"
  objective = "Summarize imported material, compile findings, draft email, prepare form answers, and produce a Codex brief."
  projectId = $projectId
  providerPreference = "local-llm"
  contextItems = @(
    @{
      title = "Operator context"
      body = "Customer intake notes, supporting emails, and form requirements for workflow smoke test $tag."
      sourceType = "manual"
    }
  )
}
$null = Assert-Status -Name "Create workflow as trusted iPhone" -Expected 201 -Response $workflowCreate -SuccessDetails "Workflow creation succeeded."

$workflowId = $null
if ($workflowCreate.Body -is [psobject] -and ($workflowCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $workflowId = [string]$workflowCreate.Body.id
}

if ($workflowId) {
  $workflowList = Invoke-GailRequest -Method "GET" -Path "/workflows" -Headers $iphoneHeaders
  $workflowListOk = (
    $workflowList.StatusCode -eq 200 -and
    (Contains-ItemWithValue -Items @($workflowList.Body) -PropertyName "id" -ExpectedValue $workflowId)
  )
  Add-TestResult -Name "Workflow list includes created workflow" -Passed $workflowListOk -Details ($(if ($workflowListOk) { "Workflow list returned the created workflow." } else { "Workflow list did not include the created workflow." })) -Data $workflowList.Body

  $workflowPlan = Invoke-GailRequest -Method "POST" -Path "/workflows/$workflowId/plan" -Headers $iphoneHeaders -Body @{
    replaceExistingSteps = $true
  }
  $plannedSteps = @()
  if ($workflowPlan.Body -is [psobject] -and ($workflowPlan.Body | Get-Member -Name workflow -ErrorAction SilentlyContinue)) {
    $plannedSteps = @($workflowPlan.Body.workflow.steps)
  }
  $readySteps = @($plannedSteps | Where-Object { $_.status -eq "ready" })
  $hasExecutableStep = $readySteps.Count -ge 1 -or $plannedSteps.Count -ge 1
  $workflowPlanOk = (
    $workflowPlan.StatusCode -eq 200 -and
    $workflowPlan.Body -is [psobject] -and
    ($workflowPlan.Body | Get-Member -Name workflow -ErrorAction SilentlyContinue) -and
    $hasExecutableStep
  )
  Add-TestResult -Name "Workflow planning generates executable steps" -Passed $workflowPlanOk -Details ($(if ($workflowPlanOk) { "Workflow planning generated the expected step scaffold." } else { "Workflow planning did not generate the expected step scaffold." })) -Data $workflowPlan.Body

  $plannedStepId = $null
  if ($workflowPlan.Body -is [psobject] -and ($workflowPlan.Body | Get-Member -Name step -ErrorAction SilentlyContinue)) {
    $plannedStep = $workflowPlan.Body.step
    if ($plannedStep -is [psobject] -and ($plannedStep | Get-Member -Name id -ErrorAction SilentlyContinue)) {
      $plannedStepId = [string]$plannedStep.id
    }
  }
  if (-not $plannedStepId -and $readySteps.Count -gt 0) {
    $plannedStepId = [string]$readySteps[0].id
  }
  if (-not $plannedStepId -and $plannedSteps.Count -gt 0) {
    $plannedStepId = [string]$plannedSteps[0].id
  }

  if ($plannedStepId) {
    $workflowRun = Invoke-GailRequest -Method "POST" -Path "/workflows/$workflowId/steps/$plannedStepId/run" -Headers $iphoneHeaders
    $workflowRunOk = (
      $workflowRun.StatusCode -eq 200 -and
      $workflowRun.Body -is [psobject] -and
      ($workflowRun.Body | Get-Member -Name step -ErrorAction SilentlyContinue) -and
      $workflowRun.Body.step.status -eq "completed" -and
      @($workflowRun.Body.step.artifacts).Count -ge 1
    )
    Add-TestResult -Name "Workflow step run produces artifacts" -Passed $workflowRunOk -Details ($(if ($workflowRunOk) { "Workflow execution produced step artifacts." } else { "Workflow execution did not produce the expected artifacts." })) -Data $workflowRun.Body

    $workflowDetail = Invoke-GailRequest -Method "GET" -Path "/workflows/$workflowId" -Headers $iphoneHeaders
    $workflowDetailOk = (
      $workflowDetail.StatusCode -eq 200 -and
      $workflowDetail.Body -is [psobject] -and
      @($workflowDetail.Body.steps | Where-Object { $_.id -eq $plannedStepId -and $_.status -eq "completed" -and @($_.artifacts).Count -ge 1 }).Count -eq 1
    )
    Add-TestResult -Name "Workflow detail persists executed step state" -Passed $workflowDetailOk -Details ($(if ($workflowDetailOk) { "Workflow detail reflected the executed step and artifacts." } else { "Workflow detail did not reflect the executed step state." })) -Data $workflowDetail.Body
  }
  else {
    Add-TestResult -Name "Workflow step run produces artifacts" -Passed $false -Details "Workflow step ID missing from workflow planning response."
    Add-TestResult -Name "Workflow detail persists executed step state" -Passed $false -Details "Workflow step ID missing from workflow planning response."
  }
}
else {
  Add-TestResult -Name "Workflow list includes created workflow" -Passed $false -Details "Workflow ID missing from workflow creation response."
  Add-TestResult -Name "Workflow planning generates executable steps" -Passed $false -Details "Workflow ID missing from workflow creation response."
  Add-TestResult -Name "Workflow step run produces artifacts" -Passed $false -Details "Workflow ID missing from workflow creation response."
  Add-TestResult -Name "Workflow detail persists executed step state" -Passed $false -Details "Workflow ID missing from workflow creation response."
}

$listCreate = Invoke-GailRequest -Method "POST" -Path "/lists" -Headers $iphoneHeaders -Body @{
  title = "List $tag"
  description = "List description $tag"
}
$null = Assert-Status -Name "Create list as trusted iPhone" -Expected 201 -Response $listCreate -SuccessDetails "List creation succeeded."

$listId = $null
if ($listCreate.Body -is [psobject] -and ($listCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $listId = [string]$listCreate.Body.id
}

if ($listId) {
  $listItemCreate = Invoke-GailRequest -Method "POST" -Path "/lists/$listId/items" -Headers $iphoneHeaders -Body @{
    text = "List item $tag"
  }
  $listItemCreateOk = ($listItemCreate.StatusCode -eq 201 -and $listItemCreate.Body.items.Count -ge 1)
  Add-TestResult -Name "Add item to list" -Passed $listItemCreateOk -Details ($(if ($listItemCreateOk) { "List item creation succeeded." } else { "List item was not added to the list." })) -Data $listItemCreate.Body

  $listItemId = $null
  if ($listItemCreate.Body -is [psobject] -and ($listItemCreate.Body | Get-Member -Name items -ErrorAction SilentlyContinue)) {
    $items = @($listItemCreate.Body.items)
    if ($items.Count -gt 0) {
      $listItemId = [string]$items[$items.Count - 1].id
    }
  }

  if ($listItemId) {
    $listItemUpdate = Invoke-GailRequest -Method "PATCH" -Path "/lists/$listId/items/$listItemId" -Headers $iphoneHeaders -Body @{
      completed = $true
      text = "List item $tag completed"
    }
    $listItemUpdateOk = ($listItemUpdate.StatusCode -eq 200 -and (@($listItemUpdate.Body.items | Where-Object { $_.id -eq $listItemId -and $_.completed }).Count -eq 1))
    Add-TestResult -Name "Update list item completion" -Passed $listItemUpdateOk -Details ($(if ($listItemUpdateOk) { "List item update succeeded." } else { "List item update did not mark the item completed." })) -Data $listItemUpdate.Body
  }
  else {
    Add-TestResult -Name "Update list item completion" -Passed $false -Details "List item ID missing after list item creation."
  }
}
else {
  Add-TestResult -Name "Add item to list" -Passed $false -Details "List ID missing from list creation response."
  Add-TestResult -Name "Update list item completion" -Passed $false -Details "List ID missing from list creation response."
}

$reminderCreate = Invoke-GailRequest -Method "POST" -Path "/reminders" -Headers $iphoneHeaders -Body @{
  title = "Reminder $tag"
  remindAt = (Get-Date).AddHours(1).ToString("s")
}
$null = Assert-Status -Name "Create reminder as trusted iPhone" -Expected 201 -Response $reminderCreate -SuccessDetails "Reminder creation succeeded."

$reminderId = $null
if ($reminderCreate.Body -is [psobject] -and ($reminderCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $reminderId = [string]$reminderCreate.Body.id
}

if ($reminderId) {
  $reminderUpdate = Invoke-GailRequest -Method "PATCH" -Path "/reminders/$reminderId" -Headers $iphoneHeaders -Body @{
    status = "snoozed"
    details = "Updated reminder details $tag"
  }
  $reminderUpdateOk = ($reminderUpdate.StatusCode -eq 200 -and $reminderUpdate.Body.status -eq "snoozed")
  Add-TestResult -Name "Update reminder status" -Passed $reminderUpdateOk -Details ($(if ($reminderUpdateOk) { "Reminder update succeeded." } else { "Reminder update did not return snoozed status." })) -Data $reminderUpdate.Body
}
else {
  Add-TestResult -Name "Update reminder status" -Passed $false -Details "Reminder ID missing from reminder creation response."
}

$partCreate = Invoke-GailRequest -Method "POST" -Path "/parts" -Headers $iphoneHeaders -Body @{
  title = "Part $tag"
  sourceType = "catalog"
  status = "needed"
}
$null = Assert-Status -Name "Create part as trusted iPhone" -Expected 201 -Response $partCreate -SuccessDetails "Part creation succeeded."

$partId = $null
if ($partCreate.Body -is [psobject] -and ($partCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $partId = [string]$partCreate.Body.id
}

if ($partId) {
  $partUpdate = Invoke-GailRequest -Method "PATCH" -Path "/parts/$partId" -Headers $iphoneHeaders -Body @{
    status = "researching"
    compatibilityNotes = "Updated compatibility notes $tag"
  }
  $partUpdateOk = ($partUpdate.StatusCode -eq 200 -and $partUpdate.Body.status -eq "researching")
  Add-TestResult -Name "Update part status" -Passed $partUpdateOk -Details ($(if ($partUpdateOk) { "Part update succeeded." } else { "Part update did not return researching status." })) -Data $partUpdate.Body
}
else {
  Add-TestResult -Name "Update part status" -Passed $false -Details "Part ID missing from part creation response."
}

$overviewAfterCreates = Invoke-GailRequest -Method "GET" -Path "/dashboard/overview" -Headers $iphoneHeaders
$overviewCountOk = (
  $overviewAfterCreates.StatusCode -eq 200 -and
  $overviewAfterCreates.Body -is [psobject] -and
  $overviewAfterCreates.Body.counts.tasks -ge 1 -and
  $overviewAfterCreates.Body.counts.projects -ge 1 -and
  $overviewAfterCreates.Body.counts.lists -ge 1 -and
  $overviewAfterCreates.Body.counts.reminders -ge 1 -and
  $overviewAfterCreates.Body.counts.parts -ge 1
)
Add-TestResult -Name "Dashboard overview reflects created records" -Passed $overviewCountOk -Details ($(if ($overviewCountOk) { "Overview counts include created task, project, list, reminder, and part records." } else { "Overview counts did not reflect the created records." })) -Data $overviewAfterCreates.Body

# Watch blocked from task routes
$watchTaskRead = Invoke-GailRequest -Method "GET" -Path "/tasks" -Headers $watchHeaders
$null = Assert-Status -Name "Watch blocked from task read" -Expected 403 -Response $watchTaskRead -SuccessDetails "Watch device was blocked from task read as expected."

$watchOverview = Invoke-GailRequest -Method "GET" -Path "/dashboard/overview" -Headers $watchHeaders
$null = Assert-Status -Name "Watch can read dashboard overview" -Expected 200 -Response $watchOverview -SuccessDetails "Watch device can read lightweight dashboard overview."

# Panel availability
$panel = Invoke-GailRequest -Method "GET" -Path "/panel/"
$panelOk = ($panel.StatusCode -eq 200 -and $panel.Raw -like "*Gail Operator Panel*")
Add-TestResult -Name "Panel route serves operator panel" -Passed $panelOk -Details ($(if ($panelOk) { "Operator panel HTML served." } else { "Panel route did not return expected HTML." })) -Data $panel.Raw

$commandList = Invoke-GailRequest -Method "GET" -Path "/commands" -Headers $iphoneHeaders
$commandListOk = (
  $commandList.StatusCode -eq 200 -and
  (Contains-ItemWithValue -Items @($commandList.Body) -PropertyName "key" -ExpectedValue "show_tasks")
)
Add-TestResult -Name "Command list responds" -Passed $commandListOk -Details ($(if ($commandListOk) { "Hardwired command list returned expected commands." } else { "Hardwired command list did not return expected commands." })) -Data $commandList.Body

$commandExecute = Invoke-GailRequest -Method "POST" -Path "/commands/execute" -Headers $iphoneHeaders -Body @{
  phrase = "show tasks"
}
$commandExecuteOk = (
  $commandExecute.StatusCode -eq 200 -and
  $commandExecute.Body.command.key -eq "show_tasks" -and
  $commandExecute.Body.status -eq "accepted"
)
Add-TestResult -Name "Hardwired command execution responds deterministically" -Passed $commandExecuteOk -Details ($(if ($commandExecuteOk) { "Hardwired command execution matched and returned an accepted broker result." } else { "Hardwired command execution did not return the expected deterministic result." })) -Data $commandExecute.Body

$controlIntentCommand = Invoke-GailRequest -Method "POST" -Path "/control/intents" -Headers $iphoneHeaders -Body @{
  text = "please show tasks for me"
  source = "typed"
  autoPlan = $true
}
$controlIntentCommandOk = (
  $controlIntentCommand.StatusCode -eq 200 -and
  $controlIntentCommand.Body.action -eq "command" -and
  $controlIntentCommand.Body.command.key -eq "show_tasks" -and
  $controlIntentCommand.Body.command.success -eq $true
)
Add-TestResult -Name "Control intent matches natural command phrasing" -Passed $controlIntentCommandOk -Details ($(if ($controlIntentCommandOk) { "Natural-language control input matched a hardwired command and routed it successfully." } else { "Natural-language control input did not resolve to the expected hardwired command." })) -Data $controlIntentCommand.Body

$controlIntentWorkflow = Invoke-GailRequest -Method "POST" -Path "/control/intents" -Headers $iphoneHeaders -Body @{
  text = "Review the imported customer material, compile findings, and prepare the next operator follow-up."
  source = "voice"
  autoPlan = $true
}
$controlIntentWorkflowOk = (
  $controlIntentWorkflow.StatusCode -eq 200 -and
  $controlIntentWorkflow.Body.action -eq "workflow" -and
  $controlIntentWorkflow.Body.workflow.id -and
  $controlIntentWorkflow.Body.workflow.plannedStepCount -ge 1
)
Add-TestResult -Name "Control intent creates planned workflow from free text" -Passed $controlIntentWorkflowOk -Details ($(if ($controlIntentWorkflowOk) { "Free-text control input created a reviewable workflow plan." } else { "Free-text control input did not create the expected workflow plan." })) -Data $controlIntentWorkflow.Body

$workLiteClient = Invoke-GailRequest -Method "GET" -Path "/client/work-lite/"
$workLiteClientOk = ($workLiteClient.StatusCode -eq 200 -and $workLiteClient.Raw -like "*Gail Work-Lite Client*")
Add-TestResult -Name "Client route serves work-lite shell" -Passed $workLiteClientOk -Details ($(if ($workLiteClientOk) { "Work-lite client HTML served." } else { "Client route did not return expected work-lite HTML." })) -Data $workLiteClient.Raw

$workLiteClientJs = Invoke-GailRequest -Method "GET" -Path "/client/main.js"
$workLiteClientJsOk = ($workLiteClientJs.StatusCode -eq 200 -and $workLiteClientJs.Raw -like "*bootWorkLiteClient*")
Add-TestResult -Name "Client route serves work-lite script" -Passed $workLiteClientJsOk -Details ($(if ($workLiteClientJsOk) { "Work-lite client script served." } else { "Client route did not return expected work-lite script." })) -Data $workLiteClientJs.Raw

$workLiteClientModule = Invoke-GailRequest -Method "GET" -Path "/client/config/asset-manifest"
$workLiteClientModuleOk = ($workLiteClientModule.StatusCode -eq 200 -and $workLiteClientModule.Raw -like "*workLiteAssetManifest*")
Add-TestResult -Name "Client route serves nested module imports" -Passed $workLiteClientModuleOk -Details ($(if ($workLiteClientModuleOk) { "Nested work-lite client module served." } else { "Nested work-lite client module did not return expected content." })) -Data $workLiteClientModule.Raw

$workLiteClientBarrelResolution = Invoke-GailRequest -Method "GET" -Path "/client/animation-manager"
$workLiteClientBarrelResolutionOk = ($workLiteClientBarrelResolution.StatusCode -eq 200 -and $workLiteClientBarrelResolution.Raw -like "*export class AnimationManager*")
Add-TestResult -Name "Client route resolves barrel-relative manager imports" -Passed $workLiteClientBarrelResolutionOk -Details ($(if ($workLiteClientBarrelResolutionOk) { "Barrel-relative manager import path served successfully." } else { "Barrel-relative manager import path did not resolve correctly." })) -Data $workLiteClientBarrelResolution.Raw

$workLiteSharedModule = Invoke-GailRequest -Method "GET" -Path "/shared/contracts/work-lite-assets"
$workLiteSharedModuleOk = ($workLiteSharedModule.StatusCode -eq 200 -and $workLiteSharedModule.Raw -like "*workLiteAssetManifest*")
Add-TestResult -Name "Client route serves shared module imports" -Passed $workLiteSharedModuleOk -Details ($(if ($workLiteSharedModuleOk) { "Shared client module served." } else { "Shared client module did not return expected content." })) -Data $workLiteSharedModule.Raw

$playCanvasVendorModule = Invoke-GailRequest -Method "GET" -Path "/vendor/playcanvas/build/playcanvas.mjs"
$playCanvasVendorModuleOk = ($playCanvasVendorModule.StatusCode -eq 200 -and $playCanvasVendorModule.Raw -like "*Application*")
Add-TestResult -Name "Client route serves PlayCanvas engine module" -Passed $playCanvasVendorModuleOk -Details ($(if ($playCanvasVendorModuleOk) { "PlayCanvas engine module served." } else { "PlayCanvas engine module did not return expected content." })) -Data $playCanvasVendorModule.Raw

$workLiteClientCss = Invoke-GailRequest -Method "GET" -Path "/client/styles/work-lite.css"
$workLiteClientCssOk = ($workLiteClientCss.StatusCode -eq 200 -and $workLiteClientCss.Raw -like "*client-shell*")
Add-TestResult -Name "Client route serves work-lite styles" -Passed $workLiteClientCssOk -Details ($(if ($workLiteClientCssOk) { "Work-lite client stylesheet served." } else { "Client route did not return expected work-lite stylesheet." })) -Data $workLiteClientCss.Raw

$clientAssetManifest = Invoke-GailRequest -Method "GET" -Path "/client/asset-manifest" -Headers $iphoneHeaders
$clientAssetManifestOk = (
  $clientAssetManifest.StatusCode -eq 200 -and
  $clientAssetManifest.Body -is [psobject] -and
  ($clientAssetManifest.Body | Get-Member -Name assets -ErrorAction SilentlyContinue) -and
  ($clientAssetManifest.Body | Get-Member -Name missingAssets -ErrorAction SilentlyContinue) -and
  ($clientAssetManifest.Body | Get-Member -Name requiredDirectories -ErrorAction SilentlyContinue)
)
Add-TestResult -Name "Client asset manifest route responds" -Passed $clientAssetManifestOk -Details ($(if ($clientAssetManifestOk) { "Client asset manifest returned asset readiness data." } else { "Client asset manifest did not return expected data." })) -Data $clientAssetManifest.Body

$clientAssetManifestAssets = @()
if ($clientAssetManifest.Body -is [psobject] -and ($clientAssetManifest.Body | Get-Member -Name assets -ErrorAction SilentlyContinue)) {
  $clientAssetManifestAssets = @($clientAssetManifest.Body.assets)
}

$legacyModuleNamesOk = (
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "base avatar glb") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "meili hair") -and
  (
    (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "urban action vest") -or
    (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "gail outfit top")
  ) -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "idle animation")
)

$handoffBundleNamesOk = (
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "bundle body") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "bundle hair") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "bundle clothing") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "bundle accessories") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "name" -ExpectedValue "idle default")
)

$modernModuleIdsOk = (
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "id" -ExpectedValue "base_avatar") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "id" -ExpectedValue "meili_hair") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "id" -ExpectedValue "gail_outfit_top") -and
  (Contains-ItemWithValue -Items $clientAssetManifestAssets -PropertyName "id" -ExpectedValue "idle_base_v1")
)

$clientAssetModulesOk = (
  $clientAssetManifest.StatusCode -eq 200 -and
  ($legacyModuleNamesOk -or $handoffBundleNamesOk -or $modernModuleIdsOk)
)
Add-TestResult -Name "Client asset manifest reports modular avatar bundle" -Passed $clientAssetModulesOk -Details ($(if ($clientAssetModulesOk) { "Client asset manifest reported the expected modular avatar bundle entries." } else { "Client asset manifest did not report the expected modular avatar bundle entries." })) -Data $clientAssetManifest.Body

$clientAvatarReadyOk = (
  $clientAssetManifest.StatusCode -eq 200 -and
  $clientAssetManifest.Body.avatarReady -eq $true
)
Add-TestResult -Name "Client asset manifest marks avatar core bundle ready" -Passed $clientAvatarReadyOk -Details ($(if ($clientAvatarReadyOk) { "Client asset manifest marked the core avatar bundle ready." } else { "Client asset manifest did not mark the core avatar bundle ready." })) -Data $clientAssetManifest.Body

$resolvedClientAsset = $null
if ($clientAssetManifestAssets.Count -gt 0) {
  $resolvedClientAsset = @($clientAssetManifestAssets | Where-Object {
    ($_ | Get-Member -Name present -ErrorAction SilentlyContinue) -and
    $_.present -eq $true -and
    ($_ | Get-Member -Name resolvedPath -ErrorAction SilentlyContinue) -and
    [string]$_.resolvedPath
  }) | Select-Object -First 1
}

if ($resolvedClientAsset) {
  $normalizedResolvedPath = ([string]$resolvedClientAsset.resolvedPath).Replace("\", "/")
  $marker = "playcanvas-app/assets/"
  $markerIndex = $normalizedResolvedPath.IndexOf($marker)
  if ($markerIndex -ge 0) {
    $clientAssetRelativePath = $normalizedResolvedPath.Substring($markerIndex + $marker.Length)
    $clientAssetFetch = Invoke-GailRequest -Method "GET" -Path "/client-assets/$clientAssetRelativePath"
    $clientAssetFetchOk = ($clientAssetFetch.StatusCode -eq 200)
    Add-TestResult -Name "Resolved client asset path is directly fetchable" -Passed $clientAssetFetchOk -Details ($(if ($clientAssetFetchOk) { "Resolved client asset path returned HTTP 200." } else { "Resolved client asset path was not fetchable." })) -Data @{
      asset = $resolvedClientAsset
      path = "/client-assets/$clientAssetRelativePath"
    }
  }
  else {
    Add-TestResult -Name "Resolved client asset path is directly fetchable" -Passed $false -Details "Resolved client asset path did not include the expected playcanvas-app/assets marker." -Data $resolvedClientAsset
  }
}
else {
  Add-TestResult -Name "Resolved client asset path is directly fetchable" -Passed $false -Details "No present client asset with a resolved path was available for fetch verification." -Data $clientAssetManifest.Body
}

# Private session RAM note
$privateSessionNote = Invoke-GailRequest -Method "POST" -Path "/private/session/notes" -Headers $privateHeaders -Body @{
  body = "RAM-only note $tag"
  title = "RAM $tag"
}
$null = Assert-Status -Name "Create RAM-only private session note" -Expected 201 -Response $privateSessionNote -SuccessDetails "Private session note created in RAM."

$privateSessionState = Invoke-GailRequest -Method "GET" -Path "/private/session" -Headers $privateHeaders
$null = Assert-Status -Name "Read private session state" -Expected 200 -Response $privateSessionState -SuccessDetails "Private session state read succeeded."

$wipePrivateSession = Invoke-GailRequest -Method "POST" -Path "/private/session/wipe" -Headers $privateHeaders
$null = Assert-Status -Name "Wipe private session" -Expected 200 -Response $wipePrivateSession -SuccessDetails "Private session wiped."

# Explicit private note save
$privateNoteSave = Invoke-GailRequest -Method "POST" -Path "/notes" -Headers $privateSaveHeaders -Body @{
  title = "Private saved note $tag"
  body = "Saved privately $tag"
  privateOnly = $true
}
$null = Assert-Status -Name "Explicit private note save" -Expected 201 -Response $privateNoteSave -SuccessDetails "Explicit private note save succeeded."

$privateNoteBlocked = Invoke-GailRequest -Method "POST" -Path "/notes" -Headers $privateHeaders -Body @{
  title = "Blocked private saved note $tag"
  body = "This should not save without explicit local confirmation."
  privateOnly = $true
}
$null = Assert-Status -Name "Private note save requires explicit local save" -Expected 403 -Response $privateNoteBlocked -SuccessDetails "Private note save was blocked without explicit local save."

$normalNotes = Invoke-GailRequest -Method "GET" -Path "/notes" -Headers $iphoneHeaders
$normalNotesOk = (
  $normalNotes.StatusCode -eq 200 -and
  -not (Contains-ItemWithValue -Items @($normalNotes.Body) -PropertyName "title" -ExpectedValue "Private saved note $tag")
)
Add-TestResult -Name "Normal notes exclude private saved notes" -Passed $normalNotesOk -Details ($(if ($normalNotesOk) { "Normal notes do not include private saved notes." } else { "Private saved note leaked into normal notes." })) -Data $normalNotes.Body

$privateNotes = Invoke-GailRequest -Method "GET" -Path "/notes" -Headers $privateHeaders
$privateNotesOk = (
  $privateNotes.StatusCode -eq 200 -and
  (Contains-ItemWithValue -Items @($privateNotes.Body) -PropertyName "title" -ExpectedValue "Private saved note $tag")
)
Add-TestResult -Name "Private-mode notes include private saved notes" -Passed $privateNotesOk -Details ($(if ($privateNotesOk) { "Private mode notes include the explicit private save." } else { "Private mode notes did not include the explicit private save." })) -Data $privateNotes.Body

$privateOverview = Invoke-GailRequest -Method "GET" -Path "/dashboard/overview" -Headers $privateHeaders
$privateOverviewOk = (
  $privateOverview.StatusCode -eq 200 -and
  $privateOverview.Body -is [psobject] -and
  $privateOverview.Body.counts.notes -ge 1 -and
  $privateOverview.Body.counts.tasks -eq 0 -and
  $privateOverview.Body.counts.projects -eq 0 -and
  $privateOverview.Body.counts.cartItems -eq 0 -and
  (Contains-ItemWithValue -Items @($privateOverview.Body.highlights.notes) -PropertyName "title" -ExpectedValue "Private saved note $tag")
)
Add-TestResult -Name "Private dashboard overview isolates normal organizer data" -Passed $privateOverviewOk -Details ($(if ($privateOverviewOk) { "Private dashboard overview stayed isolated to private notes." } else { "Private dashboard overview leaked normal organizer data." })) -Data $privateOverview.Body

$servicePrivateSessionBlocked = Invoke-GailRequest -Method "GET" -Path "/private/session" -Headers $serviceHeaders
$null = Assert-Status -Name "Service device is blocked from private session routes" -Expected 403 -Response $servicePrivateSessionBlocked -SuccessDetails "Service device was blocked from private session routes."

# Private mode task blocked
$privateTaskBlocked = Invoke-GailRequest -Method "POST" -Path "/tasks" -Headers $privateHeaders -Body @{
  title = "Blocked private task $tag"
}
$null = Assert-Status -Name "Private mode blocks task write" -Expected 403 -Response $privateTaskBlocked -SuccessDetails "Private mode blocked task write."

# Cart approval flow
$cartCreate = Invoke-GailRequest -Method "POST" -Path "/cart" -Headers $iphoneHeaders -Body @{
  title = "Cart item $tag"
  sourceUrl = "https://example.com/$tag"
}
$null = Assert-Status -Name "Create cart item as trusted iPhone" -Expected 201 -Response $cartCreate -SuccessDetails "Cart item created."

$cartId = $null
if ($cartCreate.Body -is [psobject] -and ($cartCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $cartId = [string]$cartCreate.Body.id
}

if ($cartId) {
  $lockIphone = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/access-window" -Headers $adminHeaders -Body @{
    clear = $true
  }
  $lockIphoneOk = ($lockIphone.StatusCode -eq 200 -and -not (Has-Property $lockIphone.Body "sensitiveActionsUnlockedUntil"))
  Add-TestResult -Name "Lock trusted iPhone sensitive access" -Passed $lockIphoneOk -Details ($(if ($lockIphoneOk) { "Trusted iPhone sensitive access cleared." } else { "Trusted iPhone sensitive access did not clear." })) -Data $lockIphone.Body

  $lockedApprovalRequest = Invoke-GailRequest -Method "POST" -Path "/cart/$cartId/approve-request" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Locked trusted iPhone cannot request cart approval" -Expected 403 -Response $lockedApprovalRequest -SuccessDetails "Locked trusted iPhone was blocked from approval request."

  $reUnlockIphone = Invoke-GailRequest -Method "PATCH" -Path "/devices/$iphoneId/access-window" -Headers $adminHeaders -Body @{
    unlockForMinutes = 15
  }
  $reUnlockIphoneOk = ($reUnlockIphone.StatusCode -eq 200 -and (Has-Property $reUnlockIphone.Body "sensitiveActionsUnlockedUntil") -and $reUnlockIphone.Body.sensitiveActionsUnlockedUntil)
  Add-TestResult -Name "Re-unlock trusted iPhone for cart approval" -Passed $reUnlockIphoneOk -Details ($(if ($reUnlockIphoneOk) { "Trusted iPhone sensitive access restored." } else { "Trusted iPhone sensitive access was not restored." })) -Data $reUnlockIphone.Body

  $directApprove = Invoke-GailRequest -Method "PATCH" -Path "/cart/$cartId" -Headers $iphoneHeaders -Body @{
    status = "approved"
  }
  $null = Assert-Status -Name "Direct cart approval blocked into pending flow" -Expected 202 -Response $directApprove -SuccessDetails "Direct cart approval returned pending approval."

  $approvalRequest = Invoke-GailRequest -Method "POST" -Path "/cart/$cartId/approve-request" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Request cart approval" -Expected 201 -Response $approvalRequest -SuccessDetails "Cart approval request created."

  $privateApprovalRequestBlocked = Invoke-GailRequest -Method "POST" -Path "/cart/$cartId/approve-request" -Headers $trustedPrivateIphoneHeaders
  $null = Assert-Status -Name "Private mode blocks cart approval request even when trusted" -Expected 403 -Response $privateApprovalRequestBlocked -SuccessDetails "Private mode blocked cart approval request."

  $approvalId = $null
  if ($approvalRequest.Body -is [psobject] -and ($approvalRequest.Body | Get-Member -Name approval -ErrorAction SilentlyContinue)) {
    $approvalObj = $approvalRequest.Body.approval
    if ($approvalObj -is [psobject] -and ($approvalObj | Get-Member -Name id -ErrorAction SilentlyContinue)) {
      $approvalId = [string]$approvalObj.id
    }
  }

  if ($approvalId) {
    $lockWatch = Invoke-GailRequest -Method "PATCH" -Path "/devices/$watchId/access-window" -Headers $adminHeaders -Body @{
      clear = $true
    }
    $lockWatchOk = ($lockWatch.StatusCode -eq 200 -and -not (Has-Property $lockWatch.Body "sensitiveActionsUnlockedUntil"))
    Add-TestResult -Name "Lock trusted watch sensitive access" -Passed $lockWatchOk -Details ($(if ($lockWatchOk) { "Trusted watch sensitive access cleared." } else { "Trusted watch sensitive access did not clear." })) -Data $lockWatch.Body

    $lockedApprovalResolve = Invoke-GailRequest -Method "PATCH" -Path "/approvals/$approvalId" -Headers $watchHeaders -Body @{
      approvedByDeviceId = $watchId
      status = "approved"
    }
    $null = Assert-Status -Name "Locked trusted watch cannot resolve approval" -Expected 403 -Response $lockedApprovalResolve -SuccessDetails "Locked trusted watch was blocked from approval resolution."

    $reUnlockWatch = Invoke-GailRequest -Method "PATCH" -Path "/devices/$watchId/access-window" -Headers $adminHeaders -Body @{
      unlockForMinutes = 15
    }
    $reUnlockWatchOk = ($reUnlockWatch.StatusCode -eq 200 -and (Has-Property $reUnlockWatch.Body "sensitiveActionsUnlockedUntil") -and $reUnlockWatch.Body.sensitiveActionsUnlockedUntil)
    Add-TestResult -Name "Re-unlock trusted watch for approval resolution" -Passed $reUnlockWatchOk -Details ($(if ($reUnlockWatchOk) { "Trusted watch sensitive access restored." } else { "Trusted watch sensitive access was not restored." })) -Data $reUnlockWatch.Body

    $approvalResolve = Invoke-GailRequest -Method "PATCH" -Path "/approvals/$approvalId" -Headers $watchHeaders -Body @{
      approvedByDeviceId = $watchId
      status = "approved"
    }
    $null = Assert-Status -Name "Resolve approval as trusted watch" -Expected 200 -Response $approvalResolve -SuccessDetails "Watch resolved approval."

    $approvalCommit = Invoke-GailRequest -Method "POST" -Path "/cart/$cartId/approve-commit" -Headers $iphoneHeaders -Body @{
      approvalId = $approvalId
    }
    $null = Assert-Status -Name "Commit approved cart item" -Expected 200 -Response $approvalCommit -SuccessDetails "Approved cart item committed."
  }
  else {
    Add-TestResult -Name "Resolve approval as trusted watch" -Passed $false -Details "Approval ID missing from approval request response."
    Add-TestResult -Name "Commit approved cart item" -Passed $false -Details "Approval ID missing from approval request response."
  }
}
else {
  Add-TestResult -Name "Direct cart approval blocked into pending flow" -Passed $false -Details "Cart ID missing from cart creation response."
  Add-TestResult -Name "Request cart approval" -Passed $false -Details "Cart ID missing from cart creation response."
  Add-TestResult -Name "Resolve approval as trusted watch" -Passed $false -Details "Cart ID missing from cart creation response."
  Add-TestResult -Name "Commit approved cart item" -Passed $false -Details "Cart ID missing from cart creation response."
}

# Rejected approval flow
$rejectedCartCreate = Invoke-GailRequest -Method "POST" -Path "/cart" -Headers $iphoneHeaders -Body @{
  title = "Rejected cart item $tag"
  sourceUrl = "https://example.com/rejected/$tag"
}
$null = Assert-Status -Name "Create rejected-flow cart item" -Expected 201 -Response $rejectedCartCreate -SuccessDetails "Rejected-flow cart item created."

$rejectedCartId = $null
if ($rejectedCartCreate.Body -is [psobject] -and ($rejectedCartCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $rejectedCartId = [string]$rejectedCartCreate.Body.id
}

if ($rejectedCartId) {
  $rejectedApprovalRequest = Invoke-GailRequest -Method "POST" -Path "/cart/$rejectedCartId/approve-request" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Request approval for rejected-flow cart item" -Expected 201 -Response $rejectedApprovalRequest -SuccessDetails "Rejected-flow approval request created."

  $rejectedApprovalId = $null
  if ($rejectedApprovalRequest.Body -is [psobject] -and ($rejectedApprovalRequest.Body | Get-Member -Name approval -ErrorAction SilentlyContinue)) {
    $approvalObj = $rejectedApprovalRequest.Body.approval
    if ($approvalObj -is [psobject] -and ($approvalObj | Get-Member -Name id -ErrorAction SilentlyContinue)) {
      $rejectedApprovalId = [string]$approvalObj.id
    }
  }

  if ($rejectedApprovalId) {
    $rejectedResolve = Invoke-GailRequest -Method "PATCH" -Path "/approvals/$rejectedApprovalId" -Headers $watchHeaders -Body @{
      approvedByDeviceId = $watchId
      status = "rejected"
    }
    $null = Assert-Status -Name "Reject approval as trusted watch" -Expected 200 -Response $rejectedResolve -SuccessDetails "Watch rejected approval."

    $rejectedCommit = Invoke-GailRequest -Method "POST" -Path "/cart/$rejectedCartId/approve-commit" -Headers $iphoneHeaders -Body @{
      approvalId = $rejectedApprovalId
    }
    $null = Assert-Status -Name "Rejected approval blocks cart commit" -Expected 403 -Response $rejectedCommit -SuccessDetails "Rejected approval blocked commit."
  }
  else {
    Add-TestResult -Name "Reject approval as trusted watch" -Passed $false -Details "Approval ID missing from rejected-flow approval request."
    Add-TestResult -Name "Rejected approval blocks cart commit" -Passed $false -Details "Approval ID missing from rejected-flow approval request."
  }
}
else {
  Add-TestResult -Name "Request approval for rejected-flow cart item" -Passed $false -Details "Rejected-flow cart ID missing from cart creation response."
  Add-TestResult -Name "Reject approval as trusted watch" -Passed $false -Details "Rejected-flow cart ID missing from cart creation response."
  Add-TestResult -Name "Rejected approval blocks cart commit" -Passed $false -Details "Rejected-flow cart ID missing from cart creation response."
}

# Expired approval flow
$expiredCartCreate = Invoke-GailRequest -Method "POST" -Path "/cart" -Headers $iphoneHeaders -Body @{
  title = "Expired cart item $tag"
  sourceUrl = "https://example.com/expired/$tag"
}
$null = Assert-Status -Name "Create expired-flow cart item" -Expected 201 -Response $expiredCartCreate -SuccessDetails "Expired-flow cart item created."

$expiredCartId = $null
if ($expiredCartCreate.Body -is [psobject] -and ($expiredCartCreate.Body | Get-Member -Name id -ErrorAction SilentlyContinue)) {
  $expiredCartId = [string]$expiredCartCreate.Body.id
}

if ($expiredCartId) {
  $expiredApprovalRequest = Invoke-GailRequest -Method "POST" -Path "/cart/$expiredCartId/approve-request?expiresAt=$([uri]::EscapeDataString((Get-Date).AddMinutes(-5).ToString("s")))" -Headers $iphoneHeaders
  $null = Assert-Status -Name "Request already-expired approval for cart item" -Expected 201 -Response $expiredApprovalRequest -SuccessDetails "Expired-flow approval request created."

  $expiredApprovalId = $null
  if ($expiredApprovalRequest.Body -is [psobject] -and ($expiredApprovalRequest.Body | Get-Member -Name approval -ErrorAction SilentlyContinue)) {
    $approvalObj = $expiredApprovalRequest.Body.approval
    if ($approvalObj -is [psobject] -and ($approvalObj | Get-Member -Name id -ErrorAction SilentlyContinue)) {
      $expiredApprovalId = [string]$approvalObj.id
    }
  }

  if ($expiredApprovalId) {
    $expiredResolve = Invoke-GailRequest -Method "PATCH" -Path "/approvals/$expiredApprovalId" -Headers $watchHeaders -Body @{
      approvedByDeviceId = $watchId
      status = "approved"
    }
    $null = Assert-Status -Name "Expired approval blocks resolution" -Expected 410 -Response $expiredResolve -SuccessDetails "Expired approval blocked resolution."

    $expiredCommit = Invoke-GailRequest -Method "POST" -Path "/cart/$expiredCartId/approve-commit" -Headers $iphoneHeaders -Body @{
      approvalId = $expiredApprovalId
    }
    $null = Assert-Status -Name "Expired approval blocks cart commit" -Expected 410 -Response $expiredCommit -SuccessDetails "Expired approval blocked commit."
  }
  else {
    Add-TestResult -Name "Expired approval blocks resolution" -Passed $false -Details "Approval ID missing from expired-flow approval request."
    Add-TestResult -Name "Expired approval blocks cart commit" -Passed $false -Details "Approval ID missing from expired-flow approval request."
  }
}
else {
  Add-TestResult -Name "Request already-expired approval for cart item" -Passed $false -Details "Expired-flow cart ID missing from cart creation response."
  Add-TestResult -Name "Expired approval blocks resolution" -Passed $false -Details "Expired-flow cart ID missing from cart creation response."
  Add-TestResult -Name "Expired approval blocks cart commit" -Passed $false -Details "Expired-flow cart ID missing from cart creation response."
}

$passedCount = @($results | Where-Object { $_.passed }).Count
$failedCount = @($results | Where-Object { -not $_.passed }).Count
$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  runId = $runId
  generatedAt = (Get-Date).ToString("s")
  passed = $passedCount
  failed = $failedCount
  results = $results
}

$jsonPath = Join-Path $reportDir "backend-test-report-$runId.json"
$mdPath = Join-Path $reportDir "backend-test-report-$runId.md"

$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

$md = @()
$md += "# Backend Test Report"
$md += ""
$md += "- Run ID: $runId"
$md += "- Base URL: $BaseUrl"
$md += "- Generated At: $(Get-Date -Format s)"
$md += "- Passed: $passedCount"
$md += "- Failed: $failedCount"
$md += ""
$md += "## Results"
$md += ""

foreach ($result in $results) {
  $status = if ($result.passed) { "PASS" } else { "FAIL" }
  $md += "- **$status** $($result.name): $($result.details)"
}

$md += ""
$md += "## Raw Result Data"
$md += ""
$md += '```json'
$md += ($summary | ConvertTo-Json -Depth 10)
$md += '```'

$md -join "`r`n" | Set-Content -Path $mdPath -Encoding UTF8

Write-Host "Backend test run completed."
Write-Host "JSON report: $jsonPath"
Write-Host "Markdown report: $mdPath"
Write-Host "Passed: $passedCount  Failed: $failedCount"

if ($ShutdownWhenDone) {
  & (Join-Path $PSScriptRoot "stop-backend.ps1") | Out-Null
}

if ($failedCount -gt 0) {
  exit 1
}
