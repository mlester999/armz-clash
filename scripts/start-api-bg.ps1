# Phase 3.2 QA helper: start the Fastify API in the background for local
# integration/E2E validation. Persistence mode comes from root .env
# (database for hosted validation, memory-test for foundation E2E).
# Never used in production.
$ErrorActionPreference = 'Stop'
$env:ARMZ_API_PORT = '4000'
$repo = Split-Path -Parent $PSScriptRoot
Start-Process -FilePath 'cmd.exe' `
  -ArgumentList '/c', 'pnpm --filter @armz-clash/api exec tsx src/index.ts' `
  -WorkingDirectory $repo `
  -WindowStyle Hidden `
  -RedirectStandardOutput "$env:TEMP\armz_api_out.log" `
  -RedirectStandardError "$env:TEMP\armz_api_err.log"
# Wait for /health
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4000/health' -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { }
}
if ($ok) {
  Write-Output 'API is up (health 200)'
  try {
    $ready = Invoke-WebRequest -Uri 'http://127.0.0.1:4000/ready' -UseBasicParsing -TimeoutSec 8
    Write-Output "READY status: $($ready.StatusCode)"
    Write-Output $ready.Content
  } catch {
    Write-Output "READY status: $($_.Exception.Response.StatusCode.value__)"
  }
} else {
  Write-Output 'API failed to start'
  Get-Content "$env:TEMP\armz_api_err.log" -ErrorAction SilentlyContinue | Select-Object -Last 12
}
