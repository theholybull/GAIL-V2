param(
  [switch]$Execute,
  [switch]$IncludeLiveMirror
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$roots = @($repoRoot)

if ($IncludeLiveMirror) {
  $liveMirror = "C:\Users\bate_\OneDrive\Desktop\Gail 2.1\working_copy"
  if (Test-Path -LiteralPath $liveMirror) {
    $roots += (Resolve-Path -LiteralPath $liveMirror).Path
  }
}

function Assert-UnderRoot {
  param([string]$Target, [string]$Root)

  $rootResolved = (Resolve-Path -LiteralPath $Root).Path.TrimEnd("\")
  $targetResolved = (Resolve-Path -LiteralPath $Target).Path

  if (-not (
      $targetResolved.Equals($rootResolved, [System.StringComparison]::OrdinalIgnoreCase) -or
      $targetResolved.StartsWith($rootResolved + "\", [System.StringComparison]::OrdinalIgnoreCase)
    )) {
    throw "Refusing to remove outside root. Target=$targetResolved Root=$rootResolved"
  }

  return $targetResolved
}

function Get-PathBytes {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) { return 0 }
  $item = Get-Item -LiteralPath $Path -Force

  if ($item.PSIsContainer) {
    $files = Get-ChildItem -LiteralPath $Path -Recurse -File -Force -ErrorAction SilentlyContinue
    return (($files | Measure-Object Length -Sum).Sum + 0)
  }

  return ($item.Length + 0)
}

function Add-Candidate {
  param(
    [System.Collections.Generic.List[object]]$Candidates,
    [string]$Root,
    [string]$Path,
    [string]$Reason
  )

  if (-not (Test-Path -LiteralPath $Path)) { return }
  $resolved = Assert-UnderRoot -Target $Path -Root $Root
  $rootResolved = (Resolve-Path -LiteralPath $Root).Path.TrimEnd("\")
  $relative = $resolved.Substring($rootResolved.Length + 1)
  $bytes = Get-PathBytes -Path $resolved

  $Candidates.Add([pscustomobject]@{
    Root = $rootResolved
    Path = $resolved
    RelativePath = $relative
    Reason = $Reason
    Bytes = $bytes
  }) | Out-Null
}

$cleanupHubPatterns = @(
  "gail-package-refresh-*",
  "persona-ingest-*",
  "gail-runtime-refresh-*",
  "gail-lite-runtime-refresh-*",
  "vera-runtime-refresh-*",
  "cherry-runtime-refresh-*",
  "gail-inspect-*",
  "gail-lite-test-*",
  "runtime-audit-*",
  "gail-accessory-asset-isolation-*",
  "gail-pants-asset-isolation-*",
  "gail-top-asset-isolation-*",
  "gail-hair-image-dump-*",
  "gail-hair-backup-*",
  "gail-lite-hair-backup-*"
)

$rootTempFiles = @(
  "4db8c2d_file.ts",
  "downloaded.js",
  "head_file.ts",
  "old_file.ts",
  "manifest_full.json",
  "analyze_glbs.js",
  "compare_skeletons.js",
  "cherry_export_report.json",
  "playcanvas-app\diff_output.txt",
  "playcanvas-app\filtered_diff.txt",
  "playcanvas-app\work-lite-rebuild.js"
)

$runtimeTempFiles = @(
  "data\runtime\lucy_rig_setup.blend",
  "data\runtime\gail_fix_test.glb",
  "data\runtime\gail_rig.generated.blend",
  "data\runtime\gail_rig.generated.blend1",
  "data\runtime\blender_test.log",
  "data\runtime\blender_err.log",
  "data\runtime\cherry_batch_report.json",
  "data\runtime\cherry_test_report.json",
  "data\runtime\test_export_gail_fix.py",
  "data\runtime\inspect_gail_armature.py",
  "data\runtime\stack.status.json"
)

$candidates = New-Object System.Collections.Generic.List[object]

foreach ($root in $roots) {
  $hub = Join-Path $root "cleanup-hub"
  if (Test-Path -LiteralPath $hub) {
    foreach ($pattern in $cleanupHubPatterns) {
      Get-ChildItem -LiteralPath $hub -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like $pattern } |
        ForEach-Object { Add-Candidate -Candidates $candidates -Root $root -Path $_.FullName -Reason "generated cleanup/import artifact" }
    }
    Add-Candidate -Candidates $candidates -Root $root -Path (Join-Path $hub "gail-hair-pre-offset-20260422.glb") -Reason "temporary hair debug GLB"
  }

  foreach ($relative in $rootTempFiles) {
    Add-Candidate -Candidates $candidates -Root $root -Path (Join-Path $root $relative) -Reason "temporary probe/diff file"
  }

  $reports = Join-Path $root "docs\reports"
  if (Test-Path -LiteralPath $reports) {
    Get-ChildItem -LiteralPath $reports -Force -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -Skip 4 |
      ForEach-Object { Add-Candidate -Candidates $candidates -Root $root -Path $_.FullName -Reason "old generated report beyond latest four files" }
  }

  Add-Candidate -Candidates $candidates -Root $root -Path (Join-Path $root "data\reports") -Reason "generated UI/test reports"
  Add-Candidate -Candidates $candidates -Root $root -Path (Join-Path $root "data\audit\snapshots") -Reason "generated audit snapshots"

  Get-ChildItem -LiteralPath $root -Recurse -Directory -Force -ErrorAction SilentlyContinue -Filter "__pycache__" |
    ForEach-Object { Add-Candidate -Candidates $candidates -Root $root -Path $_.FullName -Reason "Python bytecode cache" }

  Get-ChildItem -LiteralPath $root -Recurse -File -Force -ErrorAction SilentlyContinue -Filter "*.pyc" |
    ForEach-Object { Add-Candidate -Candidates $candidates -Root $root -Path $_.FullName -Reason "Python bytecode cache file" }
}

# Runtime scratch cleanup is D-repo only. Do not touch C live backend runtime files.
foreach ($relative in $runtimeTempFiles) {
  Add-Candidate -Candidates $candidates -Root $repoRoot -Path (Join-Path $repoRoot $relative) -Reason "old Blender/runtime scratch artifact"
}

$unique = $candidates |
  Group-Object Path |
  ForEach-Object { $_.Group | Select-Object -First 1 }

$totalBytes = (($unique | Measure-Object Bytes -Sum).Sum + 0)

if ($Execute) {
  foreach ($item in $unique) {
    Remove-Item -LiteralPath $item.Path -Recurse -Force
  }
}

[pscustomobject]@{
  Mode = if ($Execute) { "execute" } else { "dry-run" }
  IncludeLiveMirror = [bool]$IncludeLiveMirror
  CandidateCount = $unique.Count
  CandidateGB = [math]::Round($totalBytes / 1GB, 3)
  Candidates = $unique | Select-Object Root, RelativePath, Reason, Bytes
} | ConvertTo-Json -Depth 6
