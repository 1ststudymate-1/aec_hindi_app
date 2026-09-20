import os
import secrets
import uuid
from datetime import timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from lib.db import db
from lib.access import optional_user, require_user, same_origin_write, token_hash, user_view, utcnow
from models.access import AdminUnlock, AuthState, Message, SessionExchange

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthState)
async def me(response: Response, user=Depends(optional_user)):
    response.headers["Cache-Control"] = "no-store"
    return AuthState(user=user_view(user) if user else None)


@router.post("/session", response_model=AuthState, dependencies=[Depends(same_origin_write)])
async def exchange(body: SessionExchange, request: Request, response: Response):
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            result = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": body.session_id},
            )
        if result.status_code != 200:
            raise HTTPException(401, "Google लॉगिन की पुष्टि नहीं हुई। कृपया फिर लॉगिन करें।")
        identity = result.json()
        email = identity.get("email", "").strip().lower()
        if not email or "@" not in email or not identity.get("session_token"):
            raise HTTPException(401, "अमान्य Google सत्र।")
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "लॉगिन सेवा से संपर्क नहीं हो सका। फिर प्रयास करें।")

    # Consume each temporary exchange once, including across concurrent requests.
    from pymongo.errors import DuplicateKeyError
    from pymongo import ReturnDocument
    try:
        await db.auth_exchanges.insert_one({"exchange_hash": token_hash(body.session_id),
                                           "expires_at": utcnow() + timedelta(days=1)})
    except DuplicateKeyError:
        raise HTTPException(401, "इस लॉगिन लिंक का उपयोग हो चुका है। दोबारा Google लॉगिन करें।")
    profile = {"name": identity.get("name") or email.split("@")[0],
               "picture": identity.get("picture") or ""}
    try:
        user = await db.users.find_one_and_update(
            {"email": email}, {"$set": profile, "$setOnInsert": {
                "user_id": str(uuid.uuid4()), "email": email, "created_at": utcnow()}},
            upsert=True, return_document=ReturnDocument.AFTER, projection={"_id": 0},
        )
    except DuplicateKeyError:
        user = await db.users.find_one({"email": email}, {"_id": 0})
    old = request.cookies.get("session_token")
    if old:
        await db.user_sessions.delete_one({"token_hash": token_hash(old)})
    token = secrets.token_urlsafe(48)
    await db.user_sessions.insert_one({"token_hash": token_hash(token), "user_id": user["user_id"],
                                       "expires_at": utcnow() + timedelta(days=7)})
    response.set_cookie("session_token", token, httponly=True, secure=True,
                        samesite="none", max_age=7 * 86400, path="/")
    response.headers["Cache-Control"] = "no-store"
    return AuthState(user=user_view(user))


@router.post("/admin-unlock", response_model=AuthState, dependencies=[Depends(same_origin_write)])
async def admin_unlock(body: AdminUnlock, user=Depends(require_user)):
    from pymongo import ReturnDocument
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    expected = os.environ.get("ADMIN_UNLOCK_PASSWORD", "")
    if not admin_email or user["email"].strip().lower() != admin_email:
        raise HTTPException(403, "यह सुविधा केवल एडमिन खाते (admin@kiji.com) के लिए है। उस Google खाते से लॉगिन करें।")
    if not expected or not secrets.compare_digest(body.password, expected):
        raise HTTPException(403, "गलत एडमिन पासवर्ड।")
    updated = await db.users.find_one_and_update(
        {"user_id": user["user_id"]}, {"$set": {"is_admin": True}},
        return_document=ReturnDocument.AFTER, projection={"_id": 0},
    )
    return AuthState(user=user_view(updated))


@router.post("/logout", response_model=Message, dependencies=[Depends(same_origin_write)])
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"token_hash": token_hash(token)})
    response.delete_cookie("session_token", path="/", secure=True, httponly=True, samesite="none")
    return Message(message="लॉगआउट हो गया।")