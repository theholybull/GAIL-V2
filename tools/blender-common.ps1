Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-GailBlenderExe {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot
  )

  $candidates = @()

  if ($env:GAIL_BLENDER_EXE) {
    $candidates += $env:GAIL_BLENDER_EXE
  }

  $candidates += @(
    "C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
    "C:\Users\jbates\Desktop\blender-4.1.0-windows-x64\blender-4.1.0-windows-x64\blender.exe",
    "C:\Users\jbates\Desktop\blender-4.1.1-windows-x64\blender.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      return $candidate
    }
  }

  throw "Blender executable was not found. Set GAIL_BLENDER_EXE or install Blender in a standard location."
}
