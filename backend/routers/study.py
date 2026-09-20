"""Study-app endpoints: topics (with full content), question bank and stats."""

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.study import Question, Stats, Topic, TopicSummary

router = APIRouter()


@router.get("/topics", response_model=list[TopicSummary])
async def list_topics(unit: int | None = None):
    query = {"unit": unit} if unit else {}
    docs = await db.topics.find(query, {"sections": 0}).sort([("unit", 1), ("order", 1)]).to_list(200)
    return [TopicSummary(**doc) for doc in docs]


@router.get("/topics/{slug}", response_model=Topic)
async def get_topic(slug: str):
    doc = await db.topics.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="विषय नहीं मिला")
    return Topic(**doc)


@router.get("/questions", response_model=list[Question])
async def list_questions(
    qtype: str | None = None,
    topic_slug: str | None = None,
    limit: int = Query(default=100, le=300),
):
    query: dict = {}
    if qtype:
        query["qtype"] = qtype
    if topic_slug and topic_slug != "mixed":
        query["topic_slug"] = topic_slug
    docs = await db.questions.find(query).sort([("unit", 1), ("id", 1)]).to_list(limit)
    return [Question(**doc) for doc in docs]


@router.get("/stats", response_model=Stats)
async def get_stats():
    return Stats(
        topics=await db.topics.count_documents({}),
        mcqs=await db.questions.count_documents({"qtype": "mcq"}),
        shorts=await db.questions.count_documents({"qtype": "short"}),
        descriptives=await db.questions.count_documents({"qtype": "descriptive"}),
    )
