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

$access = Invoke-RestMethod -Method Get -Uri "$BaseUrl/access/status" -UseBasicParsing
$tailscaleCommand = Get-Command tailscale -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Gail Remote Access"
Write-Host "------------------"
Write-Host "Recommended model: local Gail host + private Tailscale network + existing web portal"
Write-Host ""
Write-Host "Local / LAN URLs"
foreach ($surface in @($access.localSurfaces)) {
  Write-Host ("- local {0}: {1}" -f $surface.label, $surface.url)
}
foreach ($lan in @($access.lanAddresses)) {
  foreach ($surface in @($lan.surfaces)) {
    if ($surface.label -eq "operator_panel" -or $surface.label -eq "work_lite_client") {
      Write-Host ("- lan {0} [{1}]: {2}" -f $surface.label, $lan.address, $surface.url)
    }
  }
}

Write-Host ""
if (-not $tailscaleCommand) {
  Write-Host "Tailscale"
  Write-Host "- not installed on this machine"
  Write-Host "- install Tailscale on the Gail host"
  Write-Host "- sign in the host to your tailnet"
  Write-Host "- install Tailscale on each remote device that should reach Gail"
  Write-Host "- then rerun this script to see detected tailnet addresses"
  Write-Host ""
  Write-Host "After Tailscale is up, remote devices should open Gail through the same web portal paths:"
  Write-Host "- /panel/"
  Write-Host "- /client/work-lite/"
  exit 0
}

try {
  $statusJson = & $tailscaleCommand.Source status --json | ConvertFrom-Json
} catch {
  Write-Host "Tailscale"
  Write-Host "- installed, but status could not be read"
  Write-Host "- confirm the Tailscale service is running and the host is signed in"
  exit 0
}

$tailnetIp = @($statusJson.TailscaleIPs | Where-Object { $_ }) | Select-Object -First 1
$dnsName = [string]$statusJson.Self.DNSName

Write-Host "Tailscale"
Write-Host ("- backend state: {0}" -f $statusJson.BackendState)
if ($tailnetIp) {
  Write-Host ("- tailnet ip: {0}" -f $tailnetIp)
  Write-Host ("- remote operator panel: http://{0}:4180/panel/" -f $tailnetIp)
  Write-Host ("- remote work-lite client: http://{0}:4180/client/work-lite/" -f $tailnetIp)
}
if ($dnsName) {
  $trimmedDns = $dnsName.TrimEnd(".")
  Write-Host ("- tailnet dns: {0}" -f $trimmedDns)
  Write-Host ("- dns operator panel: http://{0}:4180/panel/" -f $trimmedDns)
  Write-Host ("- dns work-lite client: http://{0}:4180/client/work-lite/" -f $trimmedDns)
}

Write-Host ""
Write-Host "Recommended remote use"
Write-Host "- keep Gail on the local host"
Write-Host "- use Tailscale on phones, tablets, laptops, and other clients"
Write-Host "- reach Gail through the normal web portal, not SSH"
Write-Host "- keep GAIL_AUTH_MODE=open only while prototyping"
