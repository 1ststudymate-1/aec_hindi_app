"""Criterion: Corrected complete syllabus + full content coverage seeded.

25 topics (13 writing incl. nibandh-sahitya, nibandh-swasthya; 12 grammar incl.
combined karak-vibhakti), 118 MCQs with >=3 per topic, 25 short + 25
descriptive questions, and syllabus objectives/outcomes/units/exam details.
Uses the paid fixture (content is access-gated).
"""
import httpx

PAID_COOKIE = "IQCyT9thKKknAASBnkI7zQQ9J4HzQOfm-GyNl-pnPzg"


def _paid_get(client: httpx.Client, path: str):
    return client.get(path, cookies={"session_token": PAID_COOKIE})


def test_topic_count_and_required_slugs(client: httpx.Client):
    r = _paid_get(client, "/topics")
    assert r.status_code == 200
    topics = r.json()
    assert len(topics) == 25, f"expected 25 topics, got {len(topics)}"
    slugs = {t["slug"] for t in topics}
    for required in ["nibandh-sahitya", "nibandh-swasthya", "karak-vibhakti"]:
        assert required in slugs, f"missing required topic slug {required}: {sorted(slugs)}"


def test_questions_bank_composition(client: httpx.Client):
    r = _paid_get(client, "/questions")
    assert r.status_code == 200
    data = r.json()
    # response may be a dict of buckets or list; normalize
    assert isinstance(data, list)
    mcq = [q for q in data if q.get("qtype") == "mcq"]
    short = [q for q in data if q.get("qtype") == "short"]
    descriptive = [q for q in data if q.get("qtype") == "descriptive"]
    assert len(mcq) == 118, f"expected 118 mcqs, got {len(mcq)}"
    assert len(short) == 25, f"expected 25 short, got {len(short)}"
    assert len(descriptive) == 25, f"expected 25 descriptive, got {len(descriptive)}"

    from collections import Counter
    per_topic = Counter(q.get("topic_slug") for q in mcq)
    under = {k: v for k, v in per_topic.items() if v < 3}
    assert not under, f"topics with <3 mcqs: {under}"


def test_syllabus_structure_complete(client: httpx.Client):
    r = _paid_get(client, "/syllabus")
    assert r.status_code == 200
    data = r.json()
    assert len(data.get("objectives", [])) == 4
    assert len(data.get("outcomes", [])) >= 4
    assert data.get("credits") == 2
    assert data.get("teaching_hours") == 30
    assert data.get("full_marks") == 50
    assert data.get("pass_marks") == 20
    assert data.get("duration_minutes") == 90
    units = data.get("units", [])
    assert len(units) >= 2
    unit2_items = next((u["items"] for u in units if u.get("unit") == 2), [])
    assert len(unit2_items) == 13, f"expected 13 Unit2 items, got {len(unit2_items)}"


def test_billing_plan_disabled_349_six_months(client: httpx.Client):
    r = client.get("/billing/plan")
    assert r.status_code == 200
    data = r.json()
    assert data == {"amount": 34900, "currency": "INR", "months": 6, "enabled": False, "mode": "disabled"}
