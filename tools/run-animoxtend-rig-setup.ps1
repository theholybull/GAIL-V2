param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$BlenderExe = "",
    [string]$RigSetupBlendSource = "",
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ValidateScript = Join-Path $PSScriptRoot "validate-animoxtend-prereqs.ps1"
$RunnerScript = Join-Path $PSScriptRoot "export-playcanvas-pipeline.ps1"

Write-Host "CHECK AnimoXTend rig setup prerequisites"
& $ValidateScript -RepoRoot $RepoRoot -Mode RigSetup -RigSetupBlendSource $RigSetupBlendSource
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "RUN AnimoXTend rig setup"
Write-Host "  Stage: refresh regular blend from master"

$runnerParams = @{
    SkipModuleExport = $true
    SkipClipExport = $true
}

if ($BlenderExe) {
    $runnerParams.BlenderExe = $BlenderExe
}

if ($RigSetupBlendSource) {
    $runnerParams.MasterBlendSource = $RigSetupBlendSource
}

if ($DryRun) {
    $runnerParams.DryRun = $true
}

& $RunnerScript @runnerParams
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

exit 0
