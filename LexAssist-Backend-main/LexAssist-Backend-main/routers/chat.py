# backend/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, Response
from typing import List
import uuid
from datetime import datetime

# Import our security dependency, models, and database collection
from core.security import get_current_user
from models.chat import ChatConversation, ChatMessage
from core.database import conversation_collection
from core.llm import get_ollama_response


router = APIRouter(
    prefix="/api/v1",
    tags=["Chat"]
)

@router.get("/users/me")
def read_current_user(user: dict = Depends(get_current_user)):
    """ A protected endpoint to get the current user's details. """
    return {"uid": user.get("uid"), "email": user.get("email")}


@router.get("/chats", response_model=List[ChatConversation])
async def get_user_conversations(user: dict = Depends(get_current_user)):
    """
    Retrieve all conversations for the currently authenticated user.
    """
    user_id = user["uid"]
    conversations_cursor = conversation_collection.find({"user_id": user_id})
    conversations = await conversations_cursor.to_list(length=100)
    return conversations


@router.post("/chats", response_model=ChatConversation, status_code=status.HTTP_201_CREATED)
async def create_new_conversation(user: dict = Depends(get_current_user)):
    """
    Create a new, empty chat conversation for the user.
    """
    user_id = user["uid"]
    new_conversation_data = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "messages": [],
        "created_at": datetime.utcnow()
    }
    await conversation_collection.insert_one(new_conversation_data)
    return ChatConversation(**new_conversation_data)

# --- ADD THIS NEW FUNCTION TO THE FILE ---
@router.delete("/chats/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Delete a specific conversation belonging to the authenticated user.
    """
    user_id = user["uid"]

    # The delete_one operation will find a document that matches BOTH the
    # conversation ID and the user ID. This is a crucial security check.
    delete_result = await conversation_collection.delete_one(
        {"_id": conversation_id, "user_id": user_id}
    )

    # If deleted_count is 0, it means no document was found that matched
    # BOTH the ID and the user. This could be because the chat doesn't exist,
    # or the user is trying to delete someone else's chat.
    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or you do not have permission to delete it."
        )

    # A 204 No Content response means the operation was successful, and
    # we don't need to send any data back in the response body.
    return


# --- THIS IS THE ONLY FUNCTION THAT HAS BEEN REPLACED ---
# @router.post("/chats/{conversation_id}/messages")
# async def add_message_to_conversation(
#     conversation_id: str,
#     message_content: str = Body(..., embed=True),
#     user: dict = Depends(get_current_user)
# ):
#     """
#     Adds a new user message to a conversation, sends the full history to the LLM,
#     and saves both the new message and the bot's response.
#     """
#     user_id = user["uid"]

#     # 1. Fetch the existing conversation from MongoDB
#     # This also ensures the user owns this conversation
#     conversation = await conversation_collection.find_one(
#         {"_id": conversation_id, "user_id": user_id}
#     )

#     if not conversation:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Conversation not found or you do not have permission to access it."
#         )

#     # 2. Prepare the full history for the LLM
#     # We need to send only the 'role' and 'content' for each message
#     history_for_llm = [
#         {"role": msg["role"], "content": msg["content"]} for msg in conversation.get("messages", [])
#     ]
    
#     # Add the new user message to the history we're sending to the LLM
#     history_for_llm.append({"role": "user", "content": message_content})

#     # 3. Get a contextual response from Ollama using the full history
#     # This now calls the updated llm.py which expects a list of messages
#     bot_response_content = await get_ollama_response(history_for_llm)

#     # 4. Create the message objects to be saved in the database
#     # We create Pydantic models here to ensure our data has IDs and timestamps
#     user_message = ChatMessage(role="user", content=message_content)
#     bot_message = ChatMessage(role="assistant", content=bot_response_content)

#     # 5. Add both the new user message and the bot's response to the conversation in the database
#     await conversation_collection.update_one(
#         {"_id": conversation_id},
#         {"$push": {"messages": {"$each": [user_message.model_dump(), bot_message.model_dump()]}}}
#     )

#     # 6. Return the bot's new message to the frontend
#     return bot_message

@router.post("/chats/{conversation_id}/summarize")
async def summarize_conversation(
    conversation_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Retrieves a conversation's history and uses the LLM to generate a summary.
    """
    user_id = user["uid"]

    # 1. Fetch the conversation securely
    conversation = await conversation_collection.find_one(
        {"_id": conversation_id, "user_id": user_id}
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or you do not have permission to access it."
        )

    # 2. Prepare the history for summarization
    history_for_llm = [
        {"role": msg["role"], "content": msg["content"]} for msg in conversation.get("messages", [])
    ]
    
    # Check if there's anything to summarize
    if len(history_for_llm) < 2: # Need at least one user and one assistant message
        return {"summary": "This conversation is too short to summarize."}

    # 3. Create a specific prompt for the summarization task
    # We prepend this to the history to guide the LLM.
    summarization_prompt = {
        "role": "user",
        "content": "Please provide a concise summary of the key points and legal topics discussed in the above conversation. Format the summary with a title and bullet points."
    }
    history_for_llm.append(summarization_prompt)

    # 4. Get the summary from the LLM
    summary_text = await get_ollama_response(history_for_llm)

    # 5. Return the summary
    return {"summary": summary_text}

@router.post("/chats/{conversation_id}/messages")
async def add_message_to_conversation(
    conversation_id: str,
    # The request body can now optionally include a "role"
    payload: dict = Body(...), # Expect a dictionary now
    user: dict = Depends(get_current_user)
):
    """
    Adds a new message to a conversation. If the role is 'user', it gets a bot response.
    If the role is 'system', it just saves the context.
    """
    user_id = user["uid"]
    
    # Extract data from the payload, defaulting role to 'user'
    message_content = payload.get("message_content")
    message_role = payload.get("role", "user")

    if not message_content:
        raise HTTPException(status_code=400, detail="message_content cannot be empty")

    # --- LOGIC FOR HANDLING SYSTEM VS USER ROLES ---
    if message_role == "system":
        # If it's a system message, just save it and we are done.
        system_message = ChatMessage(role="system", content=message_content)
        await conversation_collection.update_one(
            {"_id": conversation_id, "user_id": user_id},
            {"$push": {"messages": system_message.model_dump()}}
        )
        # Return an empty 204 response as no bot reply is needed.
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    # --- The rest of the logic is for a normal 'user' message ---
    conversation = await conversation_collection.find_one(
        {"_id": conversation_id, "user_id": user_id}
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    history_for_llm = [
        {"role": msg["role"], "content": msg["content"]} for msg in conversation.get("messages", [])
    ]
    history_for_llm.append({"role": "user", "content": message_content})

    bot_response_content = await get_ollama_response(history_for_llm)

    user_message = ChatMessage(role="user", content=message_content)
    bot_message = ChatMessage(role="assistant", content=bot_response_content)

    await conversation_collection.update_one(
        {"_id": conversation_id},
        {"$push": {"messages": {"$each": [user_message.model_dump(), bot_message.model_dump()]}}}
    )

    return bot_message