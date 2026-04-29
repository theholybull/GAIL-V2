param(
  [int]$Pitch = 180,
  [int]$Yaw = 0,
  [int]$Roll = 90,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$manifestPath = Join-Path $repoRoot "playcanvas-app\assets\handoffs\playcanvas_handoff_20260330\manifests\integration_asset_manifest.json"
$backendDir = Join-Path $repoRoot "backend"
$playcanvasDir = Join-Path $repoRoot "playcanvas-app"
$viewerUrl = "http://127.0.0.1:4180/client/work-lite/?tweak_avatar=1"

if (-not (Test-Path $manifestPath)) {
  throw "Manifest not found: $manifestPath"
}

Write-Host "Updating manifest orientation to [$Pitch, $Yaw, $Roll]..."
$manifest = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json
if (-not $manifest.runtime_profile) {
  $manifest | Add-Member -NotePropertyName runtime_profile -NotePropertyValue (@{})
}
if (-not $manifest.runtime_profile.viewport_defaults) {
  $manifest.runtime_profile | Add-Member -NotePropertyName viewport_defaults -NotePropertyValue (@{})
}

$manifest.runtime_profile.orientation_angles = @($Pitch, $Yaw, $Roll)
$manifest.runtime_profile.viewport_defaults.modelX = 0
$manifest.runtime_profile.viewport_defaults.modelY = 0
$manifest.runtime_profile.viewport_defaults.modelZ = 0
$manifest.runtime_profile.viewport_defaults.modelYaw = 0
$manifest.runtime_profile.viewport_defaults.modelPitch = 0
$manifest.runtime_profile.viewport_defaults.modelRoll = 0

$manifestJson = $manifest | ConvertTo-Json -Depth 100
Set-Content -Path $manifestPath -Value $manifestJson -Encoding UTF8

if (-not $SkipBuild) {
  Write-Host "Building playcanvas-app..."
  Push-Location $playcanvasDir
  try {
    npm run build | Out-Host
  } finally {
    Pop-Location
  }

  Write-Host "Building backend..."
  Push-Location $backendDir
  try {
    npm run build | Out-Host
  } finally {
    Pop-Location
  }
}

Write-Host "Restarting backend..."
$listener = Get-NetTCPConnection -State Listen -LocalPort 4180 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Stop-Process -Id $listener.OwningProcess -Force
  Start-Sleep -Seconds 1
}

$backendProc = Start-Process -FilePath node -ArgumentList "dist/backend/server.js" -WorkingDirectory $backendDir -PassThru
Start-Sleep -Seconds 2

Write-Host "Checking viewer..."
$status = $null
for ($i = 0; $i -lt 20; $i++) {
  try {
    $status = (Invoke-WebRequest -Uri $viewerUrl -UseBasicParsing -TimeoutSec 10).StatusCode
    if ($status -eq 200) {
      break
    }
  } catch {
    Start-Sleep -Milliseconds 750
  }
}
if ($status -ne 200) {
  throw "Viewer did not become ready on $viewerUrl"
}
Write-Host "Viewer HTTP status: $status"
Write-Host "Backend PID: $($backendProc.Id)"
Write-Host "Opening viewer: $viewerUrl"
Start-Process $viewerUrl

Write-Host "Done."
