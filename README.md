# 🦾 VisionAssist.AI - Vision Assistance for the Visually Impaired

**Empowering independent living through real-time Computer Vision and AI.**

VisionAssist is a cutting-edge software application designed to help visually impaired individuals understand their surroundings through their laptop's webcam. It uses state-of-the-art YOLO models for object detection and OCR for reading text, all converted into real-time audio feedback.

## ✨ Core Features
- **Object Recognition**: Detects and announces everyday objects (chairs, people, laptops, etc.) in real-time.
- **OCR Text-to-Speech**: Instantly reads printed text found in the camera's view (books, labels, signs).
- **Proximity Alerts**: Announces new objects entering the field of vision every 3 seconds.
- **Premium UI/UX**: Designed with modern accessibility standards and sleek glassmorphism aesthetics.
- **Local Privacy**: Runs entirely on your local machine—no data sent to external servers for processing.

## 🛠️ Technology Stack
- **Backend**: Python 3.10+ with FastAPI, OpenCV, Ultralytics (YOLOv8), EasyOCR, and Pyttsx3.
- **Frontend**: React 18, Vite, Framer Motion (for smooth interactions), and Lucide Icons.
- **Communication**: MJPEG Streaming for low-latency video feed.

## 🚀 One-Click Quick Start
1. Ensure **Python** and **Node.js** are installed on your system.
2. In your terminal, run the following command from the project root:
   ```bash
   ./start.sh
   ```
3. Open your browser and navigate to: `http://localhost:5173`

## 📦 System Requirements
- **Audio**: Speakers or Headphones (for audio feedback).
- **Video**: Built-in or external USB Webcam.
- **Memory**: 4GB+ RAM.
- **Network**: Internet required only for the initial setup to download AI weights.

## 📁 Project Structure
- `/backend`: Python FastAPI logic, AI Models, and Image Processing.
- `/frontend`: Modern React application with glassmorphism UI.
- `start.sh`: Shell script to automate the entire system launch.

---
**Developed for the betterment of humanity using advanced Computer Vision.**
