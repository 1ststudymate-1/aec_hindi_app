"""Opaque cookie sessions and server-enforced, time-limited study access."""
import hashlib
import os
from datetime import datetime, timezone
from urllib.parse import urlsplit
from fastapi import Depends, HTTPException, Request
from lib.db import db
from models.access import UserView


def utcnow():
    return datetime.now(timezone.utc)


def aware(value):
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def token_hash(token: str):
    return hashlib.sha256(token.encode()).hexdigest()


def billing_mode():
    key = os.environ.get("RAZORPAY_KEY_ID", "")
    if (os.environ.get("RAZORPAY_ENABLED", "false").lower() != "true"
            or not os.environ.get("RAZORPAY_KEY_SECRET")
            or not os.environ.get("RAZORPAY_WEBHOOK_SECRET")):
        return "disabled"
    if key.startswith("rzp_live_"):
        return "live"
    if key.startswith("rzp_test_"):
        return "test"
    return "disabled"


def user_view(user: dict) -> UserView:
    if user.get("is_admin"):
        return UserView(user_id=user["user_id"], name=user["name"], email=user["email"],
                        picture=user.get("picture", ""), access_until=None,
                        has_access=True, access_mode="admin")
    expiry = user.get("live_access_until")
    mode = "live" if expiry else None
    if (not expiry or aware(expiry) <= utcnow()) and billing_mode() == "test":
        if user.get("test_access_until"):
            expiry, mode = user["test_access_until"], "test"
    expiry = aware(expiry) if expiry else None
    return UserView(user_id=user["user_id"], name=user["name"], email=user["email"],
                    picture=user.get("picture", ""), access_until=expiry,
                    has_access=bool(expiry and expiry > utcnow()), access_mode=mode)


async def optional_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        return None
    session = await db.user_sessions.find_one({"token_hash": token_hash(token)}, {"_id": 0})
    if not session or aware(session["expires_at"]) <= utcnow():
        return None
    return await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})


async def require_user(user=Depends(optional_user)):
    if not user:
        raise HTTPException(401, "पहले Google से लॉगिन करें।")
    return user


async def require_paid(user=Depends(require_user)):
    if not user_view(user).has_access:
        raise HTTPException(403, "अध्ययन के लिए ₹349 का 6 महीने का पैक आवश्यक है।")
    return user


async def same_origin_write(request: Request):
    # A non-simple custom header plus an Origin check prevents cross-site cookie writes.
    if request.headers.get("x-requested-with") != "Kiji-App":
        raise HTTPException(403, "अमान्य अनुरोध।")
    origin = request.headers.get("origin")
    if origin and urlsplit(origin).netloc != request.headers.get("host"):
        raise HTTPException(403, "अमान्य अनुरोध स्रोत।")
    if request.headers.get("sec-fetch-site") == "cross-site":
        raise HTTPException(403, "अमान्य अनुरोध स्रोत।")