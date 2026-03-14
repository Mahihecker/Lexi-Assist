# backend/core/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# Create a client instance
client = AsyncIOMotorClient(settings.MONGO_URI)

# Get a reference to the database.
# The database will be created if it doesn't exist when you first write data.
# You can name it whatever you like, e.g., "lawbot_db"
database = client.lawbot_db

# Get a reference to the "conversations" collection within the database.
# Collections are like tables in SQL.
conversation_collection = database.get_collection("conversations")