function Get-GailRepoRoot {
  param(
    [Parameter(Mandatory = $true)][string]$ToolsRoot
  )

  return (Split-Path -Parent $ToolsRoot)
}

function Resolve-GailNodeDir {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot
  )

  $candidates = @()

  if ($env:GAIL_NODE_DIR) {
    $candidates += $env:GAIL_NODE_DIR
  }

  $candidates += (Join-Path $RepoRoot "runtime\nodejs")
  $candidates += "C:\Program Files\nodejs"

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }

    $npmCmd = Join-Path $candidate "npm.cmd"
    $nodeExe = Join-Path $candidate "node.exe"
    if ((Test-Path $npmCmd) -and (Test-Path $nodeExe)) {
      return $candidate
    }
  }

  throw "Node.js was not found. Expected either GAIL_NODE_DIR, '$RepoRoot\\runtime\\nodejs', or 'C:\\Program Files\\nodejs'."
}

function Set-GailNodePath {
  param(
    [Parameter(Mandatory = $true)][string]$NodeDir
  )

  if (-not ($env:Path -split ';' | Where-Object { $_ -eq $NodeDir })) {
    $env:Path = "$NodeDir;$env:Path"
  }
}

function Initialize-GailStorageEnv {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot
  )

  $dataDir = Join-Path $RepoRoot "data"
  $privateDataDir = Join-Path $dataDir "private"
  $runtimeDir = Join-Path $dataDir "runtime"

  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $privateDataDir | Out-Null
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

  $env:GAIL_SQLITE_PATH = Join-Path $dataDir "gail.sqlite"
  $env:GAIL_PRIVATE_SQLITE_PATH = Join-Path $privateDataDir "gail-private.sqlite"

  return [pscustomobject]@{
    dataDir = $dataDir
    privateDataDir = $privateDataDir
    runtimeDir = $runtimeDir
  }
}

function Get-GailStackManifest {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot
  )

  $manifestPath = Join-Path $RepoRoot "tools\gail-stack.json"
  if (-not (Test-Path $manifestPath)) {
    throw "Stack manifest not found at $manifestPath"
  }

  return Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
}
