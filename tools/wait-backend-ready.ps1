param(
  [string]$BaseUrl = "http://127.0.0.1:4180",
  [int]$TimeoutSeconds = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

while ((Get-Date) -lt $deadline) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/health" -TimeoutSec 3
    if ([int]$response.StatusCode -eq 200) {
      Write-Output "READY"
      exit 0
    }
  }
  catch {
    Start-Sleep -Milliseconds 500
  }
}

throw "Backend did not become ready at $BaseUrl within $TimeoutSeconds seconds."
