# 🛑 VisionAssist.AI — Stop Guide

How to stop all running services (Backend + Frontend) for the VisionAssist.AI project.

---

## ⚡ Quick Stop — One Command

### 🪟 Windows (PowerShell)

Open a PowerShell terminal in the project root and run:

```powershell
.\stop.ps1
```

Expected output:
```
Stopping VisionAssist.AI services...

Backend (port 8000) stopped.
Frontend (port 5173) stopped.

All services stopped. Goodbye!
```

---

### 🐧 macOS / Linux (Terminal)

```bash
chmod +x stop.sh
./stop.sh
```

Expected output:
```
Stopping VisionAssist.AI services...
✅ Backend (port 8000) stopped.
✅ Frontend (port 5173) stopped.

All services stopped. Goodbye!
```

---

## 🔧 Manual Stop (Without Scripts)

### 🪟 Windows — Stop Backend Only

```powershell
$p = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($p) { Stop-Process -Id $p.OwningProcess -Force }
```

### 🪟 Windows — Stop Frontend Only

```powershell
$p = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($p) { Stop-Process -Id $p.OwningProcess -Force }
```

### 🐧 macOS / Linux — Stop Backend Only

```bash
kill -9 $(lsof -ti :8000)
```

### 🐧 macOS / Linux — Stop Frontend Only

```bash
kill -9 $(lsof -ti :5173)
```

---

## 🖥️ Stop Using Terminal Window

If you started the services manually in separate terminals:

- Press **`Ctrl + C`** in the **backend** terminal to stop FastAPI
- Press **`Ctrl + C`** in the **frontend** terminal to stop Vite

---

## ❓ Check If Services Are Still Running

### 🪟 Windows

```powershell
# Check backend
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# Check frontend
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```
If no output is returned, the service is not running.

### 🐧 macOS / Linux

```bash
lsof -i :8000   # Check backend
lsof -i :5173   # Check frontend
```
If no output is returned, the service is not running.

---

## 🔁 To Restart After Stopping

```powershell
# Windows
.\start.ps1
```

```bash
# macOS / Linux
./start.sh
```

---

> 💡 **Tip:** Always stop the project cleanly before shutting down your computer to avoid port conflicts on the next startup.
