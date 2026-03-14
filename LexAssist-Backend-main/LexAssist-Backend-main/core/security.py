# backend/core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

# This scheme will look for an "Authorization" header with a "Bearer" token.
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    A dependency that verifies the Firebase ID token from the Authorization header.

    - If the token is valid, it returns the decoded token (payload).
    - If the token is invalid, expired, or not present, it raises an HTTPException.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token not provided",
        )
    try:
        # The token is in credentials.credentials
        id_token = credentials.credentials
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        # This will catch expired tokens, invalid tokens, etc.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )