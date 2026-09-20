"""Covers: admin-unlock restricted to ADMIN_EMAIL (kijitechnology@gmail.com), wrong
password rejected for admin, correct password grants admin access_mode and bypasses
the paywall on /topics. Also covers that the OLD admin email admin@kiji.com is no
longer treated as admin.

Uses synthetic fixtures only (no real Google OAuth) per briefing's spec_deviations.
Creates its own temporary kijitechnology@gmail.com and admin@kiji.com users+sessions
(tscheck- prefixed ids) and cleans them up in a finally block.
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
NEW_ADMIN_EMAIL = "kijitechnology@gmail.com"
OLD_ADMIN_EMAIL = "admin@kiji.com"


def _run_fixture_script(args):
    result = subprocess.run(
        [sys.executable, "-m", "tests.access_fixtures", *args],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        capture_output=True, text=True, timeout=60,
    )
    return result


def _make_session(email: str, fixture_tag: str):
    """Create a temporary user+session for `email`, tagged with `fixture_tag` for cleanup."""
    script = f"""
import asyncio, secrets, sys
from datetime import timedelta
sys.path.insert(0, {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))!r})
from lib.db import db, ensure_indexes
from lib.access import token_hash, utcnow

async def main():
    await ensure_indexes()
    user_id = {fixture_tag!r} + "-user"
    user = {{"user_id": user_id, "email": {email!r}, "name": "TSCheck Admin",
            "picture": "", "test_fixture": {fixture_tag!r}, "created_at": utcnow()}}
    await db.users.replace_one({{"user_id": user_id}}, user, upsert=True)
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({{"user_id": user_id, "token_hash": token_hash(token),
        "expires_at": utcnow() + timedelta(days=1), "test_fixture": {fixture_tag!r}}})
    print(token)

asyncio.run(main())
"""
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        capture_output=True, text=True, timeout=60,
    )
    assert result.returncode == 0, f"fixture setup failed for {email}: {result.stderr}"
    return result.stdout.strip().splitlines()[-1]


def _cleanup_fixture(fixture_tag: str):
    cleanup_script = f"""
import asyncio, sys
sys.path.insert(0, {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))!r})
from lib.db import db

async def main():
    await db.users.delete_many({{"test_fixture": {fixture_tag!r}}})
    await db.user_sessions.delete_many({{"test_fixture": {fixture_tag!r}}})

asyncio.run(main())
"""
    subprocess.run([sys.executable, "-c", cleanup_script],
                    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    capture_output=True, text=True, timeout=60)


@pytest.fixture(scope="module")
def non_admin_cookie():
    """A logged-in session whose email is NOT the admin email (fixture kind=unpaid)."""
    result = _run_fixture_script([])
    assert result.returncode == 0, f"fixture script failed: {result.stderr}"
    import json
    data = json.loads(result.stdout.strip().splitlines()[-1])
    yield data["unpaid"]["cookie"]
    _run_fixture_script(["--cleanup"])


@pytest.fixture(scope="module")
def old_admin_email_cookie():
    """Temporary admin@kiji.com (OLD admin email) session -- must no longer be admin."""
    tag = "tscheck-admin-unlock-old"
    token = _make_session(OLD_ADMIN_EMAIL, tag)
    yield token
    _cleanup_fixture(tag)


def _make_session_for_existing_user(email: str, fixture_tag: str):
    """Attach a fresh, temporary session to a user that ALREADY exists (real production
    admin account) without touching/duplicating the user document (email is unique)."""
    script = f"""
import asyncio, secrets, sys
sys.path.insert(0, {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))!r})
from lib.db import db, ensure_indexes
from lib.access import token_hash, utcnow
from datetime import timedelta

async def main():
    await ensure_indexes()
    user = await db.users.find_one({{"email": {email!r}}})
    assert user is not None, "expected pre-existing real admin user to already exist"
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({{"user_id": user["user_id"], "token_hash": token_hash(token),
        "expires_at": utcnow() + timedelta(days=1), "test_fixture": {fixture_tag!r}}})
    print(token)

asyncio.run(main())
"""
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        capture_output=True, text=True, timeout=60,
    )
    assert result.returncode == 0, f"fixture setup failed for {email}: {result.stderr}"
    return result.stdout.strip().splitlines()[-1]


def _cleanup_session_only(fixture_tag: str):
    cleanup_script = f"""
import asyncio, sys
sys.path.insert(0, {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))!r})
from lib.db import db

async def main():
    await db.user_sessions.delete_many({{"test_fixture": {fixture_tag!r}}})

asyncio.run(main())
"""
    subprocess.run([sys.executable, "-c", cleanup_script],
                    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    capture_output=True, text=True, timeout=60)


@pytest.fixture(scope="module")
def admin_cookie():
    """Fresh session for the REAL, already-existing kijitechnology@gmail.com admin user
    (current ADMIN_EMAIL). Does not create/duplicate the user document (email is unique);
    only the temporary session doc is cleaned up afterward."""
    tag = "tscheck-admin-unlock-new-session"
    token = _make_session_for_existing_user(NEW_ADMIN_EMAIL, tag)
    yield token
    _cleanup_session_only(tag)


def test_non_admin_account_rejected_even_with_correct_password(non_admin_cookie):
    """Criterion: logged-in non-admin email + correct password -> 403, admin-only message."""
    resp = httpx.post(
        api_url("/auth/admin-unlock"),
        json={"password": ADMIN_PASSWORD},
        cookies={"session_token": non_admin_cookie},
        headers=HEADERS,
        timeout=30,
    )
    assert resp.status_code == 403, f"expected 403, got {resp.status_code}: {resp.text}"
    detail = resp.json().get("detail", "")
    assert NEW_ADMIN_EMAIL in detail, f"error should mention {NEW_ADMIN_EMAIL}, got: {detail}"


def test_old_admin_email_no_longer_treated_as_admin(old_admin_email_cookie):
    """Criterion: the OLD admin email admin@kiji.com must no longer be admin -> 403, not 200."""
    resp = httpx.post(
        api_url("/auth/admin-unlock"),
        json={"password": ADMIN_PASSWORD},
        cookies={"session_token": old_admin_email_cookie},
        headers=HEADERS,
        timeout=30,
    )
    assert resp.status_code == 403, f"expected 403 for old admin email, got {resp.status_code}: {resp.text}"
    detail = resp.json().get("detail", "")
    assert NEW_ADMIN_EMAIL in detail, f"error should mention new admin email {NEW_ADMIN_EMAIL}, got: {detail}"


def test_admin_account_wrong_password_rejected(admin_cookie):
    """Criterion: kijitechnology@gmail.com session + wrong password -> 403 with specific Hindi message."""
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
    """Criterion: kijitechnology@gmail.com session + correct password -> 200, has_access=True,
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
