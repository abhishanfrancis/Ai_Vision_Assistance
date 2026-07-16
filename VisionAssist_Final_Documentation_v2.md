# VisionAssist.AI: Software Requirements Specification (SRS) and Data Flow Diagram (DFD)

**Project Title:** AI-Based Vision Assistance System for the Visually Impaired  
**Version:** 2.0 (Final Production Build)  
**Date:** March 13, 2026  
**Status:** Complete / Deployed  

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to provide a comprehensive and detailed specification for the VisionAssist.AI system. This includes functional and non-functional requirements, architectural design, data flow diagrams, and implementation details. This document serves as a complete technical manual for the project.

### 1.2 Scope
VisionAssist.AI is a software-based assistive technology designed to enhance the independence and safety of visually impaired individuals. The system leverages state-of-the-art Computer Vision and Deep Learning to:
- Detect and identify objects in real-time.
- Calculate distances and warn of obstacles.
- Distinguish between specific items (e.g., Water Bottle vs. Juice Bottle).
- Identify currency denominations for financial independence.
- Read printed text from books, labels, and signs using OCR.
- Provide a robust Admin Dashboard for system monitoring and dataset updates.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SRS**: Software Requirements Specification
- **DFD**: Data Flow Diagram
- **OCR**: Optical Character Recognition
- **YOLO**: You Only Look Once (Object Detection Model)
- **TTS**: Text-to-Speech
- **API**: Application Programming Interface

---

## 2. Overall Description

### 2.1 Product Perspective
VisionAssist.AI is a standalone web-based application that integrates a Python-FastAPI backend with a React-Vite frontend. It uses the device's camera as the primary input sensor and provides audio feedback as the primary output.

### 2.2 Project Features (New & Enhanced)
1. **Intelligent Scene Description**: Uses YOLOv8 to describe complex environments.
2. **Specialized Item Identification**: Capable of reading brand labels on bottles to define contents (e.g., "Mineral Water").
3. **Currency Recognition**: Optimized OCR and pattern matching to identify banknotes.
4. **Obstacle Detection**: Real-time distance estimation with high-priority audio alerts.
5. **Admin Control Hub**: A restricted portal for monitoring "SOS" alerts, system logs, and user activity.
6. **Dataset Improvement Pipeline**: Admins can upload new image samples to refine detection models.

### 2.3 User Characteristics
The primary users are individuals with visual impairments. Secondary users are administrators and caregivers who manage the system alerts and telemetry.

---

## 3. System Architecture

### 3.1 Backend Architecture
The backend is built using **FastAPI** for high-performance asynchronous operations.
- **Vision Engine**: Integrates Ultralytics YOLOv8n.
- **OCR Engine**: Utilizes EasyOCR with GPU acceleration support.
- **Database**: SQLModel with SQLite for data persistence (Logs, Users, Alerts).
- **Communication**: WebSockets or Streaming Responses for live video overlays.

### 3.2 Frontend Architecture
The frontend is built using **React** with **Framer Motion** for a premium, accessible UI.
- **Components**: Modular design for video streaming, voice settings, and telemetry charts.
- **State Management**: React Hooks for real-time status updates and voice history logging.

---

## 4. Data Flow Diagrams (DFD)

### 4.1 DFD Level 0 (Context Diagram)
- **Input**: Video stream from camera.
- **Process**: VisionAssist System.
- **Output**: Audio feedback and Visual UI (Admin/User).

### 4.2 DFD Level 1 (Process Breakdown)
1. **Image Capture**: Frame-by-frame extraction from the video stream.
2. **Object Detection**: Identifying coordinates and class labels using YOLO.
3. **Context Analyzer**: Analyzing proximity and importance of detected objects.
4. **TTS Generator**: Converting text descriptions into speech signals.
5. **Telemetry Logger**: Saving activity logs to the database.

---

## 5. Specific Requirements

### 5.1 Functional Requirements
- **FR1**: System MUST process video at a minimum of 15 FPS.
- **FR2**: System MUST identify at least 80 distinct object classes.
- **FR3**: System MUST identify currency within 3 seconds of alignment.
- **FR4**: System MUST trigger an Admin alert within 500ms of an SOS press.

### 5.2 Non-Functional Requirements
- **Usability**: High contrast UI and full audio-guided navigation.
- **Reliability**: 99.9% uptime for the backend server.
- **Scalability**: Capable of handling multiple concurrent users via the monitoring dashboard.

---

## 6. Implementation & Code Details

### 6.1 Vision Logic (YOLO & Distance)
```python
# Calculating distance based on bounding box area ratio
box_area = (x2 - x1) * (y2 - y1)
frame_area = frame_width * frame_height
area_ratio = box_area / frame_area

if area_ratio > 0.3:
    distance = "very close" # Obstacle Priority
```

### 6.2 Intelligent Bottle Categorization
The system crops the bottle bounding box and runs OCR:
- Keywords like "Water", "Mineral", "Bisleri" -> Water Bottle.
- Keywords like "Juice", "Drink", "Fruit" -> Juice/Soft Drink Bottle.

### 6.3 Currency Logic
The OCR engine searches for specific denominations (10, 20, 50, 100, 200, 500, 2000) and currencies ($, ₹, €, £) to provide accurate value narration.

---

## 7. Admin Dashboard Specifications

The Admin portal (`/admin`) is a premium management suite:
- **Telemetry Charts**: Real-time latency and CPU usage.
- **Emergency Monitor**: List of active "SOS" signals with location mapping.
- **Log Audit**: Detailed CSV-like export of all AI detections for forensic review.
- **Model Update**: Drag-and-drop interface for uploading new training data.

---

## 8. Conclusion & Future Work
VisionAssist.AI represents a significant leap forward in affordable assistive technology. Future versions will include GPS integration for outdoor navigation and multi-language OCR support for global accessibility.

---
© 2026 VisionAssist AI - Advanced Computer Vision Project.
