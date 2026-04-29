param(
  [string]$SourceRoot = "G:\converted_animations_20260401",
  [string]$OutputRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")
$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $repoRoot "data\animation_viewer"
}

if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
  throw "Missing source root: $SourceRoot"
}

$animationsRoot = Join-Path $OutputRoot "animations"
$metadataRoot = Join-Path $OutputRoot "metadata"
New-Item -ItemType Directory -Force -Path $animationsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $metadataRoot | Out-Null

$categories = @(
  "idle",
  "locomotion",
  "combat",
  "gesture",
  "emote",
  "interaction",
  "traversal",
  "horror",
  "other"
)

foreach ($category in $categories) {
  $sourceCategory = Join-Path $SourceRoot $category
  if (-not (Test-Path -LiteralPath $sourceCategory -PathType Container)) {
    continue
  }

  $targetCategory = Join-Path $animationsRoot $category
  New-Item -ItemType Directory -Force -Path $targetCategory | Out-Null

  $null = robocopy $sourceCategory $targetCategory *.glb /E /R:2 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP
  $exitCode = $LASTEXITCODE
  if ($exitCode -ge 8) {
    throw "robocopy failed for category '$category' with exit code $exitCode"
  }
}

$items = New-Object System.Collections.Generic.List[object]

Get-ChildItem -LiteralPath $animationsRoot -Directory | Sort-Object Name | ForEach-Object {
  $category = $_.Name
  Get-ChildItem -LiteralPath $_.FullName -Filter *.glb -File | Sort-Object Name | ForEach-Object {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $id = $baseName
    $annotation = $baseName

    if ($baseName -match '^(\d+)[_\-\s]+(.+)$') {
      $id = $matches[1]
      $annotation = $matches[2]
    }

    $annotation = ($annotation -replace '[_\-]+', ' ').Trim()
    $relativeGlb = "/" + ($_.FullName.Substring($OutputRoot.Length).TrimStart('\','/').Replace('\','/'))

    $items.Add([pscustomobject]@{
      id = $id
      annotation = $annotation
      category = $category
      status = "active"
      files = [pscustomobject]@{
        glb = $relativeGlb
      }
    })
  }
}

$indexPath = Join-Path $metadataRoot "library_index.json"
$progressPath = Join-Path $metadataRoot "local_pipeline_progress.json"

$items | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $indexPath -Encoding UTF8

$progress = [pscustomobject]@{
  state = "completed"
  total = $items.Count
  completed = $items.Count
  failed = 0
  source_root = $SourceRoot
  imported_at = (Get-Date).ToString("s")
}

$progress | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $progressPath -Encoding UTF8

Write-Host "Imported $($items.Count) animations into $animationsRoot"
Write-Host "Index: $indexPath"
Write-Host "Progress: $progressPath"
