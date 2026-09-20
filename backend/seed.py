"""Seed the study app — idempotent: topics upsert by slug, questions rebuilt, indexes ensured.

Run:  cd /app/backend && python seed.py
"""

import asyncio

from lib.db import db, ensure_indexes
from content.unit1 import TOPICS as UNIT1_TOPICS
from content.unit2 import TOPICS as UNIT2_TOPICS
from content.questions import MCQS, SHORTS, DESCRIPTIVES


async def main() -> None:
    topics = UNIT1_TOPICS + UNIT2_TOPICS
    for topic in topics:
        doc = {**topic, "id": topic["slug"]}
        await db.topics.replace_one({"slug": topic["slug"]}, doc, upsert=True)

    questions = MCQS + SHORTS + DESCRIPTIVES
    await db.questions.delete_many({})
    if questions:
        await db.questions.insert_many([dict(q) for q in questions])

    await ensure_indexes()

    print(f"seeded: {len(topics)} topics, {len(questions)} questions "
          f"({len(MCQS)} mcq, {len(SHORTS)} short, {len(DESCRIPTIVES)} descriptive)")


if __name__ == "__main__":
    asyncio.run(main())
