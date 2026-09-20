"""Criteria: MCQ question bank expanded chapter-wise to 300+ questions (actual 457),
every one of the 25 topic slugs has >=5 MCQs, each MCQ has exactly 4 options with a
valid answer_index and non-empty explanation, no duplicate ids, and the /questions
limit was raised to 600 so 'mixed' mode is not truncated below the full MCQ count.

Uses the paid fixture (content is access-gated) via tests/access_fixtures.py.
"""
import httpx
import pytest

ALL_TOPIC_SLUGS = [
    "patra-lekhan-parichay", "anaupcharik-patra", "aupcharik-patra", "avedan-patra",
    "vyavsayik-patra", "sampadak-ke-naam-patra", "nibandh-lekhan-vidhi",
    "nibandh-paryavaran", "nibandh-naitikta", "nibandh-vigyan", "nibandh-sahitya",
    "nibandh-rashtriyata", "nibandh-swasthya", "sandhi", "samas", "varna-vichar",
    "vakya-shuddhi", "muhavare", "lokoktiyan", "karak-vibhakti", "upsarg",
    "pratyay", "pallavan", "sankshepan", "anek-shabdon-ke-liye-ek-shabd",
]


def _paid_get(client: httpx.Client, path: str, paid_cookie: str):
    return client.get(path, cookies={"session_token": paid_cookie})


def test_stats_shows_expanded_mcq_pool(client: httpx.Client, paid_cookie):
    r = _paid_get(client, "/stats", paid_cookie)
    assert r.status_code == 200, f"-> {r.status_code}: {r.text[:200]}"
    data = r.json()
    assert data["topics"] == 25
    assert data["mcqs"] >= 300, f"expected >=300 mcqs (chapter-wise addition), got {data['mcqs']}"


def test_mixed_mcq_query_not_truncated_by_old_300_cap(client: httpx.Client, paid_cookie):
    r = _paid_get(client, "/questions?qtype=mcq&topic_slug=mixed", paid_cookie)
    assert r.status_code == 200, f"-> {r.status_code}: {r.text[:200]}"
    data = r.json()
    stats = _paid_get(client, "/stats", paid_cookie).json()
    assert len(data) == stats["mcqs"], (
        f"mixed mcq query returned {len(data)}, expected full pool of {stats['mcqs']} "
        "(limit must be raised above the old 300 default/cap)"
    )
    assert len(data) > 300, "pool must exceed the old 300 cap to prove the limit was actually raised"


@pytest.mark.parametrize("slug", ALL_TOPIC_SLUGS)
def test_every_topic_has_at_least_five_mcqs(client: httpx.Client, paid_cookie, slug):
    r = _paid_get(client, f"/questions?qtype=mcq&topic_slug={slug}", paid_cookie)
    assert r.status_code == 200, f"{slug} -> {r.status_code}: {r.text[:200]}"
    data = r.json()
    assert len(data) >= 5, f"topic {slug} has only {len(data)} mcqs, expected >=5"
    for q in data:
        assert q["topic_slug"] == slug


def test_mcq_shape_and_no_duplicate_ids_across_full_pool(client: httpx.Client, paid_cookie):
    r = _paid_get(client, "/questions?qtype=mcq&topic_slug=mixed", paid_cookie)
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    ids = [q["id"] for q in data]
    assert len(ids) == len(set(ids)), "duplicate MCQ ids found in the pool"
    for q in data:
        assert len(q["options"]) == 4, f"{q['id']} does not have exactly 4 options: {q['options']}"
        assert 0 <= q["answer_index"] <= 3, f"{q['id']} has invalid answer_index {q['answer_index']}"
        assert isinstance(q.get("explanation"), str) and q["explanation"].strip(), (
            f"{q['id']} missing a non-empty explanation"
        )


def test_anonymous_still_rejected_401(client: httpx.Client):
    r = client.get("/questions?qtype=mcq&topic_slug=mixed")
    assert r.status_code == 401, f"-> {r.status_code}: {r.text[:200]}"
