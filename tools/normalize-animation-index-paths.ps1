param(
  [string]$IndexPath = "",
  [string]$OutputRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")
$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $repoRoot "data\animation_viewer"
}
if ([string]::IsNullOrWhiteSpace($IndexPath)) {
  $IndexPath = Join-Path $OutputRoot "metadata\library_index.json"
}
if (-not (Test-Path -LiteralPath $IndexPath -PathType Leaf)) {
  throw "Index file not found: $IndexPath"
}

function Get-RelAssetPath([string]$pathValue) {
  if ([string]::IsNullOrWhiteSpace($pathValue)) { return $null }
  $normalized = $pathValue.Replace("\", "/")
  if ($normalized.StartsWith("/")) { return $normalized }

  $anchors = @("/animations/", "/converted/", "/metadata/")
  foreach ($anchor in $anchors) {
    $idx = $normalized.ToLower().IndexOf($anchor)
    if ($idx -ge 0) {
      return $normalized.Substring($idx)
    }
  }

  $leaf = [System.IO.Path]::GetFileName($pathValue)
  if ([string]::IsNullOrWhiteSpace($leaf)) { return $null }
  return "/animations/$leaf"
}

$items = Get-Content -Raw -LiteralPath $IndexPath | ConvertFrom-Json
$updated = 0

foreach ($item in $items) {
  if ($item.files -eq $null) { continue }
  foreach ($key in @("glb", "fbx", "npz")) {
    if ($item.files.PSObject.Properties.Name -contains $key) {
      $old = [string]$item.files.$key
      $new = Get-RelAssetPath $old
      if ($new -ne $old) {
        $item.files.$key = $new
        $updated++
      }
    }
  }
}

$items | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $IndexPath -Encoding UTF8

Write-Host "Normalized file paths in: $IndexPath"
Write-Host "Updated entries: $updated"
