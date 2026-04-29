param(
  [string]$BlendFile = "",
  [string]$Manifest = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "blender-common.ps1")

$repoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
$blenderExe = Resolve-GailBlenderExe -RepoRoot $repoRoot
$targetBlend = if ($BlendFile) { $BlendFile } else { Join-Path $repoRoot "gail_rig.blend" }
$targetManifest = if ($Manifest) { $Manifest } else { Join-Path $repoRoot "blender\animation_master\manifests\clip_registry.gail.example.json" }
$scriptPath = Join-Path $repoRoot "blender\animation_master\scripts\validate_animation_master.py"

& $blenderExe $targetBlend -b --python $scriptPath -- --manifest $targetManifest
