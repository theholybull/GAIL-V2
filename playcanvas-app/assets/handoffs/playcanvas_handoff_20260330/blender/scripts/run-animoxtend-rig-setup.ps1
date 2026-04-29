param(
    [string]$BlenderExe = 'C:\Users\guysi\Desktop\blender-4.1.1-windows-x64\blender.exe',
    [string]$BlendPath = 'D:\test_v3_mapped.blend',
    [string]$AddonZip = 'C:\Users\guysi\Desktop\blender-4.1.1-windows-x64\animoxtend-1.2.2.zip',
    [string]$TargetMap = 'D:\tools\mapping_profiles\animo_target_victoria8_test_v2.json',
    [string]$TargetArmature = 'Victoria 8',
    [string]$SourceArmature = 'BufferArmature',
    [string]$OutputBlend = 'D:\test_v3_mapped_rigsetup.blend'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $BlenderExe)) { throw "Missing Blender executable: $BlenderExe" }
if (-not (Test-Path $BlendPath)) { throw "Missing blend file: $BlendPath" }
if (-not (Test-Path $AddonZip)) { throw "Missing add-on zip: $AddonZip" }
if (-not (Test-Path $TargetMap)) { throw "Missing target map: $TargetMap" }

$reportPath = 'D:\tools\mapping_profiles\rig_setup_report.json'
$scriptPath = 'D:\tools\animoxtend_rig_setup.py'

& $BlenderExe --factory-startup -b --python $scriptPath -- `
  --blend $BlendPath `
  --addon-zip $AddonZip `
  --target-map $TargetMap `
  --target-armature $TargetArmature `
  --source-armature $SourceArmature `
  --output-blend $OutputBlend `
  --report $reportPath

if ($LASTEXITCODE -ne 0) {
    throw "Rig setup failed with exit code $LASTEXITCODE"
}

Write-Host "Rig setup report: $reportPath"
Write-Host "Output blend: $OutputBlend"
