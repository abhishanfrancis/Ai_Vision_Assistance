# 🚀 VisionAssist.AI — Startup Guide

A quick-reference guide to get the project running locally on **Windows**, **macOS**, or **Linux**.

---

## ✅ Prerequisites

Make sure the following are installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| **Python** | 3.10 or higher | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 16 or higher | [nodejs.org](https://nodejs.org/) |
| **Git** | Any | [git-scm.com](https://git-scm.com/) |
| **Webcam** | Any USB or built-in | — |

> ⚠️ **Windows users:** When installing Python, make sure to check **"Add Python to PATH"** during setup.

---

## 📁 Project Structure

```
Ai_Vision_Assistance/
├── backend/
│   ├── main.py              # FastAPI server (Python)
│   ├── requirements.txt     # Python dependencies
│   └── yolov8n.pt           # Pre-trained YOLO model
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   └── components/      # UI components
│   ├── package.json
│   └── vite.config.js
├── start.ps1                # 🪟 Windows one-click launcher
├── start.sh                 # 🐧 macOS/Linux one-click launcher
└── STARTUP.md               # This file
```

---

## ⚡ Option 1 — One-Click Launch (Recommended)

### 🪟 Windows (PowerShell)

Open a **PowerShell** terminal in the project root and run:

```powershell
.\start.ps1
```

> 💡 If you get a script execution error, first run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Then try `.\start.ps1` again.

### 🐧 macOS / Linux (Terminal)

```bash
chmod +x start.sh
./start.sh
```

The script will automatically:
1. Install all Python backend dependencies
2. Install all Node.js frontend dependencies
3. Start the **Backend** on `http://localhost:8000`
4. Start the **Frontend** on `http://localhost:5173`

---

## 🔧 Option 2 — Manual Setup (Step by Step)

### Step 1 — Backend

Open a terminal and run:

```bash
cd backend
pip install -r requirements.txt
pip install bcrypt==3.2.2
python main.py
```

You should see:
```
Webcam successfully initialized.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2 — Frontend

Open a **second** terminal and run:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 3 — Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Default Login Credentials

The admin dashboard is accessible via the **"Restricted Admin Portal"** link in the app.

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend App | [http://localhost:5173](http://localhost:5173) | Main user interface |
| Backend API | [http://localhost:8000](http://localhost:8000) | FastAPI REST server |
| API Docs (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API explorer |
| Video Feed | [http://localhost:8000/video_feed](http://localhost:8000/video_feed) | Raw MJPEG stream |

---

## 🛑 Stopping the Project

### If started via `start.ps1` (Windows)
Press any key in the PowerShell window — the script will gracefully shut both servers down.

### If started manually
Press `Ctrl + C` in each terminal window (backend and frontend) to stop them.

### Force-kill ports (Windows)
If ports are stuck in use:
```powershell
# Kill backend (port 8000)
$p = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($p) { Stop-Process -Id $p.OwningProcess -Force }

# Kill frontend (port 5173)
$p = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($p) { Stop-Process -Id $p.OwningProcess -Force }
```

---

## 🚨 Troubleshooting

### ❌ Camera not detected
```
Camera not detected. Please ensure your webcam is connected.
```
- Check your webcam is plugged in and not in use by another app (Zoom, Teams, etc.)
- Try a different USB port
- Restart the backend

---

### ❌ `bcrypt` install fails (Windows)
```
ERROR: Failed building wheel for bcrypt
error: Microsoft Visual C++ 14.0 or greater is required
```
**Fix:** Use the pre-built wheel version:
```bash
pip install bcrypt==3.2.2
```

---

### ❌ `npm run dev` fails with Tailwind PostCSS error
```
[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin
```
**Fix:** This project uses **Tailwind CSS v4** which requires the Vite plugin, not PostCSS. Make sure `vite.config.js` looks like this:
```js
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
And `index.css` starts with:
```css
@import "tailwindcss";
```

---

### ❌ Port already in use
```
Address already in use (port 8000 or 5173)
```
Run the force-kill commands above, then restart.

---

### ❌ `npm` not recognized in PowerShell
```
Start-Process: This command cannot be run due to the error: %1 is not a valid Win32 application.
```
The `start.ps1` script uses `npm.cmd` (the Windows-compatible command). Make sure you haven't modified this line in `start.ps1`.

---

## 📊 Performance Notes

- **No GPU?** The backend runs on CPU by default. Object detection runs every **5 frames** (configurable in `backend/main.py`) to keep the stream smooth.
- **GPU (NVIDIA CUDA):** Install `torch` with CUDA support for 3–5× faster detection: [pytorch.org/get-started](https://pytorch.org/get-started/locally/)
- **First run:** EasyOCR downloads language models (~200MB) on its first invocation — this is normal.

---

## 🔁 Re-running After First Setup

Once all dependencies are installed, you only need:

**Windows:**
```powershell
.\start.ps1
```

**macOS/Linux:**
```bash
./start.sh
```

No need to `npm install` or `pip install` again unless `package.json` or `requirements.txt` change.

---

<div align="center">

Made with ❤️ for accessibility — VisionAssist.AI

</div>
