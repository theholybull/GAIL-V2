param(
  [string]$SourceRoot,
  [string]$BackupRoot,
  [switch]$IncludeNodeModules
)

$ErrorActionPreference = "Stop"

if (-not $SourceRoot -or $SourceRoot.Trim().Length -eq 0) {
  $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $SourceRoot = Resolve-Path -LiteralPath (Join-Path $ScriptDir "..")
} else {
  $SourceRoot = Resolve-Path -LiteralPath $SourceRoot
}

if (-not $BackupRoot -or $BackupRoot.Trim().Length -eq 0) {
  $ProjectRoot = Split-Path -Parent $SourceRoot
  $BackupRoot = Join-Path $ProjectRoot "lockdown-backups"
}

$SourceRoot = [string]$SourceRoot
$BackupRoot = [string]$BackupRoot

if (-not (Test-Path -LiteralPath $SourceRoot)) {
  throw "Source root does not exist: $SourceRoot"
}

New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $BackupRoot "working_copy_lockdown_$timestamp"
$logPath = Join-Path $BackupRoot "working_copy_lockdown_$timestamp.robocopy.log"

if (Test-Path -LiteralPath $target) {
  throw "Backup target already exists: $target"
}

New-Item -ItemType Directory -Path $target -Force | Out-Null

$robocopyArgs = @(
  $SourceRoot,
  $target,
  "/E",
  "/COPY:DAT",
  "/DCOPY:DAT",
  "/R:2",
  "/W:2",
  "/MT:16",
  "/XJ",
  "/NP",
  "/LOG:$logPath"
)

if (-not $IncludeNodeModules) {
  $robocopyArgs += @("/XD", "node_modules")
}

Write-Host "[lockdown] Copying $SourceRoot"
Write-Host "[lockdown] Target  $target"

& robocopy @robocopyArgs
$code = $LASTEXITCODE
if ($code -ge 8) {
  throw "Robocopy failed with exit code $code. See $logPath"
}

function Get-TreeSummary([string]$Path) {
  $files = Get-ChildItem -LiteralPath $Path -Recurse -Force -File -ErrorAction SilentlyContinue
  $size = ($files | Measure-Object -Property Length -Sum).Sum
  [pscustomobject]@{
    path = $Path
    fileCount = $files.Count
    sizeBytes = [int64]$size
    sizeGb = [math]::Round($size / 1GB, 3)
  }
}

$gitHead = $null
$gitStatusCount = $null
$gitStatusPath = Join-Path $BackupRoot "working_copy_lockdown_$timestamp.git-status.txt"
$gitHeadPath = Join-Path $BackupRoot "working_copy_lockdown_$timestamp.git-head.txt"

if (Test-Path -LiteralPath (Join-Path $SourceRoot ".git")) {
  Push-Location $SourceRoot
  try {
    $gitHead = (git rev-parse HEAD).Trim()
    $gitStatus = git status --short
    $gitStatusCount = ($gitStatus | Measure-Object).Count
    $gitStatus | Out-File -LiteralPath $gitStatusPath -Encoding utf8
    $gitHead | Out-File -LiteralPath $gitHeadPath -Encoding utf8
  } finally {
    Pop-Location
  }
}

$manifest = [pscustomobject]@{
  createdAt = (Get-Date).ToString("o")
  sourceRoot = $SourceRoot
  backupRoot = $BackupRoot
  target = $target
  robocopyLog = $logPath
  robocopyExitCode = $code
  includedNodeModules = [bool]$IncludeNodeModules
  source = Get-TreeSummary $SourceRoot
  backup = Get-TreeSummary $target
  gitHead = $gitHead
  gitStatusCount = $gitStatusCount
  gitStatusPath = $gitStatusPath
  gitHeadPath = $gitHeadPath
}

$manifestPath = Join-Path $BackupRoot "working_copy_lockdown_$timestamp.manifest.json"
$manifest | ConvertTo-Json -Depth 8 | Out-File -LiteralPath $manifestPath -Encoding utf8

Write-Host "[lockdown] Backup complete."
Write-Host "[lockdown] Target: $target"
Write-Host "[lockdown] Manifest: $manifestPath"
Write-Host "[lockdown] Robocopy exit code: $code"

