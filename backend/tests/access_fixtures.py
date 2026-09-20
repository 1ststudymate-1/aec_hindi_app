"""Temporary synthetic authentication fixtures, never a login/payment endpoint.
Run from backend: python -m tests.access_fixtures (or PYTHONPATH=. python tests/access_fixtures.py).
Remove fixtures after verification with the --cleanup flag. No real Google identity is impersonated.
"""
import asyncio
import json
import secrets
import sys
from datetime import timedelta
from lib.db import db, ensure_indexes
from lib.access import token_hash, utcnow


async def main():
    if "--cleanup" in sys.argv:
        await db.users.delete_many({"test_fixture": "kiji-access"})
        await db.user_sessions.delete_many({"test_fixture": "kiji-access"})
        print("Removed kiji-access test identities and sessions")
        return
    await ensure_indexes()
    result = {}
    for kind in ["paid", "unpaid", "expired"]:
        user_id = "kiji-fixture-" + kind
        user = {"user_id": user_id, "email": f"kiji.fixture.{kind}@example.com", "name": "परीक्षण विद्यार्थी",
                "picture": "", "test_fixture": "kiji-access", "created_at": utcnow()}
        if kind in ("paid", "expired"):
            user["live_access_until"] = utcnow() + timedelta(days=1 if kind == "paid" else -1)
        await db.users.replace_one({"user_id": user_id}, user, upsert=True)
        token = secrets.token_urlsafe(32)
        await db.user_sessions.insert_one({"user_id": user_id, "token_hash": token_hash(token),
            "expires_at": utcnow() + timedelta(days=1), "test_fixture": "kiji-access"})
        result[kind] = {"user_id": user_id, "cookie": token}
    print(json.dumps(result))


if __name__ == "__main__":
    asyncio.run(main())