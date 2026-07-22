# VisionAssist.AI - Stop All Services (Windows PowerShell)

Write-Host ""
Write-Host "Stopping VisionAssist.AI services..." -ForegroundColor Yellow
Write-Host ""

# --- Stop Backend (port 8000) ---
$backendConn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendConn) {
    $backendConn | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Backend (port 8000) stopped." -ForegroundColor Green
} else {
    Write-Host "Backend was not running." -ForegroundColor DarkGray
}

# --- Stop Frontend (port 5173) ---
$frontendConn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendConn) {
    $frontendConn | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Frontend (port 5173) stopped." -ForegroundColor Green
} else {
    Write-Host "Frontend was not running." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "All services stopped. Goodbye!" -ForegroundColor Cyan
Write-Host ""
