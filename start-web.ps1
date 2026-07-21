Set-Location "C:\Users\ZEPHY\Documents\Marky Files\Programming Projects\armz-clash\apps\web"
$env:PATH = "C:\Users\ZEPHY\AppData\Local\pnpm;" + $env:PATH
& pnpm exec next dev --hostname 127.0.0.1 --port 3000