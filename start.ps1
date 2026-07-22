$ErrorActionPreference = "Stop"

Write-Host "Starting AI Vision Assistance System..." -ForegroundColor Green

# Try to kill processes on port 8000 (Backend)
$backendProc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendProc) {
    Write-Host "Killing existing backend process..." -ForegroundColor Yellow
    $backendProc | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

# Try to kill processes on port 5173 (Frontend)
$frontendProc = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendProc) {
    Write-Host "Killing existing frontend process..." -ForegroundColor Yellow
    $frontendProc | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

Write-Host "Checking Backend Dependencies..." -ForegroundColor Cyan
Set-Location "backend"
python -m pip install -r requirements.txt
python -m pip install bcrypt==3.2.2

Write-Host "Launching Backend (Port 8000)..." -ForegroundColor Cyan
Start-Process -NoNewWindow python -ArgumentList "main.py"

Write-Host "Checking Frontend Dependencies..." -ForegroundColor Magenta
Set-Location "../frontend"
npm install
Write-Host "Launching Frontend (Port 5173)..." -ForegroundColor Magenta
Start-Process -NoNewWindow npm.cmd -ArgumentList "run dev -- --host --port 5173"

Set-Location ".."

Write-Host "------------------------------------------------" -ForegroundColor Green
Write-Host "VisionAssist System is launching!"
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host "-----------------------------------------------"
Write-Host "ADMIN LOGIN: admin / admin123"
Write-Host "------------------------------------------------"
Write-Host "Please grant camera permissions when prompted."
Write-Host "Press any key to stop services and exit."

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStopping services..." -ForegroundColor Yellow

$backendProc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendProc) {
    $backendProc | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

$frontendProc = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendProc) {
    $frontendProc | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}
