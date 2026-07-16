# 🦾 VisionAssist.AI - Vision Assistance for the Visually Impaired

<div align="center">

**Empowering Independent Living Through Real-Time Computer Vision and AI**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 19+](https://img.shields.io/badge/react-19+-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## 🎯 Overview

VisionAssist.AI is a cutting-edge, locally-hosted application designed to help visually impaired individuals understand their surroundings through real-time computer vision and AI. It uses advanced YOLO object detection, OCR technology, and text-to-speech synthesis to provide instant, contextual audio feedback about the user's environment.

**Privacy First:** All processing happens locally on your machine—zero data is sent to external servers.

---

## ✨ Core Features

### 🔍 **Real-Time Object Detection**
- Detects everyday objects (people, chairs, laptops, phones, etc.)
- Announces proximity and position (left, center, right)
- Proximity-based alerts for obstacles and obstacles detection

### 📖 **Intelligent Text-to-Speech (OCR)**
- Reads printed text in real-time (books, labels, signs, documents)
- Automatic currency recognition
- Supports multiple languages via EasyOCR

### 💰 **Currency Identification**
- Specialized currency recognition
- Denomination detection (e.g., "200 rupee note")

### 🎚️ **Advanced Voice Settings**
- Adjustable speaking rate (70-200 WPM)
- Volume control
- Enable/disable audio feedback
- Narrator mode for full sentence descriptions

### 👤 **Admin Dashboard**
- Activity logging and monitoring
- User management
- Emergency alert system
- Dataset uploads for future model improvements

### 🎨 **Premium UI/UX**
- Modern glassmorphism design
- Smooth animations with Framer Motion
- Fully responsive and accessible
- Dark theme optimized for accessibility

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (modern, fast Python web framework)
- **Vision AI:** 
  - YOLOv8n (Ultralytics) - Object detection
  - EasyOCR - Text recognition
- **Image Processing:** OpenCV
- **Audio:** Pyttsx3 (text-to-speech)
- **Database:** SQLite with SQLModel ORM
- **Authentication:** JWT + Bcrypt

### Frontend
- **Framework:** React 19 with Hooks
- **Build Tool:** Vite (lightning-fast build)
- **Styling:** Tailwind CSS + Glassmorphism
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios

### Communication
- MJPEG streaming for low-latency video feed
- RESTful API with JSON

---

## 📋 System Requirements

### Minimum
- **OS:** Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Python:** 3.10 or higher
- **Node.js:** 16.0 or higher
- **RAM:** 4GB minimum (8GB+ recommended)
- **Storage:** 2GB free space

### Recommended
- **RAM:** 8GB+
- **GPU:** NVIDIA GPU with CUDA support (optional, for faster detection)
- **Webcam:** USB 3.0 or built-in
- **Audio:** External speakers or headphones

---

## 🚀 Installation & Setup

### Option 1: Quick Start (Recommended for Windows)

#### Prerequisites
1. Install [Python 3.10+](https://www.python.org/downloads/) (add to PATH during installation)
2. Install [Node.js 16+](https://nodejs.org/)
3. Ensure you have a working webcam

#### Steps

**Terminal 1 - Backend (FastAPI):**
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The backend will start on `http://localhost:8000`

**Terminal 2 - Frontend (React):**
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`

**Browser:**
Open `http://localhost:5173` and login with:
- Username: `admin`
- Password: `admin123`

---

### Option 2: Using the Shell Script (macOS/Linux)

From the project root:
```bash
chmod +x start.sh
./start.sh
```

The script will:
1. Install all dependencies
2. Start backend on port 8000
3. Start frontend on port 5173
4. Open the application in your browser

---

## 📁 Project Structure

```
Ai_Vision_Assistance/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── yolov8n.pt          # Pre-trained YOLO model
│   ├── vision_assist.db    # SQLite database
│   └── __pycache__/         # Cache files
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── App.css          # Glassmorphism styling
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # React entry point
│   ├── public/              # Static assets
│   ├── package.json         # npm dependencies
│   ├── vite.config.js       # Vite configuration
│   └── eslint.config.js     # Linting rules
├── README.md                # This file
├── start.sh                 # Automated startup script
└── VisionAssist_Final_Documentation_v2.md  # Detailed docs
```

---

## 🔌 API Endpoints

### Video & Vision
- `GET /video_feed` - MJPEG video stream from webcam
- `GET /describe_scene` - Get description of current scene
- `GET /describe_bottle` - Identify any prominent object in frame (enhanced to detect any object, not just bottles)
- `POST /read_text` - Read text from camera (OCR)
- `GET /identify_currency` - Identify currency denomination

### Settings
- `POST /settings` - Update voice settings
- `GET /status` - Get system status

### Admin
- `POST /admin/login` - Admin authentication
- `GET /admin/logs` - View activity logs
- `GET /admin/users` - List all users
- `GET /admin/alerts` - View emergency alerts
- `POST /trigger_alert` - Trigger emergency alert
- `DELETE /admin/users/{user_id}` - Delete user
- `POST /admin/clear_logs` - Clear activity logs

---

## 🎮 Usage Guide

### Main Features

#### 1. **Scene Check**
- Click "Scene Check" to get a description of what's in the camera view
- Audio will announce detected objects and their positions

#### 2. **Read Text**
- Click "Read Text" to read any text visible in the camera
- Works on books, signs, documents, etc.

#### 3. **Currency Recognition**
- Click "Currency" to identify money in view
- Announces denomination and type

#### 4. **Identify Item** (NEW - Bug Fixed!)
- Click "Identify Item" to detect and describe any object
- Improved to work with any object, not just bottles
- Provides detailed descriptions based on what's detected

#### 5. **SOS Alert**
- Emergency button to send distress signals
- Logged in admin dashboard

#### 6. **Voice Settings**
- Adjust speaking rate (slower/faster)
- Toggle audio feedback on/off
- Test voice modules

#### 7. **Session Log**
- View history of all detected objects and actions
- Useful for reviewing what was detected

---

## 🐛 Recent Bug Fixes

### Fixed: "AI Narrative Stuck on Bottle Detection"
**Issue:** The "Identify Item" feature always returned "I don't see a bottle in view" regardless of what was in the camera.

**Root Cause:** Backend endpoint was hardcoded to only search for "bottle" objects and lacked fallback detection.

**Solution:** 
- Refactored `/describe_bottle` endpoint to detect the most prominent object in frame
- Added intelligent fallback descriptions for non-bottle objects
- Improved object detection confidence thresholding
- Enhanced error handling and logging

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Local-only processing (no external API calls)
- ✅ SQLite database with user isolation
- ✅ Admin-only endpoints with token verification

---

## 🚨 Troubleshooting

### Camera Not Detected
```
Error: "Camera not detected. Please ensure your webcam is connected."
```
**Solution:**
- Check that webcam is plugged in and recognized by OS
- Try a different USB port
- Check Device Manager (Windows) or System Report (macOS)
- Restart the application

### Python Dependency Issues
```
Error: "ModuleNotFoundError: No module named 'yolo'"
```
**Solution:**
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Port Already in Use
```
Error: "Address already in use" on port 8000 or 5173
```
**Solution:**
```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Low Frame Rate / Slow Detection
- Reduce video resolution in camera settings
- Close other applications consuming CPU
- Consider GPU acceleration with CUDA

---

## 📊 Performance Tips

- **GPU Support:** Install CUDA for NVIDIA GPUs for 3-5x faster detection
- **Model Size:** Using YOLOv8n (nano) for speed; can upgrade to YOLOv8m for accuracy
- **OCR Speed:** EasyOCR downloads models on first run (~200MB)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Python: PEP 8 (use `pylint` or `black`)
- JavaScript: ESLint configuration provided

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Credits

- **Vision Processing:** Ultralytics YOLO
- **Text Recognition:** Baidu EasyOCR
- **UI/UX:** Modern React + Framer Motion
- **Text-to-Speech:** Pyttsx3
- **Icons:** Lucide React

---

## 📧 Support & Contact

For issues, questions, or suggestions:
- Open an GitHub issue
- Check the [detailed documentation](./VisionAssist_Final_Documentation_v2.md)
- Review existing issues for solutions

---

## 🎓 About

VisionAssist.AI was developed with the goal of improving accessibility and independence for visually impaired individuals through cutting-edge AI technology. Every feature is designed with the end user in mind.

**Developed for the betterment of humanity using advanced Computer Vision.**

---

<div align="center">

Made with ❤️ for accessibility

[⬆ Back to Top](#-visionassistai---vision-assistance-for-the-visually-impaired)

</div>
