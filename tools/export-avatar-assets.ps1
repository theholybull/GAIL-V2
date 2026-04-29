[CmdletBinding()]
param(
    [string]$BlenderExe = "",
    [switch]$SkipRegularRefresh,
    [switch]$SkipModuleExport,
    [switch]$SkipClipExport,
    [switch]$IncludeReview,
    [switch]$StrictValidation,
    [ValidateSet("high", "medium", "low")]
    [string]$RuntimeProfile = "high",
    [bool]$CopyApprovedClipsToClientAssets = $true,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$pipelineScript = Join-Path $PSScriptRoot "export-playcanvas-pipeline.ps1"
if (-not (Test-Path -LiteralPath $pipelineScript)) {
    throw "Missing pipeline script: $pipelineScript"
}

$args = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $pipelineScript,
    "-RuntimeProfile", $RuntimeProfile
)

if ($BlenderExe) { $args += @("-BlenderExe", $BlenderExe) }
if ($SkipRegularRefresh) { $args += "-SkipRegularRefresh" }
if ($SkipModuleExport) { $args += "-SkipModuleExport" }
if ($SkipClipExport) { $args += "-SkipClipExport" }
if ($IncludeReview) { $args += "-IncludeReview" }
if ($StrictValidation) { $args += "-StrictValidation" }
if ($DryRun) { $args += "-DryRun" }
if (-not $CopyApprovedClipsToClientAssets) { $args += "-CopyApprovedClipsToClientAssets:`$false" }

& powershell.exe @args
exit $LASTEXITCODE
