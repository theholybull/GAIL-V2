param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$BlenderExe = "",
    [string]$LocalPipelineBlendSource = "",
    [switch]$IncludeReview,
    [switch]$StrictValidation,
    [bool]$CopyApprovedClipsToClientAssets = $true,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ValidateScript = Join-Path $PSScriptRoot "validate-animoxtend-prereqs.ps1"
$RunnerScript = Join-Path $PSScriptRoot "export-playcanvas-pipeline.ps1"

Write-Host "CHECK AnimoXTend local pipeline prerequisites"
& $ValidateScript -RepoRoot $RepoRoot -Mode LocalPipeline -LocalPipelineBlendSource $LocalPipelineBlendSource
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "RUN AnimoXTend local pipeline"
Write-Host "  Stage: validate and export clips from the regular blend"

$runnerParams = @{
    SkipRegularRefresh = $true
    SkipModuleExport = $true
    CopyApprovedClipsToClientAssets = $CopyApprovedClipsToClientAssets
}

if ($BlenderExe) {
    $runnerParams.BlenderExe = $BlenderExe
}

if ($LocalPipelineBlendSource) {
    $runnerParams.RegularBlendSource = $LocalPipelineBlendSource
}

if ($IncludeReview) {
    $runnerParams.IncludeReview = $true
}

if ($StrictValidation) {
    $runnerParams.StrictValidation = $true
}

if ($DryRun) {
    $runnerParams.DryRun = $true
}

& $RunnerScript @runnerParams
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

exit 0
