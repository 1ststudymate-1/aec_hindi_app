"""One-time Razorpay orders. Disabled unless explicitly enabled with all three secrets."""
import calendar
import hashlib
import hmac
import json
import os
import uuid
from datetime import timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo import ReturnDocument
from lib.db import db
from lib.access import aware, billing_mode, require_user, same_origin_write, user_view, utcnow
from models.access import AuthState, Message, OrderView, PaymentVerification, Plan

router = APIRouter(prefix="/billing", tags=["billing"])
AMOUNT = 34900


def configured():
    mode = billing_mode()
    if mode == "disabled":
        raise HTTPException(503, "भुगतान अभी बंद है। Razorpay की कुंजियाँ जुड़ने पर चालू होगा।")
    return mode


async def razorpay(method: str, path: str, payload=None):
    configured()
    try:
        async with httpx.AsyncClient(timeout=20, auth=(os.environ["RAZORPAY_KEY_ID"],
                                                     os.environ["RAZORPAY_KEY_SECRET"])) as client:
            response = await client.request(method, "https://api.razorpay.com/v1" + path, json=payload)
        if not response.is_success:
            raise HTTPException(502, "Razorpay ने अनुरोध पूरा नहीं किया। पैसे कटे हों तो स्थिति जाँचें।")
        return response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "भुगतान सेवा से संपर्क नहीं हुआ। दोबारा भुगतान से पहले स्थिति जाँचें।")


def six_months(start):
    month_index = start.year * 12 + start.month - 1 + 6
    year, month = divmod(month_index, 12)
    month += 1
    return start.replace(year=year, month=month,
                         day=min(start.day, calendar.monthrange(year, month)[1]))


