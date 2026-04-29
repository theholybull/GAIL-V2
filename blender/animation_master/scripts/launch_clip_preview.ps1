param(
    [Parameter(Mandatory = $true)]
    [string]$Action,

    [string]$BlendFile = "C:\Users\jbates\Desktop\gail_rig.blend",
    [string]$Armature = "VAMP Laurina for G8 Female",
    [string]$BlenderExe = "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe"
)

$scriptPath = "F:\Gail\blender\animation_master\scripts\assign_clip_to_armature.py"

$frameStart = 1
$frameEnd = 96

switch ($Action) {
    "nod_small_v1" {
        $frameStart = 1
        $frameEnd = 24
    }
    "idle_base_v1" {
        $frameStart = 1
        $frameEnd = 96
    }
}

if (-not (Test-Path $BlenderExe)) {
    throw "Blender executable not found: $BlenderExe"
}

if (-not (Test-Path $BlendFile)) {
    throw "Blend file not found: $BlendFile"
}

& $BlenderExe $BlendFile --python $scriptPath -- --armature $Armature --action $Action --frame-start $frameStart --frame-end $frameEnd
