"""Pre-scaffolded pytest fixtures for the FastAPI backend.

Tests hit the live uvicorn process managed by supervisor (not an in-process ASGI app), so
the app under test is the same one the frontend and Playwright see. Do NOT re-create this
file — add app-specific fixtures below the marker at the bottom.
"""

import os

import httpx
import pytest
import pytest_asyncio

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"


def api_url(path: str = "") -> str:
    """Absolute URL for an /api route: api_url("/status") -> http://localhost:8001/api/status."""
    return f"{API_URL}{path}"


@pytest.fixture(scope="session")
def backend_url() -> str:
    return BACKEND_URL


@pytest.fixture
def client():
    """Sync httpx client rooted at /api — the default for endpoint tests.

    Example:
        def test_status(client):
            assert client.get("/status").status_code == 200
    """
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        yield c


@pytest_asyncio.fixture
async def aclient():
    """Async variant, for tests that also await motor/backend helpers directly."""
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as c:
        yield c


# --- app-specific fixtures below this line ---

import os as _os
import secrets
import subprocess
import sys
import uuid

_TESTS_DIR = _os.path.dirname(_os.path.abspath(__file__))
_BACKEND_DIR = _os.path.dirname(_TESTS_DIR)


def _make_fixture_session(kind: str, tag: str) -> str:
    """Create a self-contained tscheck- user+session (own unique tag, so it can
    never be wiped by another test file's cleanup of a different tag) and return
    the plaintext session cookie. kind in {"paid", "unpaid", "expired"}.

    Runs in a subprocess (its own fresh event loop) so it never fights over the
    motor client's event-loop binding with the pytest-asyncio test process --
    the same proven pattern already used by test_tscheck_admin_unlock.py.
    """
    script = f"""
import asyncio, sys
sys.path.insert(0, {_BACKEND_DIR!r})
from datetime import timedelta
from lib.db import db, ensure_indexes
from lib.access import token_hash, utcnow

async def main():
    await ensure_indexes()
    user_id = {tag!r} + "-" + {kind!r}
    user = {{"user_id": user_id, "email": user_id + "@example.com", "name": "TSCheck Fixture",
            "picture": "", "test_fixture": {tag!r}, "created_at": utcnow()}}
    if {kind!r} in ("paid", "expired"):
        user["live_access_until"] = utcnow() + timedelta(days=1 if {kind!r} == "paid" else -1)
    await db.users.replace_one({{"user_id": user_id}}, user, upsert=True)
    import secrets as s
    token = s.token_urlsafe(32)
    await db.user_sessions.insert_one({{"user_id": user_id, "token_hash": token_hash(token),
        "expires_at": utcnow() + timedelta(days=1), "test_fixture": {tag!r}}})
    print(token)

asyncio.run(main())
"""
    result = subprocess.run([sys.executable, "-c", script], cwd=_BACKEND_DIR,
                             capture_output=True, text=True, timeout=60)
    assert result.returncode == 0, f"fixture setup failed for kind={kind}: {result.stderr}"
    return result.stdout.strip().splitlines()[-1]


def _cleanup_fixture_tag(tag: str):
    script = f"""
import asyncio, sys
sys.path.insert(0, {_BACKEND_DIR!r})
from lib.db import db

async def main():
    await db.users.delete_many({{"test_fixture": {tag!r}}})
    await db.user_sessions.delete_many({{"test_fixture": {tag!r}}})

asyncio.run(main())
"""
    subprocess.run([sys.executable, "-c", script], cwd=_BACKEND_DIR,
                    capture_output=True, text=True, timeout=60)


@pytest.fixture
def paid_cookie():
    tag = f"tscheck-{uuid.uuid4().hex[:10]}"
    cookie = _make_fixture_session("paid", tag)
    yield cookie
    _cleanup_fixture_tag(tag)


@pytest.fixture
def unpaid_cookie():
    tag = f"tscheck-{uuid.uuid4().hex[:10]}"
    cookie = _make_fixture_session("unpaid", tag)
    yield cookie
    _cleanup_fixture_tag(tag)


@pytest.fixture
def expired_cookie():
    tag = f"tscheck-{uuid.uuid4().hex[:10]}"
    cookie = _make_fixture_session("expired", tag)
    yield cookie
    _cleanup_fixture_tag(tag)
