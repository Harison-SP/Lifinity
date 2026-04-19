import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.database import users_collection, refresh_tokens_collection
from app.models import (
    UserCreate, UserLogin, GoogleAuthRequest,
    UserResponse, TokenResponse, RefreshTokenRequest,
)
from app.auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    verify_token, get_current_user,
)

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ── helpers ─────────────────────────────────────────────────────────────────

def _user_response(user_doc: dict) -> UserResponse:
    return UserResponse(
        id=str(user_doc["_id"]),
        name=user_doc.get("name", ""),
        email=user_doc["email"],
        profile_picture=user_doc.get("profile_picture"),
        auth_provider=user_doc.get("auth_provider", "email"),
    )


def _issue_tokens(user_doc: dict) -> TokenResponse:
    user_id = str(user_doc["_id"])
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)

    # Persist refresh token
    refresh_tokens_collection.insert_one({
        "user_id": user_id,
        "token": refresh,
        "created_at": datetime.now(timezone.utc),
    })

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=_user_response(user_doc),
    )


# ── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate):
    # Check if email already exists
    existing = users_collection.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower().strip(),
        "password_hash": hash_password(payload.password),
        "auth_provider": "email",
        "profile_picture": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    return _issue_tokens(user_doc)


# ── Login ───────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = users_collection.find_one({"email": payload.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Google-only accounts don't have a password hash
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google sign-in. Please use Google to log in.",
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return _issue_tokens(user)


# ── Google OAuth ────────────────────────────────────────────────────────────

@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google authentication is not configured",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    email = idinfo.get("email", "").lower()
    name = idinfo.get("name", "")
    picture = idinfo.get("picture")

    # Find or create user
    user = users_collection.find_one({"email": email})
    if not user:
        user_doc = {
            "name": name,
            "email": email,
            "password_hash": None,
            "auth_provider": "google",
            "profile_picture": picture,
            "created_at": datetime.now(timezone.utc),
        }
        result = users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc
    else:
        # Update profile picture if changed
        updates = {}
        if picture and picture != user.get("profile_picture"):
            updates["profile_picture"] = picture
        if name and not user.get("name"):
            updates["name"] = name
        if updates:
            users_collection.update_one({"_id": user["_id"]}, {"$set": updates})
            user.update(updates)

    return _issue_tokens(user)


# ── Refresh Token ───────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest):
    # Verify the refresh token
    token_payload = verify_token(payload.refresh_token, expected_type="refresh")
    user_id = token_payload.get("sub")

    # Check it exists in DB (not revoked)
    stored = refresh_tokens_collection.find_one({
        "user_id": user_id,
        "token": payload.refresh_token,
    })
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or has been revoked",
        )

    # Delete old refresh token
    refresh_tokens_collection.delete_one({"_id": stored["_id"]})

    # Get user
    from bson import ObjectId
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return _issue_tokens(user)


# ── Get Current User ────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    from bson import ObjectId
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return _user_response(user)


# ── Logout ──────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(
    payload: RefreshTokenRequest,
    user_id: str = Depends(get_current_user),
):
    # Revoke refresh token
    refresh_tokens_collection.delete_many({
        "user_id": user_id,
        "token": payload.refresh_token,
    })
    return {"message": "Logged out successfully"}
