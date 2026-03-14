# backend/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    MONGO_URI: str
    # Local: path to service account JSON file. Deployment: use FIREBASE_CREDENTIALS_JSON instead.
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    # Optional: paste entire Firebase service account JSON as one string (for Railway/Render etc.)
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None

    # Optional: for deployed app (no local Ollama). If set, backend uses Groq cloud API.
    GROQ_API_KEY: Optional[str] = None  # Get free key at https://console.groq.com

    # Optional: extra CORS origins for deployment, e.g. "https://lexassist.vercel.app"
    CORS_ORIGINS_EXTRA: Optional[str] = None  # Comma-separated if multiple

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()