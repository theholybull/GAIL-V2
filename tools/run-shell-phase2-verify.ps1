param(
  [string]$BaseUrl = "http://127.0.0.1:4180"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function To-Array {
  param([object]$Value)
  if ($null -eq $Value) { return @() }
  if ($Value -is [string]) { return @($Value) }
  if ($Value -is [System.Collections.IEnumerable]) { return @($Value) }
  return @($Value)
}

function Invoke-GailJson {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body
  )
  $headers = @{
    "x-gail-device-id" = "phase2-verify"
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
function Add-Result {
  param([string]$Name, [bool]$Pass, [string]$Detail)
  $results.Add([pscustomobject]@{
    name = $Name
    pass = $Pass
    detail = $Detail
  })
}

$runtime = Invoke-GailJson -Method "GET" -Path "/client/runtime-settings" -Body $null
$runtimeOk = ($runtime.activeAvatarSystem -ne $null) -and ($runtime.activeAssetRoot -ne $null) -and (@($runtime.availableAvatarSystems).Count -ge 1)
Add-Result -Name "Avatar runtime settings wired" -Pass $runtimeOk -Detail "activeSystem=$($runtime.activeAvatarSystem) assetRoot=$($runtime.activeAssetRoot)"

$manifest = Invoke-GailJson -Method "GET" -Path "/client/asset-manifest" -Body $null
$assets = @(To-Array($manifest.assets))
$wardrobeKinds = @($assets | Where-Object { $_.kind -in @("clothing", "hair", "accessory", "texture") })
$animKinds = @($assets | Where-Object { $_.kind -eq "animation" })
Add-Result -Name "Avatar manifest wired" -Pass ($manifest.avatarReady -eq $true) -Detail "avatarReady=$($manifest.avatarReady) source=$($manifest.manifestSource)"
Add-Result -Name "Wardrobe data wired" -Pass ($wardrobeKinds.Count -ge 1) -Detail "wardrobeAssets=$($wardrobeKinds.Count)"
Add-Result -Name "Animation data wired" -Pass ($animKinds.Count -ge 1) -Detail "animationAssets=$($animKinds.Count)"

$exports = Invoke-GailJson -Method "GET" -Path "/exports/status" -Body $null
$exportsOk = ($exports -ne $null)
Add-Result -Name "Animation export status wired" -Pass $exportsOk -Detail ($(if ($exportsOk) { "status loaded" } else { "status missing" }))

$commands = @(To-Array(Invoke-GailJson -Method "GET" -Path "/commands" -Body $null))
$commandKeys = @($commands | ForEach-Object { $_.key })
Add-Result -Name "Action graph command list wired" -Pass ($commands.Count -ge 1) -Detail "commands=$($commands.Count)"

$phraseTag = Get-Date -Format "yyyyMMdd-HHmmss"
$customPhrase = "phase2 show tasks $phraseTag"
$mappingCreate = Invoke-GailJson -Method "POST" -Path "/commands/mappings" -Body @{
  commandKey = "show_tasks"
  phrase = $customPhrase
}
$mappingList = Invoke-GailJson -Method "GET" -Path "/commands/mappings" -Body $null
$mappings = @(To-Array($mappingList.mappings))
$mappingFound = @($mappings | Where-Object { $_.phrase -eq $customPhrase -and $_.commandKey -eq "show_tasks" }).Count -ge 1
Add-Result -Name "Action graph mapping save wired" -Pass $mappingFound -Detail "mappings=$($mappings.Count) createdId=$($mappingCreate.mapping.id)"

$execute = Invoke-GailJson -Method "POST" -Path "/commands/execute" -Body @{ phrase = $customPhrase }
$executeOk = ($execute.command.key -eq "show_tasks") -and ($execute.status -ne "failed")
Add-Result -Name "Action graph mapping execute wired" -Pass $executeOk -Detail "matched=$($execute.command.key) status=$($execute.status)"

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