async def grant(order: dict, payment: dict):
    if (payment.get("order_id") != order["order_id"] or payment.get("amount") != AMOUNT
            or payment.get("currency") != "INR" or payment.get("status") != "captured"
            or not payment.get("captured") or payment.get("amount_refunded", 0) != 0):
        raise HTTPException(409, "भुगतान अभी पुष्ट नहीं है; कुछ समय बाद स्थिति जाँचें।")
    if order["key_id"] != os.environ.get("RAZORPAY_KEY_ID"):
        raise HTTPException(409, "यह ऑर्डर पिछले भुगतान मोड का है। सहायता लें।")
    field = f"{order['mode']}_access_until"
    # Entitlement and replay marker are committed in ONE user-document update.
    # Retried callbacks/webhooks after a crash cannot extend this order twice.
    for _ in range(8):
        user = await db.users.find_one({"user_id": order["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(404, "भुगतान से जुड़ा खाता नहीं मिला।")
        if order["order_id"] in user.get("applied_orders", []):
            break
        previous = user.get(field)
        start = max(aware(previous), utcnow()) if previous else utcnow()
        updated = await db.users.find_one_and_update(
            {"user_id": user["user_id"], field: previous, "applied_orders": {"$ne": order["order_id"]}},
            {"$set": {field: six_months(start), f"{order['mode']}_last_payment_id": payment["id"]},
             "$addToSet": {"applied_orders": order["order_id"]}},
            return_document=ReturnDocument.AFTER, projection={"_id": 0},
        )
        if updated:
            user = updated
            break
    else:
        raise HTTPException(409, "पहुँच की पुष्टि जारी है। स्थिति फिर जाँचें।")
    await db.payment_orders.update_one({"order_id": order["order_id"]}, {"$set": {
        "status": "paid", "payment_id": payment["id"], "access_until": user[field]}})
    return AuthState(user=user_view(user))


@router.get("/plan", response_model=Plan)
async def plan():
    mode = billing_mode()
    return Plan(enabled=mode != "disabled", mode=mode)


@router.post("/orders", response_model=OrderView, dependencies=[Depends(same_origin_write)])
async def create_order(user=Depends(require_user)):
    mode = configured()
    if user_view(user).has_access:
        raise HTTPException(409, "आपका पैक सक्रिय है; अभी दोबारा भुगतान आवश्यक नहीं है।")
    key_id = os.environ["RAZORPAY_KEY_ID"]
    existing = await db.payment_orders.find_one({"user_id": user["user_id"], "status": "created",
        "key_id": key_id, "created_at": {"$gte": utcnow() - timedelta(minutes=30)}}, {"_id": 0})
    if existing:
        return OrderView(order_id=existing["order_id"], key_id=key_id, amount=AMOUNT, currency="INR", mode=mode)
    order = await razorpay("POST", "/orders", {"amount": AMOUNT, "currency": "INR",
        "receipt": "kiji_" + uuid.uuid4().hex, "partial_payment": False,
        "notes": {"user_id": user["user_id"], "plan": "hindi_6_months"}})
    if not order.get("id") or order.get("amount") != AMOUNT or order.get("currency") != "INR":
        raise HTTPException(502, "अमान्य भुगतान ऑर्डर।")
    await db.payment_orders.insert_one({"order_id": order["id"], "user_id": user["user_id"],
        "key_id": key_id, "mode": mode, "amount": AMOUNT, "currency": "INR",
        "status": "created", "created_at": utcnow()})
    return OrderView(order_id=order["id"], key_id=key_id, amount=AMOUNT, currency="INR", mode=mode)


@router.post("/verify", response_model=AuthState, dependencies=[Depends(same_origin_write)])
async def verify(body: PaymentVerification, user=Depends(require_user)):
    configured()
    order = await db.payment_orders.find_one({"order_id": body.razorpay_order_id,
                                               "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(404, "ऑर्डर नहीं मिला।")
    expected = hmac.new(os.environ["RAZORPAY_KEY_SECRET"].encode(),
        f"{order['order_id']}|{body.razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(400, "भुगतान हस्ताक्षर अमान्य है।")
    payment = await razorpay("GET", f"/payments/{body.razorpay_payment_id}")
    return await grant(order, payment)


@router.post("/reconcile", response_model=AuthState, dependencies=[Depends(same_origin_write)])
async def reconcile(user=Depends(require_user)):
    configured()
    # Recovers a captured payment even if the browser was closed before the callback.
    orders = await db.payment_orders.find({"user_id": user["user_id"], "status": "created",
        "key_id": os.environ["RAZORPAY_KEY_ID"]}, {"_id": 0}).sort("created_at", -1).to_list(10)
    for order in orders:
        payments = await razorpay("GET", f"/orders/{order['order_id']}/payments")
        for payment in payments.get("items", []):
            if payment.get("status") == "captured" and not payment.get("amount_refunded", 0):
                await grant(order, payment)
    current = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return AuthState(user=user_view(current))


@router.post("/webhook", response_model=Message)
async def webhook(request: Request):
    configured()
    raw = await request.body()
    if len(raw) > 262144:
        raise HTTPException(413, "Payload too large")
    expected = hmac.new(os.environ["RAZORPAY_WEBHOOK_SECRET"].encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.headers.get("x-razorpay-signature", "")):
        raise HTTPException(400, "Invalid webhook signature")
    try:
        event = json.loads(raw)
        if event.get("event") not in ("payment.captured", "order.paid", "payment.refunded"):
            return Message(message="Ignored")
        entity = event["payload"]["payment"]["entity"]
        order = await db.payment_orders.find_one({"order_id": entity["order_id"]}, {"_id": 0})
        if not order:
            return Message(message="Unrelated order")
        payment_id = entity["id"]
        if not isinstance(payment_id, str) or not payment_id.startswith("pay_") or not payment_id[4:].isalnum():
            raise ValueError("Invalid payment id")
    except (KeyError, TypeError, ValueError, AttributeError):
        raise HTTPException(400, "Invalid webhook payload")
    payment = await razorpay("GET", f"/payments/{payment_id}")
    if payment.get("amount_refunded", 0) > 0:
        # Refund processing is owned by Razorpay Dashboard; revoke the latest grant on confirmation.
        await db.users.update_one({"user_id": order["user_id"],
            f"{order['mode']}_last_payment_id": payment_id},
            {"$unset": {f"{order['mode']}_access_until": ""}})
        await db.payment_orders.update_one({"order_id": order["order_id"]}, {"$set": {"status": "refunded"}})
    else:
        await grant(order, payment)
    return Message(message="Processed")