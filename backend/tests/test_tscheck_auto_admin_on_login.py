"""Covers: kijitechnology@gmail.com (ADMIN_EMAIL) gets full access automatically the
moment its session exists -- GET /api/auth/me reports has_access=true/access_mode='admin'
with NO admin-unlock call, and GET /api/topics (paywalled) returns 200 directly.
Also covers that any OTHER email does NOT get this auto-admin treatment.

Per briefing seed_facts: the real production user doc for kijitechnology@gmail.com
already exists in db.users with is_admin=True (backfilled by main agent). This test
does NOT create or modify that user document -- it only inserts a fresh, temporary
db.user_sessions row pointing at that existing user_id (mirroring
backend/tests/access_fixtures.py), and cleans up ONLY the session doc afterward,
never the user doc.
"""
import os
import subprocess
import sys

import httpx
import pytest

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"
HEADERS = {"X-Requested-With": "Kiji-App"}
ADMIN_EMAIL = "kijitechnology@gmail.com"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def api_url(path: str = "") -> str:
    return f"{API_URL}{path}"


def _run(script: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-c", script], cwd=REPO_ROOT,
        capture_output=True, text=True, timeout=60,
    )


@pytest.fixture(scope="module")
def real_admin_session_cookie():
    """Fresh db.user_sessions row for the REAL, already-existing kijitechnology@gmail.com
    user (is_admin=True already backfilled). No user doc is created or altered."""
    tag = "tscheck-auto-admin-login-session"
    script = f"""
import asyncio, secrets, sys
sys.path.insert(0, {REPO_ROOT!r})
from lib.db import db, ensure_indexes
from lib.access import token_hash, utcnow
from datetime import timedelta

async def main():
    await ensure_indexes()
    user = await db.users.find_one({{"email": {ADMIN_EMAIL!r}}})
    assert user is not None, "expected pre-existing real admin user to already exist in db.users"
    assert user.get("is_admin") is True, "expected real admin user to already have is_admin=True"
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({{"user_id": user["user_id"], "token_hash": token_hash(token),
        "expires_at": utcnow() + timedelta(days=1), "test_fixture": {tag!r}}})
    print(token)

asyncio.run(main())
"""
    result = _run(script)
    assert result.returncode == 0, f"session fixture setup failed: {result.stderr}"
    token = result.stdout.strip().splitlines()[-1]
    yield token
    cleanup = f"""
import asyncio, sys
sys.path.insert(0, {REPO_ROOT!r})
from lib.db import db

async def main():
    await db.user_sessions.delete_many({{"test_fixture": {tag!r}}})

asyncio.run(main())
"""
    _run(cleanup)


@pytest.fixture(scope="module")
def non_admin_cookie():
    """Fixture kind=unpaid via tests/access_fixtures.py -- must NOT be treated as admin."""
    result = subprocess.run(
        [sys.executable, "-m", "tests.access_fixtures"], cwd=REPO_ROOT,
        capture_output=True, text=True, timeout=60,
    )
    assert result.returncode == 0, f"fixture script failed: {result.stderr}"
    import json
    data = json.loads(result.stdout.strip().splitlines()[-1])
    yield data["unpaid"]["cookie"]
    subprocess.run(
        [sys.executable, "-m", "tests.access_fixtures", "--cleanup"], cwd=REPO_ROOT,
        capture_output=True, text=True, timeout=60,
    )


def test_admin_email_gets_auto_admin_on_session_with_no_unlock_call(real_admin_session_cookie):
    """Criterion 1: kijitechnology@gmail.com session -> /auth/me already has_access=true,
    access_mode='admin' with NO admin-unlock call, and /topics (paywalled) returns 200."""
    me_resp = httpx.get(api_url("/auth/me"), cookies={"session_token": real_admin_session_cookie}, timeout=30)
    assert me_resp.status_code == 200, f"expected 200, got {me_resp.status_code}: {me_resp.text}"
    user = me_resp.json().get("user")
    assert user is not None, f"expected logged-in user, got: {me_resp.text}"
    assert user["has_access"] is True, me_resp.text
    assert user["access_mode"] == "admin", me_resp.text

    topics_resp = httpx.get(api_url("/topics"), cookies={"session_token": real_admin_session_cookie}, timeout=30)
    assert topics_resp.status_code == 200, f"paywall not bypassed: {topics_resp.status_code} {topics_resp.text}"


def test_non_admin_email_does_not_get_auto_admin(non_admin_cookie):
    """Criterion 2: a different email (kiji.fixture.unpaid@example.com) must NOT get
    auto-admin -- /auth/me has_access=false/access_mode=null, and /topics -> 403."""
    me_resp = httpx.get(api_url("/auth/me"), cookies={"session_token": non_admin_cookie}, timeout=30)
    assert me_resp.status_code == 200, f"expected 200, got {me_resp.status_code}: {me_resp.text}"
    user = me_resp.json().get("user")
    assert user is not None, f"expected logged-in user, got: {me_resp.text}"
    assert user["has_access"] is False, me_resp.text
    assert user["access_mode"] is None, me_resp.text

    topics_resp = httpx.get(api_url("/topics"), cookies={"session_token": non_admin_cookie}, timeout=30)
    assert topics_resp.status_code == 403, f"expected 403, got {topics_resp.status_code}: {topics_resp.text}"
