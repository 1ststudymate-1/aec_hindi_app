"""Seed the study app — idempotent: topics upsert by slug, questions rebuilt, indexes ensured.

Run:  cd /app/backend && python seed.py
"""

import asyncio

from lib.db import db, ensure_indexes
from content.writing import TOPICS as UNIT1_TOPICS
from content.grammar import TOPICS as UNIT2_TOPICS
from content.question_bank import MCQS, SHORTS, DESCRIPTIVES
from models.study import Topic, Question


async def main() -> None:
    topics = UNIT1_TOPICS + UNIT2_TOPICS
    for topic in topics:
        doc = Topic(**topic, id=topic["slug"]).model_dump()
        await db.topics.replace_one({"slug": topic["slug"]}, doc, upsert=True)

    questions = MCQS + SHORTS + DESCRIPTIVES
    if questions:
        for q in questions:
            doc = Question(**q).model_dump()
            await db.questions.replace_one({"id": q["id"]}, doc, upsert=True)
        await db.questions.delete_many({"id": {"$nin": [q["id"] for q in questions]}})

    await ensure_indexes()

    print(f"seeded: {len(topics)} topics, {len(questions)} questions "
          f"({len(MCQS)} mcq, {len(SHORTS)} short, {len(DESCRIPTIVES)} descriptive)")


if __name__ == "__main__":
    asyncio.run(main())
