"""Local logic tests, not a simulated Razorpay checkout or real payment proof."""
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import pytest
from fastapi import HTTPException
from lib.access import user_view, utcnow
from routers.billing import six_months, grant
from lib.db import db


def test_calendar_months():
    assert six_months(datetime(2026, 8, 31, 12, tzinfo=timezone.utc)) == datetime(2027, 2, 28, 12, tzinfo=timezone.utc)
    assert six_months(datetime(2023, 8, 31, tzinfo=timezone.utc)) == datetime(2024, 2, 29, tzinfo=timezone.utc)


def test_entitlement_expiry_and_mode():
    user = {"user_id": "unit-test", "name": "Unit test", "email": "unit@example.com"}
    assert not user_view(user).has_access
    user["live_access_until"] = utcnow() - timedelta(seconds=1)
    assert not user_view(user).has_access
    user["test_access_until"] = utcnow() + timedelta(days=1)
    with patch.dict("os.environ", {"RAZORPAY_ENABLED": "false"}):
        assert not user_view(user).has_access
    user["live_access_until"] = utcnow() + timedelta(days=1)
    assert user_view(user).has_access


@pytest.mark.asyncio
async def test_grant_is_idempotent_and_refuses_wrong_amount():
    uid = "kiji-fixture-grant-unit"
    await db.users.replace_one({"user_id": uid}, {"user_id": uid, "email": "grant.unit@example.com",
        "name": "Synthetic unit test", "test_fixture": "kiji-access"}, upsert=True)
    order = {"order_id": "order_unittest", "user_id": uid, "key_id": "unit-test-key-not-a-provider-key", "mode": "test"}
    payment = {"id": "pay_unittest", "order_id": order["order_id"], "amount": 34900,
               "currency": "INR", "status": "captured", "captured": True, "amount_refunded": 0}
    try:
        with patch.dict("os.environ", {"RAZORPAY_KEY_ID": order["key_id"]}):
            for invalid in [{"amount": 1}, {"currency": "USD"}, {"status": "authorized"}, {"order_id": "order_other"}, {"amount_refunded": 34900}]:
                with pytest.raises(HTTPException):
                    await grant(order, {**payment, **invalid})
            await grant(order, payment)
            first = await db.users.find_one({"user_id": uid})
            await grant(order, payment)
            second = await db.users.find_one({"user_id": uid})
            assert first["test_access_until"] == second["test_access_until"]
            assert second["applied_orders"] == [order["order_id"]]
            assert not second.get("live_access_until")
    finally:
        await db.users.delete_one({"user_id": uid})