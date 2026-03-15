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

# Allow all Vercel deployment URLs (*.vercel.app) for preview/production
allow_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)   

app.include_router(chat.router)
app.include_router(document.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the LexAssist API!"}

# We will add our chat router here later
# from routers import chat
# app.include_router(chat.router)