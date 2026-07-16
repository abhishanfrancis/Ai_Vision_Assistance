import cv2
import asyncio
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import pyttsx3
import threading
import os
import time
import numpy as np
from sqlmodel import Field, SQLModel, create_engine, Session, select
from datetime import datetime
from typing import Optional, List
from passlib.context import CryptContext
from jose import JWTError, jwt

# Database Setup
sqlite_url = "sqlite:///vision_assist.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

# Admin Models
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    is_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = None
    action: str
    details: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class EmergencyAlert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = None
    location: str
    status: str = "Pending" # Pending, Resolved
    timestamp: datetime = Field(default_factory=datetime.utcnow)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "vision_assist_secret_key"
ALGORITHM = "HS256"

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

create_db_and_tables()

# Initialize Default Admin
with Session(engine) as session:
    admin_exists = session.exec(select(User).where(User.username == "admin")).first()
    if not admin_exists:
        admin_user = User(
            username="admin", 
            hashed_password=get_password_hash("admin123"), 
            is_admin=True
        )
        session.add(admin_user)
        session.commit()

# Initialize FastAPI
app = FastAPI(title="Vision Assist API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Speech Settings
speech_settings = {
    "rate": 150,
    "volume": 0.9,
    "enabled": True,
    "narrator_mode": True # If true, speaks full sentences
}

# Thread lock for TTS
tts_lock = threading.Lock()

def speak(text: str):
    if not speech_settings["enabled"]:
        return
        
    def _run():
        with tts_lock:
            try:
                local_engine = pyttsx3.init()
                local_engine.setProperty('rate', speech_settings["rate"])
                local_engine.setProperty('volume', speech_settings["volume"])
                local_engine.say(text)
                local_engine.runAndWait()
            except Exception as e:
                print(f"TTS Error: {e}")
    
    threading.Thread(target=_run, daemon=True).start()

# Initial welcome
try:
    speak("AI Assistant is ready. I will now explain what I see in the camera view.")
except:
    pass

# Load YOLO Model (YOLOv8 Small for speed)
model = YOLO('yolov8n.pt')

# For Video Streaming
camera_initialized = False
try:
    # Use index 0 but try others if it fails
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        camera = cv2.VideoCapture(1) # Try secondary camera
    
    if camera.isOpened():
        camera_initialized = True
        print("Webcam successfully initialized.")
    else:
        print("Warning: Could not open any webcam.")
except Exception as e:
    print(f"Camera Initialization Error: {e}")
    camera = None

async def generate_frames():
    global camera_initialized
    last_speak_time = 0
    detected_objects = set()
    
    while True:
        if not camera or not camera.isOpened():
            time.sleep(1)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + b'' + b'\r\n')
            continue

        success, frame = camera.read()
        if not success:
            camera_initialized = False
            break
        
        camera_initialized = True
        # Run inference
        results = model(frame, verbose=False)[0]
        
        current_detected = []
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = model.names[int(box.cls[0])]
            conf = float(box.conf[0])
            
            if conf > 0.45:
                # Calculate position
                center_x = (x1 + x2) / 2
                frame_width = frame.shape[1]
                frame_height = frame.shape[0]
                
                if center_x < frame_width / 3:
                    pos = "on the left"
                elif center_x > (frame_width / 3) * 2:
                    pos = "on the right"
                else:
                    pos = "in the center"

                # Distance Estimation (Heuristic based on box area vs frame area)
                box_area = (x2 - x1) * (y2 - y1)
                frame_area = frame_width * frame_height
                area_ratio = box_area / frame_area
                
                # Simplified distance: Higher ratio = Closer
                if area_ratio > 0.3:
                    distance = "very close"
                    is_obstacle = True
                elif area_ratio > 0.1:
                    distance = "nearby"
                    is_obstacle = False
                else:
                    distance = "far away"
                    is_obstacle = False

                # Currency Recognition (Simplified Label Extension)
                # In real scenario, we'd use a specific model, but here we can check OCR if it's a 'paper' or broad object
                if label in ["paper", "card", "cell phone"]: 
                    # Potential for refinement - checking for currency shapes/colors
                    pass

                color = (99, 102, 241)
                if is_obstacle:
                    color = (239, 68, 68) # Red for obstacles
                    cv2.putText(frame, "OBSTACLE", (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.rectangle(frame, (x1, y1 - 25), (x1 + 100, y1), color, -1)
                cv2.putText(frame, f"{label} - {distance}", (x1 + 5, y1 - 7), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                current_detected.append({"label": label, "pos": pos, "distance": distance, "is_obstacle": is_obstacle})

        # Logic to speak ONLY when something NEW is shown or obstacles are near
        current_labels = set([d["label"] for d in current_detected])
        new_labels = current_labels - detected_objects
        near_obstacles = [d for d in current_detected if d["is_obstacle"]]
        
        if (new_labels or near_obstacles) and (time.time() - last_speak_time > 4):
            phrase = ""
            if near_obstacles:
                phrase = f"Warning! {near_obstacles[0]['label']} is very close {near_obstacles[0]['pos']}. "
            
            if new_labels:
                item = next(d for d in current_detected if d["label"] in new_labels)
                phrase += f"I see a {item['label']} {item['pos']} about {item['distance']}."
            
            if phrase:
                speak(phrase)
                last_speak_time = time.time()
                # Log activity to DB
                with Session(engine) as session:
                    log = ActivityLog(action="Object Detection", details=phrase)
                    session.add(log)
                    session.commit()

            detected_objects = current_labels

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(generate_frames(), 
                             media_type="multipart/x-mixed-replace; boundary=frame")

# Settings Model
from pydantic import BaseModel
class SpeechSettings(BaseModel):
    rate: int
    volume: float
    enabled: bool
    narrator_mode: bool

@app.post("/settings")
async def update_settings(settings: SpeechSettings):
    global speech_settings
    speech_settings["rate"] = settings.rate
    speech_settings["volume"] = settings.volume
    speech_settings["enabled"] = settings.enabled
    speech_settings["narrator_mode"] = settings.narrator_mode
    return {"message": "Settings updated", "current": speech_settings}

@app.get("/describe_scene")
async def describe_scene():
    if not camera or not camera.isOpened():
        speak("Camera is offline.")
        return {"description": "Camera is offline."}
    
    success, frame = camera.read()
    if not success:
        speak("Failed to capture scene.")
        return {"description": "Failed to capture scene."}
    
    results = model(frame, verbose=False)[0]
    objects = [model.names[int(box.cls[0])] for box in results.boxes if float(box.conf[0]) > 0.45]
    
    if not objects:
        desc = "The camera view appears to be clear of any recognizable objects at the moment."
    else:
        from collections import Counter
        counts = Counter(objects)
        items = []
        for obj, count in counts.items():
            items.append(f"{count} {obj}{'s' if count > 1 else ''}")
        
        if len(items) == 1:
            desc = f"Looking at the screen, I can see {items[0]} right now."
        else:
            desc = f"Looking at the screen, I am observing {', '.join(items[:-1])} and {items[-1]}."
            
    speak(desc)
    return {"description": desc}

@app.get("/test_speech")
async def test_speech():
    speak("Testing the AI Vision Assist audio feedback system.")
    return {"status": "ok"}

try:
    import easyocr
    reader = easyocr.Reader(['en'])
except Exception as e:
    print(f"EasyOCR Error: {e}")
    reader = None

@app.post("/read_text")
async def read_text():
    if not camera or not camera.isOpened():
        speak("Camera is not available.")
        return {"error": "Camera error", "text": "Camera disconnected"}
        
    success, frame = camera.read()
    if not success:
        return {"error": "Capture error", "text": "Failed to read frame"}
    
    if reader:
        speak("Analyzing text content...")
        # Image preprocessing for better OCR
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # Increase contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        results = reader.readtext(enhanced)
        text = " ".join([res[1] for res in results])
    else:
        text = "OCR model not loaded."
    
    if text.strip():
        # ... (existing currency logic)
        currency_keywords = ["dollars", "rupees", "euro", "pounds", "$", "₹", "€", "£", "10", "20", "50", "100", "200", "500", "2000"]
        is_currency = any(kw in text.lower() for kw in currency_keywords)
        
        if is_currency:
            # Try to find specific denomination
            denom = "currency"
            for kw in ["10", "20", "50", "100", "200", "500", "2000"]:
                if kw in text:
                    denom = f"{kw} unit note"
                    break
            speak(f"Identification complete. This appears to be a {denom}.")
            action_type = "Currency Recognition"
        else:
            speak(f"Reading text: {text}")
            action_type = "OCR"
            
        with Session(engine) as session:
            log = ActivityLog(action=action_type, details=f"Detected: {text[:200]}")
            session.add(log)
            session.commit()
            
        return {"text": text, "is_currency": is_currency}
    else:
        speak("I couldn't detect any clear text. Please hold the object steady and ensure there is good lighting.")
        return {"text": "", "message": "No text detected"}

@app.get("/identify_currency")
async def identify_currency():
    # Similar to read_text but specialized for currency
    return await read_text()

# --- Admin API ---
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/admin/login")
async def admin_login(req: LoginRequest):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == req.username)).first()
        if user and verify_password(req.password, user.hashed_password):
            return {"status": "success", "user": {"username": user.username, "is_admin": user.is_admin}}
    return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid credentials"})

@app.get("/admin/logs")
async def get_logs():
    with Session(engine) as session:
        logs = session.exec(select(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(100)).all()
        return logs

@app.get("/admin/users")
async def get_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users

@app.get("/admin/alerts")
async def get_alerts():
    with Session(engine) as session:
        alerts = session.exec(select(EmergencyAlert).order_by(EmergencyAlert.timestamp.desc())).all()
        return alerts

@app.post("/trigger_alert")
async def trigger_alert(location: str = "Unknown"):
    with Session(engine) as session:
        alert = EmergencyAlert(location=location)
        session.add(alert)
        session.commit()
    speak("Emergency alert triggered. Admin has been notified.")
    return {"status": "triggered"}

@app.get("/describe_bottle")
async def describe_bottle():
    if not camera or not camera.isOpened():
        return {"error": "Camera offline"}
    
    success, frame = camera.read()
    if not success: return {"error": "Capture failure"}
    
    speak("Analyzing the object...")
    # Run YOLO to detect any object
    results = model(frame, verbose=False)[0]
    
    # Find the largest/most prominent object in the frame
    best_box = None
    best_label = None
    best_conf = 0
    best_area = 0
    
    for box in results.boxes:
        conf = float(box.conf[0])
        if conf > 0.45:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)
            if area > best_area:
                best_area = area
                best_box = box.xyxy[0]
                best_label = model.names[int(box.cls[0])]
                best_conf = conf
    
    if best_box is not None:
        x1, y1, x2, y2 = map(int, best_box)
        # Add padding to crop for better OCR
        h, w = frame.shape[:2]
        pad = 20
        crop = frame[max(0, y1-pad):min(h, y2+pad), max(0, x1-pad):min(w, x2+pad)]
        
        # Generate description based on object type
        if best_label == "bottle":
            if reader:
                ocr_res = reader.readtext(crop)
                bottle_text = " ".join([res[1] for res in ocr_res]).lower()
                
                # More extensive keyword matching
                water_keywords = ["water", "aquafina", "bisleri", "kinley", "mineral", "h2o", "purified"]
                juice_keywords = ["juice", "drink", "pulp", "fruit", "mango", "orange", "apple", "nectar", "tropical", "beverage", "soda", "coke", "pepsi"]
                
                if any(k in bottle_text for k in water_keywords):
                    res = "This is a water bottle. It appears to contain clear drinking water."
                elif any(k in bottle_text for k in juice_keywords):
                    res = "This is a juice or soft drink bottle. Please check the flavor before drinking."
                elif bottle_text.strip():
                    res = f"I see a bottle with the label {bottle_text}. I'm not entirely sure of the contents, please be careful."
                else:
                    res = "I can see a bottle, but its label is not facing the camera or is too blurry to read."
            else:
                res = "I see a bottle, but my text reading module is not active."
        else:
            # For other objects, provide a general description
            res = f"I can see a {best_label} in the center of the frame. The object appears to be clearly visible."
    else:
        res = "I don't see any clear objects in view. Try moving the camera to capture an object and centering it."
        
    speak(res)
    with Session(engine) as session:
        log = ActivityLog(action="Object Identification", details=res)
        session.add(log)
        session.commit()
        
    return {"description": res}

@app.get("/status")
async def status():
    return {
        "status": "online", 
        "camera": "connected" if camera and camera.isOpened() else "disconnected",
        "ocr": "ready" if reader else "error",
        "speech": speech_settings,
        "model": "YOLOv8n"
    }

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: int):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if user:
            if user.username == "admin":
                return JSONResponse(status_code=400, content={"message": "Cannot delete primary admin"})
            session.delete(user)
            session.commit()
            return {"message": "User deleted"}
    return JSONResponse(status_code=404, content={"message": "User not found"})

@app.post("/admin/clear_logs")
async def clear_logs():
    with Session(engine) as session:
        session.exec(ActivityLog.__table__.delete())
        session.commit()
        return {"message": "Logs cleared"}

@app.post("/admin/update_dataset")
async def update_dataset(file: UploadFile = File(...)):
    # In a real app, we'd save this to a training folder
    os.makedirs("dataset_uploads", exist_ok=True)
    file_path = f"dataset_uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    with Session(engine) as session:
        log = ActivityLog(action="Dataset Update", details=f"New sample uploaded: {file.filename}")
        session.add(log)
        session.commit()
        
    return {"message": "Successfully uploaded sample for dataset improvement.", "filename": file.filename}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
