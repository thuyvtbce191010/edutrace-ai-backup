$port = 8080
$folder = $PSScriptRoot
if (-not $folder) {
    $folder = Get-Location
}

$listener = New-Object System.Net.HttpListener
$portsToTry = @(8080, 8081, 8082, 3000, 5000)
$started = $false

foreach ($p in $portsToTry) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://127.0.0.1:$p/")
        $listener.Start()
        $port = $p
        $started = $true
        break
    } catch {
        # Thu port tiep theo
    }
}

if (-not $started) {
    Write-Host "[LOI] Khong the mo port tren he thong." -ForegroundColor Red
    Read-Host "Nhan Enter de thoat..."
    exit 1
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "        EDUTRACE AI SERVER DANG HOAT DONG!" -ForegroundColor Green
Write-Host "        Dia chi web: http://127.0.0.1:$port/index.html" -ForegroundColor Yellow
Write-Host "        Cong Admin:  http://127.0.0.1:$port/admin.html" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Dang tu dong mo trinh duyet..." -ForegroundColor Gray
Write-Host "Luu y: Giu nguyen cua so nay khi dang xem web." -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Cyan

# Mo trinh duyet
Start-Process "http://127.0.0.1:$port/index.html"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ($urlPath -eq "" -or $urlPath -eq "/") {
            $urlPath = "index.html"
        }

        # Decode URL an toan
        $urlPath = [System.Uri]::UnescapeDataString($urlPath)
        $filePath = Join-Path $folder $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "text/plain"
            switch ($ext) {
                ".html" { $mime = "text/html; charset=utf-8" }
                ".css"  { $mime = "text/css; charset=utf-8" }
                ".js"   { $mime = "application/javascript; charset=utf-8" }
                ".json" { $mime = "application/json; charset=utf-8" }
                ".jpg"  { $mime = "image/jpeg" }
                ".jpeg" { $mime = "image/jpeg" }
                ".png"  { $mime = "image/png" }
                ".svg"  { $mime = "image/svg+xml" }
                ".ico"  { $mime = "image/x-icon" }
            }
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: " + $urlPath)
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # ignore context errors on stop
    }
}
