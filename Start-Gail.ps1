# Start-Gail.ps1
# Starts the Gail backend server and the named Cloudflare tunnel (gail.guysinthegarage.com).
# Run from any PowerShell window — no admin required.
# To stop everything, press Ctrl+C or close this window.

$ErrorActionPreference = "Stop"
$WorkingCopy = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $WorkingCopy "backend"
$CloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$TunnelConfig  = "C:\Users\bate_\.cloudflared\config.yml"
$TunnelLog     = "$env:TEMP\gail-tunnel.log"
$BackendPort = 4180

# ── 1. Kill any stale Gail server or tunnel ────────────────────────────────
Write-Host "`n[Gail] Checking for stale processes..." -ForegroundColor Cyan
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# ── 2. Start backend ───────────────────────────────────────────────────────
$NodeExe = (Get-Command node -ErrorAction SilentlyContinue)?.Source ?? "C:\Program Files\nodejs\node.exe"
Write-Host "[Gail] Starting backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process -FilePath $NodeExe `
    -ArgumentList "dist/backend/server.js" `
    -WorkingDirectory $BackendDir `
    -PassThru -WindowStyle Hidden
Write-Host "[Gail] Backend PID: $($backend.Id)" -ForegroundColor Green

# Give node a moment to bind the port
Start-Sleep -Seconds 2
if (-not (Get-Process -Id $backend.Id -ErrorAction SilentlyContinue)) {
    Write-Host "[Gail] Backend failed to start. Check dist/backend/server.js exists." -ForegroundColor Red
    exit 1
}

# ── 3. Start Cloudflare tunnel ─────────────────────────────────────────────
if (-not (Test-Path $CloudflaredExe)) {
    Write-Host "[Gail] cloudflared not found at $CloudflaredExe" -ForegroundColor Yellow
    Write-Host "[Gail] LAN access only: http://10.10.10.39:$BackendPort" -ForegroundColor Yellow
} else {
    Remove-Item $TunnelLog -ErrorAction SilentlyContinue
    Write-Host "[Gail] Starting named Cloudflare tunnel (gail.guysinthegarage.com)..." -ForegroundColor Cyan
    $tunnel = Start-Process -FilePath $CloudflaredExe `
        -ArgumentList "tunnel --config `"$TunnelConfig`" run gail" `
        -PassThru -WindowStyle Hidden
    Write-Host "[Gail] Tunnel PID: $($tunnel.Id)" -ForegroundColor Green

    # Give tunnel a moment to connect
    Start-Sleep -Seconds 5

    $PublicUrl = "https://gail.guysinthegarage.com"
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────────────┐" -ForegroundColor Green
    Write-Host "  │  PUBLIC  : $PublicUrl/gail/" -ForegroundColor Green
    Write-Host "  │  LAN     : http://10.10.10.39:$BackendPort/gail/" -ForegroundColor Green
    Write-Host "  │  LOCAL   : http://localhost:$BackendPort/gail/" -ForegroundColor Green
    Write-Host "  └─────────────────────────────────────────────────────────┘" -ForegroundColor Green
    Write-Host ""
}

# ── 4. Keep script alive — exit kills both child processes ─────────────────
Write-Host "[Gail] Running. Close this window or press Ctrl+C to stop all services.`n" -ForegroundColor Cyan
try {
    while ($true) { Start-Sleep -Seconds 30 }
} finally {
    Write-Host "`n[Gail] Shutting down..." -ForegroundColor Cyan
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    if ($tunnel) { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "[Gail] Done." -ForegroundColor Green
}
