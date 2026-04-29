Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $repoRoot "runtime"
$downloadRoot = Join-Path $runtimeRoot "downloads"
$installRoot = Join-Path $runtimeRoot "Tailscale"
$logRoot = Join-Path $repoRoot "data\runtime"

New-Item -ItemType Directory -Force -Path $downloadRoot | Out-Null
New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

function Test-PendingReboot {
  $registryChecks = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired"
  )

  foreach ($path in $registryChecks) {
    if (Test-Path $path) {
      return $true
    }
  }

  try {
    $sessionManager = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name "PendingFileRenameOperations" -ErrorAction SilentlyContinue
    if ($sessionManager.PendingFileRenameOperations) {
      return $true
    }
  } catch {
  }

  return $false
}

if (Test-PendingReboot) {
  throw "Windows reports a pending reboot on this host. Reboot the PC first, then rerun tools\\install-tailscale.ps1."
}

$tailscaleCommand = Get-Command tailscale -ErrorAction SilentlyContinue
if ($tailscaleCommand) {
  Write-Host "Tailscale is already installed:"
  Write-Host $tailscaleCommand.Source
  exit 0
}

$packagesIndexUrl = "https://pkgs.tailscale.com/stable/"
$packagesPage = Invoke-WebRequest -UseBasicParsing -Uri $packagesIndexUrl
$msiMatch = [regex]::Match($packagesPage.Content, 'tailscale-setup-[0-9.]+-amd64\.msi')

if (-not $msiMatch.Success) {
  throw "Could not locate the current official amd64 Tailscale MSI on $packagesIndexUrl"
}

$msiName = $msiMatch.Value
$msiUrl = "https://pkgs.tailscale.com/stable/$msiName"
$msiPath = Join-Path $downloadRoot $msiName

Write-Host "Downloading Tailscale MSI from:"
Write-Host $msiUrl
Invoke-WebRequest -UseBasicParsing -Uri $msiUrl -OutFile $msiPath

function Invoke-TailscaleMsiInstall {
  param(
    [string[]]$ExtraArguments,
    [string]$LogName
  )

  $logPath = Join-Path $logRoot $LogName
  $arguments = @(
    "/i"
    "`"$msiPath`""
  ) + $ExtraArguments + @(
    "/qn"
    "/l*v"
    "`"$logPath`""
  )

  $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $arguments -Wait -PassThru
  return [pscustomobject]@{
    exitCode = $process.ExitCode
    logPath = $logPath
  }
}

Write-Host "Installing Tailscale with binaries directed to:"
Write-Host $installRoot

$customInstall = Invoke-TailscaleMsiInstall -ExtraArguments @("INSTALLDIR=`"$installRoot`"") -LogName "tailscale-install-custom.log"
if ($customInstall.exitCode -eq 0) {
  Write-Host "Tailscale install completed with requested install root."
  Write-Host "Download cached at:"
  Write-Host $msiPath
  Write-Host "Installer log:"
  Write-Host $customInstall.logPath
  Write-Host ""
  Write-Host "Important:"
  Write-Host "- Windows still treats Tailscale as a machine-level install."
  Write-Host "- You still need to sign this host into your tailnet."
  Write-Host "- Rerun tools\\show-remote-access.ps1 after login."
  exit 0
}

Write-Host "Custom install root failed with exit code $($customInstall.exitCode)."
Write-Host "Falling back to the vendor default install path."

$defaultInstall = Invoke-TailscaleMsiInstall -ExtraArguments @() -LogName "tailscale-install-default.log"
if ($defaultInstall.exitCode -ne 0) {
  throw "Tailscale MSI install failed. Custom log: $($customInstall.logPath). Default log: $($defaultInstall.logPath). Default exit code: $($defaultInstall.exitCode)."
}

Write-Host "Tailscale install completed with the vendor default install path."
Write-Host "Download cached at:"
Write-Host $msiPath
Write-Host "Custom install log:"
Write-Host $customInstall.logPath
Write-Host "Default install log:"
Write-Host $defaultInstall.logPath
Write-Host ""
Write-Host "Important:"
Write-Host "- Windows still treats Tailscale as a machine-level install."
Write-Host "- This host accepted the default install path instead of the requested drive-local path."
Write-Host "- You still need to sign this host into your tailnet."
Write-Host "- Rerun tools\\show-remote-access.ps1 after login."
