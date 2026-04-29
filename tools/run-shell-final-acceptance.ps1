param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [switch]$SkipBackendTests
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-CheckScript {
  param(
    [string]$Name,
    [string]$ScriptPath,
    [string[]]$Arguments = @()
  )

  $startedAt = Get-Date
  $output = @()
  $exitCode = 1

  try {
    $output = & powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } catch {
    $output = @($_.Exception.Message)
    $exitCode = 1
  }

  $endedAt = Get-Date
  $durationMs = [Math]::Round(($endedAt - $startedAt).TotalMilliseconds)
  $tail = if ($output.Count -gt 0) {
    (($output | Select-Object -Last 3) -join " | ")
  } else {
    ""
  }

  return [pscustomobject]@{
    name = $Name
    script = $ScriptPath
    pass = ($exitCode -eq 0)
    exitCode = $exitCode
    durationMs = $durationMs
    startedAt = $startedAt.ToString("o")
    endedAt = $endedAt.ToString("o")
    detail = $tail
    output = @($output | ForEach-Object { "$_" })
  }
}

$checks = New-Object System.Collections.Generic.List[object]
$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $toolsDir "..")
$reportsDir = Join-Path $repoRoot "docs\reports"
if (-not (Test-Path $reportsDir)) {
  New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null
}

$scriptPlan = @(
  @{ Name = "Phase1 Verify"; Script = "run-shell-phase1-verify.ps1"; Args = @("-BaseUrl", $BaseUrl) },
  @{ Name = "Phase1 Links+Scripts Smoke"; Script = "run-shell-phase1-links-scripts-smoke.ps1"; Args = @("-BaseUrl", $BaseUrl) },
  @{ Name = "Phase2 Verify"; Script = "run-shell-phase2-verify.ps1"; Args = @("-BaseUrl", $BaseUrl) },
  @{ Name = "Phase3 Verify"; Script = "run-shell-phase3-verify.ps1"; Args = @("-BaseUrl", $BaseUrl) },
  @{ Name = "Phase4 Verify"; Script = "run-shell-phase4-verify.ps1"; Args = @("-BaseUrl", $BaseUrl) },
  @{ Name = "Phase5 Verify"; Script = "run-shell-phase5-verify.ps1"; Args = @("-BaseUrl", $BaseUrl) }
)

if (-not $SkipBackendTests) {
  $scriptPlan += @{ Name = "Backend Regression"; Script = "run-backend-tests.ps1"; Args = @() }
}

foreach ($entry in $scriptPlan) {
  $scriptPath = Join-Path $toolsDir $entry.Script
  if (-not (Test-Path $scriptPath)) {
    $checks.Add([pscustomobject]@{
      name = $entry.Name
      script = $scriptPath
      pass = $false
      exitCode = 1
      durationMs = 0
      startedAt = (Get-Date).ToString("o")
      endedAt = (Get-Date).ToString("o")
      detail = "Missing script: $($entry.Script)"
      output = @()
    })
    continue
  }
  $checks.Add((Invoke-CheckScript -Name $entry.Name -ScriptPath $scriptPath -Arguments $entry.Args))
}

$passed = @($checks | Where-Object { $_.pass }).Count
$failed = @($checks | Where-Object { -not $_.pass }).Count
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$backendCheck = $checks | Where-Object { $_.name -eq "Backend Regression" } | Select-Object -First 1
$backendJsonReport = $null
$backendMdReport = $null
if ($backendCheck) {
  $joined = ($backendCheck.output -join "`n")
  $jsonMatch = [regex]::Match($joined, "JSON report:\s*(.+)")
  $mdMatch = [regex]::Match($joined, "Markdown report:\s*(.+)")
  if ($jsonMatch.Success) { $backendJsonReport = $jsonMatch.Groups[1].Value.Trim() }
  if ($mdMatch.Success) { $backendMdReport = $mdMatch.Groups[1].Value.Trim() }
}

$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  timestamp = (Get-Date).ToString("o")
  passed = $passed
  failed = $failed
  skipBackendTests = [bool]$SkipBackendTests
  backendJsonReport = $backendJsonReport
  backendMarkdownReport = $backendMdReport
  checks = $checks
}

$jsonOutPath = Join-Path $reportsDir "final-acceptance-$stamp.json"
$mdOutPath = Join-Path $reportsDir "final-acceptance-$stamp.md"
$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonOutPath

$md = @(
  "# Final Acceptance Run",
  "",
  "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
  "Base URL: $BaseUrl",
  "",
  "## Summary",
  "",
  "- Passed: $passed",
  "- Failed: $failed",
  "- Backend tests skipped: $([bool]$SkipBackendTests)",
  "",
  "## Checks",
  ""
)

foreach ($check in $checks) {
  $status = if ($check.pass) { "PASS" } else { "FAIL" }
  $md += "- [$status] $($check.name) | exitCode=$($check.exitCode) | durationMs=$($check.durationMs)"
}

if ($backendJsonReport -or $backendMdReport) {
  $md += ""
  $md += "## Backend Reports"
  $md += ""
  if ($backendJsonReport) { $md += "- JSON: $backendJsonReport" }
  if ($backendMdReport) { $md += "- Markdown: $backendMdReport" }
}

$md += ""
$md += "## Artifacts"
$md += ""
$md += "- JSON summary: $jsonOutPath"
$md += "- Markdown summary: $mdOutPath"

$md -join "`r`n" | Set-Content -Path $mdOutPath

$summary | ConvertTo-Json -Depth 8
Write-Output "JSON summary: $jsonOutPath"
Write-Output "Markdown summary: $mdOutPath"

if ($failed -gt 0) {
  exit 1
}
