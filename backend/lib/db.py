"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "users": [IndexModel([("user_id", ASCENDING)], unique=True), IndexModel([("email", ASCENDING)], unique=True)],
    "user_sessions": [IndexModel([("token_hash", ASCENDING)], unique=True),
                      IndexModel([("user_id", ASCENDING)]), IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0)],
    "auth_exchanges": [IndexModel([("exchange_hash", ASCENDING)], unique=True),
                       IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0)],
    "payment_orders": [IndexModel([("order_id", ASCENDING)], unique=True),
                       IndexModel([("user_id", ASCENDING), ("status", ASCENDING), ("key_id", ASCENDING), ("created_at", DESCENDING)])],
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "topics": [
        IndexModel([("slug", ASCENDING)], name="slug", unique=True),
        IndexModel([("unit", ASCENDING), ("order", ASCENDING)], name="unit_order"),
    ],
    "questions": [
        IndexModel([("qtype", ASCENDING), ("topic_slug", ASCENDING)], name="qtype_topic"),
        IndexModel([("id", ASCENDING)], unique=True),
        IndexModel([("topic_slug", ASCENDING)]),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
