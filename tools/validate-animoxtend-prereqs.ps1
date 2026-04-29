param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$RigSetupBlendSource = "",
    [string]$LocalPipelineBlendSource = "",
    [ValidateSet("All", "RigSetup", "LocalPipeline")]
    [string]$Mode = "All"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$issues = New-Object System.Collections.Generic.List[object]

function Add-Issue {
    param(
        [string]$Area,
        [string]$Path,
        [string]$Expectation,
        [string]$Fix
    )

    $script:issues.Add([pscustomobject]@{
        area = $Area
        path = $Path
        expectation = $Expectation
        fix = $Fix
    }) | Out-Null
}

function Test-RequiredLeaf {
    param(
        [string]$Area,
        [string]$Path,
        [string]$Expectation,
        [string]$Fix
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Add-Issue -Area $Area -Path $Path -Expectation $Expectation -Fix $Fix
        return $false
    }

    return $true
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ==="
}

function Write-Check {
    param([string]$Title)
    Write-Host ("CHECK {0}" -f $Title)
}

if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "Repo root not found: $RepoRoot"
}

$expectedAnimoxtendZip = Join-Path $RepoRoot "runtime\blender\animoxtend-1.2.2.zip"
$defaultRigSetupBlend = Join-Path $RepoRoot "gail_rig_master.blend"
$defaultLocalPipelineBlend = Join-Path $RepoRoot "gail_rig.blend"

$rigSetupBlend = if ($RigSetupBlendSource) { $RigSetupBlendSource } else { $defaultRigSetupBlend }
$localPipelineBlend = if ($LocalPipelineBlendSource) { $LocalPipelineBlendSource } else { $defaultLocalPipelineBlend }
$checkRigSetup = $Mode -in @("All", "RigSetup")
$checkLocalPipeline = $Mode -in @("All", "LocalPipeline")

Write-Section "AnimoXTend Preflight"
Write-Host "Repo root: $RepoRoot"
Write-Host "Mode: $Mode"
Write-Host "Expected rig setup source blend: $rigSetupBlend"
Write-Host "Expected local pipeline blend: $localPipelineBlend"
Write-Host "Expected AnimoXTend archive: $expectedAnimoxtendZip"

Write-Section "Required Files"
    Write-Check "AnimoXTend archive"
    $zipOk = Test-RequiredLeaf `
        -Area "AnimoXTend archive" `
        -Path $expectedAnimoxtendZip `
        -Expectation "The AnimoXTend wrappers expect runtime\\blender\\animoxtend-1.2.2.zip to exist before Blender starts." `
        -Fix "Place the archive at the exact path above before running either wrapper."

if ($checkRigSetup) {
    Write-Check "Rig setup blend source"
    $rigBlendOk = Test-RequiredLeaf `
        -Area "Rig setup blend source" `
        -Path $rigSetupBlend `
        -Expectation "run-animoxtend-rig-setup.ps1 expects a valid .blend source file for rig authoring." `
        -Fix "Restore or point the rig setup wrapper at the correct .blend source file. The canonical default is gail_rig_master.blend."
}

if ($checkLocalPipeline) {
    Write-Check "Local pipeline blend source"
    $localBlendOk = Test-RequiredLeaf `
        -Area "Local pipeline blend source" `
        -Path $localPipelineBlend `
        -Expectation "run-animoxtend-local-pipeline.ps1 expects a valid .blend source file for the local runtime/pipeline pass." `
        -Fix "Restore or point the local pipeline wrapper at the correct .blend source file. The canonical default is gail_rig.blend."
}

Write-Section "Result"
if ($issues.Count -gt 0) {
    foreach ($issue in $issues) {
        Write-Host ("ERROR: {0}" -f $issue.area) -ForegroundColor Red
        Write-Host ("  Path: {0}" -f $issue.path)
        Write-Host ("  Expectation: {0}" -f $issue.expectation)
        Write-Host ("  Fix: {0}" -f $issue.fix)
        Write-Host ""
    }

    Write-Error ("AnimoXTend preflight failed with {0} missing prerequisite(s)." -f $issues.Count)
    exit 2
}

Write-Host "All AnimoXTend prerequisites are present."
exit 0
