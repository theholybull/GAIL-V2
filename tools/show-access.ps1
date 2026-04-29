param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [string]$AuthMode = "",
  [switch]$EnsureBackend
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($EnsureBackend) {
  & (Join-Path $PSScriptRoot "start-backend-background.ps1") -BaseUrl $BaseUrl -AuthMode $AuthMode | Out-Null
}

$status = Invoke-RestMethod -Method Get -Uri "$BaseUrl/access/status" -UseBasicParsing

Write-Host ""
Write-Host "Gail Access Status"
Write-Host "------------------"
Write-Host "Auth Mode: $($status.authMode)"
Write-Host "Bind Host: $($status.host)"
Write-Host "Port: $($status.port)"

Write-Host ""
Write-Host "Local Surfaces"
foreach ($surface in @($status.localSurfaces)) {
  Write-Host ("- {0}: {1}" -f $surface.label, $surface.url)
}

Write-Host ""
Write-Host "LAN Surfaces"
if (@($status.lanAddresses).Count -eq 0) {
  Write-Host "- No private IPv4 LAN addresses were detected."
} else {
  foreach ($lan in @($status.lanAddresses)) {
    Write-Host ("- Host IP: {0}" -f $lan.address)
    foreach ($surface in @($lan.surfaces)) {
      Write-Host ("  {0}: {1}" -f $surface.label, $surface.url)
    }
  }
}

if (@($status.warnings).Count -gt 0) {
  Write-Host ""
  Write-Host "Warnings"
  foreach ($warning in @($status.warnings)) {
    Write-Host ("- {0}" -f $warning)
  }
}

Write-Host ""
Write-Host "Recommended next check:"
Write-Host "- Open Operator Studio Shell: $BaseUrl/panel/operator-studio-shell.html"
Write-Host "- Open primary display client: $BaseUrl/display/"
