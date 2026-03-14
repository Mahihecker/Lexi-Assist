# backend/main.py
import json
from fastapi import FastAPI
import firebase_admin
from firebase_admin import credentials
from core.config import settings
from routers import chat
from fastapi.middleware.cors import CORSMiddleware
from routers import document

# --- Firebase Admin SDK Initialization ---
try:
    if settings.FIREBASE_CREDENTIALS_JSON:
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
    elif settings.FIREBASE_CREDENTIALS_PATH:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    else:
        raise ValueError("Set either FIREBASE_CREDENTIALS_PATH (local) or FIREBASE_CREDENTIALS_JSON (deployment).")
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
# -----------------------------------------

app = FastAPI(
    title="LexAssist API",
    description="API for the AI-powered LexAssist Legal Assistant",
    version="0.1.0"
)

origins = ["http://localhost:3000"]
if settings.CORS_ORIGINS_EXTRA:
    origins += [o.strip() for o in settings.CORS_ORIGINS_EXTRA.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Specifies which origins are allowed
    allow_credentials=True,      # Allows cookies and auth headers
    allow_methods=["*"],         # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],         # Allows all headers
)   

app.include_router(chat.router)
app.include_router(document.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the LexAssist API!"}

# We will add our chat router here later
# from routers import chat
# app.include_router(chat.router)