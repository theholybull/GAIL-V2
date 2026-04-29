param(
    [string]$BlenderExe = 'C:\Users\guysi\Desktop\blender-4.1.1-windows-x64\blender.exe',
    [string]$BlendPath = 'D:\animation_builder_test\test_avatar.blend',
    [string]$OutputRoot = 'D:\animation_builder_test',
    [string]$AddonDir = 'D:\blender\animation_master\addons\gail_production_workbench',
    [string]$Armature = 'Rosa Maria 8.1'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $BlenderExe)) { throw "Missing Blender executable: $BlenderExe" }
if (-not (Test-Path $BlendPath)) { throw "Missing blend file: $BlendPath" }
if (-not (Test-Path $AddonDir)) { throw "Missing addon dir: $AddonDir" }

$reportPath = Join-Path $OutputRoot 'workbench_test_report.json'
$scriptPath = 'D:\tools\test_gail_production_workbench.py'
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
$stdoutPath = Join-Path $OutputRoot 'workbench_test_stdout.log'
$stderrPath = Join-Path $OutputRoot 'workbench_test_stderr.log'

$args = @(
  '--factory-startup',
  '-b',
  '--python', $scriptPath,
  '--',
  '--blend', $BlendPath,
  '--output-root', $OutputRoot,
  '--report', $reportPath,
  '--addon-dir', $AddonDir,
  '--armature', $Armature
)

$proc = Start-Process -FilePath $BlenderExe -ArgumentList $args -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

$timeoutAt = (Get-Date).AddMinutes(15)
while (-not $proc.HasExited -and (Get-Date) -lt $timeoutAt) {
    if (Test-Path $reportPath) {
        try {
            $payload = Get-Content -Raw $reportPath | ConvertFrom-Json
            if (($payload.errors | Measure-Object).Count -eq 0 -and $payload.output_blend) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                break
            }
        } catch {
        }
    }
    Start-Sleep -Seconds 5
    $proc.Refresh()
}

if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path $reportPath)) {
    throw "Workbench test did not produce a report. See $stdoutPath and $stderrPath"
}

$final = Get-Content -Raw $reportPath | ConvertFrom-Json
if (($final.errors | Measure-Object).Count -gt 0) {
    throw "Workbench test reported errors. See $reportPath"
}

Write-Host "Workbench test report: $reportPath"
