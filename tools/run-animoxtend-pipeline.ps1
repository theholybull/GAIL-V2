param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ForwardArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$externalScript = Join-Path $PSScriptRoot "run-animoxtend-local-pipeline.ps1"

if (-not (Test-Path -LiteralPath $externalScript -PathType Leaf)) {
  throw "AnimoXTend pipeline wrapper not found at $externalScript"
}

& powershell -NoProfile -ExecutionPolicy Bypass -File $externalScript @ForwardArgs
