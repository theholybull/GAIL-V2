param(
  [string]$BlenderExe = "",
  [string]$RunLabel = "persona-ingest-20260420"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "blender-common.ps1")

function Get-OptionalMemberValue {
  param(
    [Parameter(Mandatory = $true)]
    [object]$InputObject,

    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if ($null -eq $InputObject) {
    return $null
  }

  if ($InputObject -is [System.Collections.IDictionary]) {
    if ($InputObject.Contains($Name)) {
      return $InputObject[$Name]
    }
    return $null
  }

  $Property = $InputObject.PSObject.Properties[$Name]
  if ($null -eq $Property) {
    return $null
  }

  return $Property.Value
}

function Format-NativeProcessArgument {
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return '""'
  }

  $Text = [string]$Value
  if ($Text -notmatch '[\s"]') {
    return $Text
  }

  $Escaped = $Text -replace '(\\*)"', '$1$1\"'
  $Escaped = $Escaped -replace '(\\+)$', '$1$1'
  return '"' + $Escaped + '"'
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ResolvedBlenderExe = if ($BlenderExe) { $BlenderExe } else { Resolve-GailBlenderExe -RepoRoot $RepoRoot }
$BlenderScript = Join-Path $RepoRoot "tools\export_persona_assets.py"
$RunRoot = Join-Path $RepoRoot ("cleanup-hub\" + $RunLabel)
$ExportsRoot = Join-Path $RunRoot "exports"
$ReportsRoot = Join-Path $RunRoot "reports"
$LogsRoot = Join-Path $RunRoot "logs"

New-Item -ItemType Directory -Force -Path $ExportsRoot, $ReportsRoot, $LogsRoot | Out-Null

$Sources = @(
  [ordered]@{ id = "cherry"; blend = "D:\avatars\Cherry\Cherry.blend" },
  [ordered]@{ id = "gail"; blend = "D:\avatars\Gail\gail.blend" },
  [ordered]@{ id = "vera"; blend = "D:\avatars\Vera\vera.blend" },
  [ordered]@{ id = "gail_daily_jacket"; blend = "D:\avatars\Gail\clothes\gail_daily_jacket.blend" },
  [ordered]@{ id = "gail_work_1"; blend = "D:\avatars\Gail\clothes\gail_work_1.blend" }
)

$SourceManifestPath = Join-Path $RunRoot "source-manifest.json"
$SummaryPath = Join-Path $RunRoot "ingest-summary.json"
$SummaryMarkdownPath = Join-Path $RunRoot "ingest-summary.md"

$Sources | ConvertTo-Json -Depth 5 | Set-Content -Path $SourceManifestPath -Encoding UTF8

$Results = @()

foreach ($Source in $Sources) {
  $BlendPath = $Source.blend
  if (-not (Test-Path -LiteralPath $BlendPath -PathType Leaf)) {
    $Results += [ordered]@{
      id = $Source.id
      blend = $BlendPath
      status = "missing"
      report = $null
      log = $null
      error = "Blend file not found."
    }
    continue
  }

  $OutputRoot = Join-Path $ExportsRoot $Source.id
  $ReportPath = Join-Path $ReportsRoot ($Source.id + ".json")
  $LogPath = Join-Path $LogsRoot ($Source.id + ".log")
  $StdOutPath = Join-Path $LogsRoot ($Source.id + ".stdout.log")
  $StdErrPath = Join-Path $LogsRoot ($Source.id + ".stderr.log")

  $ArgumentList = @(
    $BlendPath,
    "-b",
    "--python-exit-code", "1",
    "--python", $BlenderScript,
    "--",
    "--persona-id", $Source.id,
    "--output-root", $OutputRoot,
    "--report-path", $ReportPath
  )

  $ExitCode = 0
  try {
    if (Test-Path -LiteralPath $StdOutPath) {
      Remove-Item -LiteralPath $StdOutPath -Force
    }
    if (Test-Path -LiteralPath $StdErrPath) {
      Remove-Item -LiteralPath $StdErrPath -Force
    }

    $QuotedArgumentList = $ArgumentList | ForEach-Object { Format-NativeProcessArgument -Value $_ }

    $Process = Start-Process `
      -FilePath $ResolvedBlenderExe `
      -ArgumentList ($QuotedArgumentList -join " ") `
      -Wait `
      -PassThru `
      -NoNewWindow `
      -RedirectStandardOutput $StdOutPath `
      -RedirectStandardError $StdErrPath

    $ExitCode = $Process.ExitCode
  } catch {
    $ExitCode = if ($LASTEXITCODE) { $LASTEXITCODE } else { 1 }
    ($_ | Out-String) | Set-Content -Path $LogPath -Encoding UTF8
  } finally {
    $StdOutText = if (Test-Path -LiteralPath $StdOutPath) {
      Get-Content -Path $StdOutPath -Raw
    } else {
      ""
    }
    $StdErrText = if (Test-Path -LiteralPath $StdErrPath) {
      Get-Content -Path $StdErrPath -Raw
    } else {
      ""
    }

    ($StdOutText + $StdErrText) | Set-Content -Path $LogPath -Encoding UTF8
  }

  $Status = if ($ExitCode -eq 0 -and (Test-Path -LiteralPath $ReportPath)) { "ok" } else { "failed" }
  $Result = [ordered]@{
    id = $Source.id
    blend = $BlendPath
    status = $Status
    exit_code = $ExitCode
    report = $ReportPath
    log = $LogPath
  }

  if ($ExitCode -eq 0 -and -not (Test-Path -LiteralPath $ReportPath)) {
    $Result.error = "Blender exited cleanly but no report was written."
  }

  if (Test-Path -LiteralPath $ReportPath) {
    $Report = Get-Content -Path $ReportPath -Raw | ConvertFrom-Json
    $Result.avatar = $Report.exports.avatar
    $Result.hair = $Report.exports.hair
    $Result.clothes = $Report.exports.clothes
    $Result.warnings = @($Report.warnings)
    $Result.errors = @($Report.errors)
  }

  $Results += $Result
}

$Summary = [ordered]@{
  generated_at = (Get-Date).ToString("s")
  blender_exe = $ResolvedBlenderExe
  run_root = $RunRoot
  source_manifest = $SourceManifestPath
  results = $Results
}

$Summary | ConvertTo-Json -Depth 10 | Set-Content -Path $SummaryPath -Encoding UTF8

$Markdown = New-Object System.Collections.Generic.List[string]
$Markdown.Add("# Persona Asset Ingest Summary")
$Markdown.Add("")
$Markdown.Add(('Run root: `' + $RunRoot + '`'))
$Markdown.Add("")
$Markdown.Add("| ID | Status | Avatar | Hair | Clothes | Notes |")
$Markdown.Add("| --- | --- | --- | --- | --- | --- |")

foreach ($Result in $Results) {
  $Avatar = Get-OptionalMemberValue -InputObject $Result -Name "avatar"
  $Hair = Get-OptionalMemberValue -InputObject $Result -Name "hair"
  $Clothes = Get-OptionalMemberValue -InputObject $Result -Name "clothes"
  $Warnings = @(Get-OptionalMemberValue -InputObject $Result -Name "warnings")
  $Errors = @(Get-OptionalMemberValue -InputObject $Result -Name "errors")

  $AvatarStatus = if ($Avatar -and $Avatar.status) { $Avatar.status } else { "-" }
  $HairStatus = if ($Hair -and $Hair.status) { $Hair.status } else { "-" }
  $ClothesStatus = if ($Clothes -and $Clothes.status) { $Clothes.status } else { "-" }
  $Notes = @()
  if ($Result.exit_code -ne 0) {
    $Notes += "exit=$($Result.exit_code)"
  }
  if ($Warnings) {
    $Notes += (($Warnings -join "; ") -replace '\|', '/')
  }
  if ($Errors) {
    $Notes += (($Errors -join "; ") -replace '\|', '/')
  }
  $Markdown.Add("| $($Result.id) | $($Result.status) | $AvatarStatus | $HairStatus | $ClothesStatus | $($Notes -join ' / ') |")
}

$Markdown | Set-Content -Path $SummaryMarkdownPath -Encoding UTF8

Write-Host ""
Write-Host "REPORT $SummaryPath"
Write-Host "REPORT $SummaryMarkdownPath"
