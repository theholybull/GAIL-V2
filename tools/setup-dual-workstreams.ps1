param(
  [string]$RepoRoot = "",
  [string]$StreamsRoot = "D:\Gail_workstreams",
  [string]$OpsBranch = "stream/ops-control",
  [string]$PlaycanvasBranch = "stream/playcanvas-base",
  [switch]$CreateBranchesFromHead
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = Split-Path -Parent $PSScriptRoot
}

if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
  throw "Repo root does not look like a git repository: $RepoRoot"
}

New-Item -ItemType Directory -Force -Path $StreamsRoot | Out-Null

function Test-GitBranchExists {
  param([string]$Name)
  $output = git -C $RepoRoot branch --list $Name
  return -not [string]::IsNullOrWhiteSpace(($output -join "").Trim())
}

function Ensure-Branch {
  param([string]$Name)
  if (Test-GitBranchExists -Name $Name) {
    Write-Host "Branch exists: $Name"
    return
  }
  if (-not $CreateBranchesFromHead) {
    throw "Branch '$Name' does not exist. Re-run with -CreateBranchesFromHead to create it from current HEAD."
  }
  git -C $RepoRoot branch $Name | Out-Null
  Write-Host "Created branch from HEAD: $Name"
}

function Ensure-Worktree {
  param(
    [string]$Path,
    [string]$Branch
  )

  if (Test-Path -LiteralPath (Join-Path $Path ".git")) {
    Write-Host "Worktree exists: $Path ($Branch)"
    return
  }

  if (Test-Path -LiteralPath $Path) {
    $children = Get-ChildItem -Force -LiteralPath $Path -ErrorAction SilentlyContinue
    if ($children.Count -gt 0) {
      throw "Target worktree path already exists and is not empty: $Path"
    }
  } else {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }

  git -C $RepoRoot worktree add $Path $Branch | Out-Null
  Write-Host "Created worktree: $Path -> $Branch"
}

$opsPath = Join-Path $StreamsRoot "ops-control"
$playcanvasPath = Join-Path $StreamsRoot "playcanvas-base"

Ensure-Branch -Name $OpsBranch
Ensure-Branch -Name $PlaycanvasBranch
Ensure-Worktree -Path $opsPath -Branch $OpsBranch
Ensure-Worktree -Path $playcanvasPath -Branch $PlaycanvasBranch

Write-Host ""
Write-Host "Dual workstreams are ready."
Write-Host "Ops stream:        $opsPath"
Write-Host "PlayCanvas stream: $playcanvasPath"
Write-Host ""
Write-Host "Recommended file ownership:"
Write-Host "- ops-control: backend/, shared/, tools/, docs/"
Write-Host "- playcanvas-base: playcanvas-app/, web-control-panel/"
