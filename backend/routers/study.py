"""Study-app endpoints: topics (with full content), question bank and stats."""

from fastapi import APIRouter, Depends, HTTPException, Query

from lib.db import db
from models.study import Question, Stats, Topic, TopicSummary, Syllabus
from lib.access import require_paid
from content.syllabus import OBJECTIVES, OUTCOMES, UNITS, REFERENCES

router = APIRouter(dependencies=[Depends(require_paid)])


@router.get("/syllabus", response_model=Syllabus)
async def syllabus():
    slugs = set(await db.topics.distinct("slug"))
    return Syllabus(title="FYUGP COMMON COURSE — AEC HINDI (COMPULSORY)",
        source="सिदो कान्हू मुर्मू विश्वविद्यालय, दुमका — उपलब्ध कराए गए पाठ्यक्रम के अनुसार",
        credits=2, teaching_hours=30, full_marks=50, pass_marks=20, duration_minutes=90,
        evaluation="केवल सत्रांत विश्वविद्यालय परीक्षा (ESE)", objectives=OBJECTIVES,
        outcomes=OUTCOMES, references=REFERENCES,
        units=[{**unit, "items": [{**item, "available": item["slug"] in slugs} for item in unit["items"]]} for unit in UNITS],
        notes=["समूह क अनिवार्य: पाँच अति लघु उत्तरीय प्रश्न, प्रत्येक 1 अंक — कुल 5 अंक।",
               "समूह ख: छह वर्णनात्मक प्रश्न, प्रत्येक 15 अंक; किन्हीं तीन के उत्तर — कुल 45 अंक।",
               "आवश्यकतानुसार कुछ प्रश्न छोटे भागों में विभाजित किए जा सकते हैं।",
               "कारक और विभक्ति एक संयुक्त अध्याय में अलग अनुभागों के साथ पढ़ाए गए हैं।",
               "स्वास्थ्य का निबंध अतिरिक्त अभ्यास है; साहित्य का अनिवार्य निबंध अलग उपलब्ध है।",
               "अध्ययन सामग्री और मॉडल प्रश्न स्वतंत्र शैक्षिक सहायता हैं; यह विश्वविद्यालय की आधिकारिक वेबसाइट या प्रश्नपत्र नहीं है।"])


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
    limit: int = Query(default=600, ge=1, le=600),
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
