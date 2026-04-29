[CmdletBinding()]
param(
    [string]$ToolsRoot = "",
    [string]$DocsRoot = "",
    [string]$RepoRoot = ""
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Get-GailRepoRoot -ToolsRoot $PSScriptRoot
}

if ([string]::IsNullOrWhiteSpace($ToolsRoot)) {
    $ToolsRoot = Join-Path $RepoRoot "tools"
}

if ([string]::IsNullOrWhiteSpace($DocsRoot)) {
    $DocsRoot = Join-Path $RepoRoot "docs"
}

function Test-Entry {
    param(
        [string]$Label,
        [string]$Path,
        [switch]$Directory
    )

    $exists = if ($Directory) { Test-Path -LiteralPath $Path -PathType Container } else { Test-Path -LiteralPath $Path -PathType Leaf }
    [pscustomobject]@{
        label = $Label
        path = $Path
        exists = $exists
        type = if ($Directory) { "directory" } else { "file" }
    }
}

$entries = @(
    (Test-Entry -Label "AnimoXTend API key" -Path (Join-Path $ToolsRoot "animoxtend_api_key.txt")),
    (Test-Entry -Label "AnimoXTend unpacked add-on" -Path (Join-Path $ToolsRoot "_animoxtend_1_2_2_unpack") -Directory),
    (Test-Entry -Label "Local pipeline wrapper" -Path (Join-Path $ToolsRoot "run-animoxtend-local-pipeline.ps1")),
    (Test-Entry -Label "Local retarget export script" -Path (Join-Path $ToolsRoot "animoxtend_local_retarget_export.py")),
    (Test-Entry -Label "Rig setup wrapper" -Path (Join-Path $ToolsRoot "run-animoxtend-rig-setup.ps1")),
    (Test-Entry -Label "Rig setup script" -Path (Join-Path $ToolsRoot "animoxtend_rig_setup.py")),
    (Test-Entry -Label "End-to-end system doc" -Path (Join-Path $DocsRoot "ANIMOXTEND_END_TO_END_SYSTEM.md")),
    (Test-Entry -Label "Gail export add-on" -Path (Join-Path $RepoRoot "tools\\blender-gail-export-addon") -Directory),
    (Test-Entry -Label "Avatar partition manifest" -Path (Join-Path $RepoRoot "blender\\animation_master\\manifests\\asset_partition.gail.json")),
    (Test-Entry -Label "PlayCanvas Gail base avatar root" -Path (Join-Path $RepoRoot "playcanvas-app\\assets\\gail\\avatar\\base_face") -Directory),
    (Test-Entry -Label "PlayCanvas handoff asset root" -Path (Join-Path $RepoRoot "playcanvas-app\\assets\\handoffs\\playcanvas_handoff_20260330") -Directory)
)

$apiKeyPath = Join-Path $ToolsRoot "animoxtend_api_key.txt"
$apiKeyState = if (Test-Path -LiteralPath $apiKeyPath -PathType Leaf) {
    $key = (Get-Content -LiteralPath $apiKeyPath -Raw).Trim()
    if ($key.Length -gt 0) {
        "present"
    } else {
        "empty"
    }
} else {
    "missing"
}

$summary = [pscustomobject]@{
    tools_root = $ToolsRoot
    docs_root = $DocsRoot
    repo_root = $RepoRoot
    api_key = $apiKeyState
    checks = $entries
    ready = ($apiKeyState -eq "present" -and (($entries | Where-Object { -not $_.exists }).Count -eq 0))
}

$summary | ConvertTo-Json -Depth 5

if (-not $summary.ready) {
    exit 1
}
