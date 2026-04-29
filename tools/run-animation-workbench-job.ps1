param(
    [Parameter(Mandatory = $true)]
    [string]$ManifestPath,
    [string]$BlenderExe = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-BlenderExecutable {
    param([string]$PreferredPath)

    $candidates = @()
    if ($PreferredPath) { $candidates += $PreferredPath }
    if ($env:BLENDER_EXE) { $candidates += $env:BLENDER_EXE }

    try {
        $command = Get-Command blender -ErrorAction Stop
        if ($command.Source) {
            $candidates += $command.Source
        }
    } catch {
    }

    $candidates += @(
        "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 5.0\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
        "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"
    )

    foreach ($candidate in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "Unable to resolve Blender executable. Pass -BlenderExe or set BLENDER_EXE."
}

if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) {
    throw "Missing manifest path: $ManifestPath"
}

$resolvedManifestPath = (Resolve-Path -LiteralPath $ManifestPath).Path
$manifest = Get-Content -LiteralPath $resolvedManifestPath -Raw | ConvertFrom-Json
if (-not $manifest.blend_path) {
    throw "Manifest is missing blend_path"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pythonScript = Join-Path $PSScriptRoot "animoxtend_compose_actions.py"
if (-not (Test-Path -LiteralPath $pythonScript -PathType Leaf)) {
    throw "Missing compose script: $pythonScript"
}

$resolvedBlenderExe = Resolve-BlenderExecutable -PreferredPath $BlenderExe
& $resolvedBlenderExe --factory-startup -b $manifest.blend_path --python $pythonScript -- --manifest $resolvedManifestPath
exit $LASTEXITCODE