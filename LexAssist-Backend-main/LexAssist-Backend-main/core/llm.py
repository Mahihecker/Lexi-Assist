# backend/core/llm.py
import httpx
from typing import List

from core.config import settings

OLLAMA_API_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3.2"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"  # Fast, free tier on Groq

SYSTEM_PROMPT = """You are LexAssist, a helpful AI legal assistant focused on Pakistani law. You answer legal questions clearly and in plain language. You can discuss Pakistani legislation, courts, procedures, and general legal concepts. When unsure, say so and suggest consulting a lawyer. Keep answers structured and practical."""


async def get_ollama_response(history: List[dict]) -> str:
    """
    Uses Groq cloud API if GROQ_API_KEY is set (for deployment). Otherwise uses local Ollama.
    Same system prompt for both so you don't need your laptop running 24/7 when deployed.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    if settings.GROQ_API_KEY:
        return await _call_groq(messages)
    return await _call_ollama(messages)


async def _call_groq(messages: List[dict]) -> str:
    """Call Groq cloud API (used when deployed; no local Ollama needed)."""
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": 2048,
        "temperature": 0.3,
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            )
            response.raise_for_status()
            data = response.json()
            return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
    except httpx.RequestError as e:
        print(f"Error calling Groq: {e}")
        return "Sorry, I am currently unable to connect to the AI service."
    except Exception as e:
        print(f"Unexpected error (Groq): {e}")
        return "An unexpected error occurred while generating a response."


async def _call_ollama(messages: List[dict]) -> str:
    """Call local Ollama (for development / when running on your laptop)."""
    payload = {"model": OLLAMA_MODEL, "messages": messages, "stream": False}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OLLAMA_API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            return (data.get("message", {}).get("content") or "").strip()
    except httpx.RequestError as e:
        print(f"Error connecting to Ollama: {e}")
        return "Sorry, I am currently unable to connect to the AI model."
    except Exception as e:
        print(f"Unexpected error (Ollama): {e}")
        return "An unexpected error occurred while generating a response."