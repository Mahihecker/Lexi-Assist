# backend/models/chat.py
from pydantic import BaseModel, Field
from typing import Literal, List
from datetime import datetime
import uuid

class ChatMessage(BaseModel):
    """
    Represents a single message in a chat conversation.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatConversation(BaseModel):
    """
    Represents an entire chat conversation.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: str  # Firebase UID
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Allows using 'id' as the field name but storing it as '_id' in MongoDB
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "FIREBASE_UID_HERE",
                "messages": [
                    {
                        "id": "a1b2c3d4...",
                        "role": "user",
                        "content": "What is a writ petition?",
                        "timestamp": "2025-10-10T12:00:00Z"
                    }
                ],
                "created_at": "2025-10-10T11:59:59Z"
            }
        }