"""Covers: admin-unlock restricted to ADMIN_EMAIL, wrong password rejected for admin,
correct password grants admin access_mode and bypasses the paywall on /topics.

Uses synthetic fixtures only (no real Google OAuth) per briefing's spec_deviations.
Creates its own temporary admin@kiji.com user+session (tscheck- prefixed ids) and
cleans them up in a finally block; also uses access_fixtures' non-admin fixture emails
for the negative-account test.
"""
import os
import secrets
import subprocess
import sys
from datetime import timedelta

import httpx
import pytest

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"


def api_url(path: str = "") -> str:
    return f"{API_URL}{path}"


HEADERS = {"X-Requested-With": "Kiji-App"}
ADMIN_PASSWORD = "1356@Ram"


def _run_fixture_script(args):
    result = subprocess.run(
        [sys.executable, "-m", "tests.access_fixtures", *args],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        capture_output=True, text=True, timeout=60,
    )
    return result


@pytest.fixture(scope="module")
def non_admin_cookie():
    """A logged-in session whose email is NOT admin@kiji.com (fixture kind=unpaid)."""
    result = _run_fixture_script([])
    assert result.returncode == 0, f"fixture script failed: {result.stderr}"
    import json
    data = json.loads(result.stdout.strip().splitlines()[-1])
    yield data["unpaid"]["cookie"]
    _run_fixture_script(["--cleanup"])


@pytest.fixture(scope="module")
def admin_cookie():
    """Temporary admin@kiji.com user + session created directly via lib.db, mirroring
    access_fixtures.py's pattern. Cleaned up after the module's tests finish."""
    script = f"""
import asyncio, secrets, sys
from datetime import timedelta
sys.path.insert(0, {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))!r})
from lib.db import db, ensure_indexes
from lib.access import token_hash, utcnow

async def main():
    await ensure_indexes()
    user_id = "tscheck-admin-unlock-user"
    user = {{"user_id": user_id, "email": "admin@kiji.com", "name": "TSCheck Admin",
            "picture": "", "test_fixture": "tscheck-admin-unlock", "created_at": utcnow()}}
    await db.users.replace_one({{"user_id": user_id}}, user, upsert=True)
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({{"user_id": user_id, "token_hash": token_hash(token),
        "expires_at": utcnow() + timedelta(days=1), "test_fixture": "tscheck-admin-unlock"}})
    print(token)

asyncio.run(main())
"""
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        capture_output=True, text=True, timeout=60,
    )
    assert result.returncode == 0, f"admin fixture setup failed: {result.stderr}"
    token = result.stdout.strip().splitlines()[-1]
    yield token

    cleanup_script = f"""
import asyncio, sys
sys.path.insert(0, {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))!r})
from lib.db import db

async def main():
    await db.users.delete_many({{"test_fixture": "tscheck-admin-unlock"}})
    await db.user_sessions.delete_many({{"test_fixture": "tscheck-admin-unlock"}})

asyncio.run(main())
"""
    subprocess.run([sys.executable, "-c", cleanup_script],
                    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    capture_output=True, text=True, timeout=60)


def test_non_admin_account_rejected_even_with_correct_password(non_admin_cookie):
    """Criterion 1: logged-in non-admin email + correct password -> 403, admin-only message."""
    resp = httpx.post(
        api_url("/auth/admin-unlock"),
        json={"password": ADMIN_PASSWORD},
        cookies={"session_token": non_admin_cookie},
        headers=HEADERS,
        timeout=30,
    )
    assert resp.status_code == 403, f"expected 403, got {resp.status_code}: {resp.text}"
    detail = resp.json().get("detail", "")
    assert "admin@kiji.com" in detail, f"error should mention admin@kiji.com, got: {detail}"


def test_admin_account_wrong_password_rejected(admin_cookie):
    """Criterion 2: admin@kiji.com session + wrong password -> 403 with specific Hindi message."""
    resp = httpx.post(
        api_url("/auth/admin-unlock"),
        json={"password": "not-the-real-password"},
        cookies={"session_token": admin_cookie},
        headers=HEADERS,
        timeout=30,
    )
    assert resp.status_code == 403, f"expected 403, got {resp.status_code}: {resp.text}"
    assert resp.json().get("detail") == "गलत एडमिन पासवर्ड।", resp.text


def test_admin_account_correct_password_grants_unlimited_access(admin_cookie):
    """Criterion 3: admin@kiji.com session + correct password -> 200, has_access=True,
    access_mode=admin, and the paywalled /topics endpoint becomes reachable."""
    resp = httpx.post(
        api_url("/auth/admin-unlock"),
        json={"password": ADMIN_PASSWORD},
        cookies={"session_token": admin_cookie},
        headers=HEADERS,
        timeout=30,
    )
    assert resp.status_code == 200, f"expected 200, got {resp.status_code}: {resp.text}"
    user = resp.json()["user"]
    assert user["has_access"] is True, resp.text
    assert user["access_mode"] == "admin", resp.text

    topics_resp = httpx.get(api_url("/topics"), cookies={"session_token": admin_cookie}, timeout=30)
    assert topics_resp.status_code == 200, f"paywall not bypassed: {topics_resp.status_code} {topics_resp.text}"
