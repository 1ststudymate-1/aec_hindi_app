# हिंदी व्याकरण अध्ययन मंच — SPEC

## What the app does
Hindi-language study portal for the FYUGP **AEC Hindi (Compulsory)** course "हिंदी व्याकरण"
(Sido Kanhu Murmu University, Dumka). No auth, no accounts — open study content.

## Data model (MongoDB, string `id` = slug)
- `topics` — `{id, slug, unit (1|2), title, subtitle, icon, read_minutes, order, tags[], sections[]}`
  where `sections[] = {heading, blocks[]}` and a block is
  `{kind: paragraph|points|numbered|table|definition|example|tip|highlight, heading?, text?, items?, headers?, rows?}`
- `questions` — `{id, qtype: mcq|short|descriptive, topic_slug, unit, question, options?, answer_index?, explanation?, answer?, marks}`

Pydantic models: `backend/models/study.py`. TS mirrors: `frontend/src/lib/types.ts`.

## API (all on api_router under /api)
- `GET /api/topics?unit=1|2` → TopicSummary[] (sections excluded)
- `GET /api/topics/{slug}` → Topic (404 → `{"detail": "विषय नहीं मिला"}`)
- `GET /api/questions?qtype=mcq|short|descriptive&topic_slug=<slug|mixed>&limit=` → Question[]
- `GET /api/stats` → `{topics, mcqs, shorts, descriptives}`

## Routes / key flows
- `/` — hero, exam scheme at a glance, stats strip, localStorage progress widget, both unit cards, objectives
- `/ikai/1`, `/ikai/2` — topic grid + search filter (`unit-search-input`)
- `/vishay/:slug` — reader: outline sidebar, rich blocks, "पढ़ लिया" toggle (localStorage), prev/next pagination
- `/abhyas` — MCQ runner: topic select (mixed default) → option click reveals correct/wrong + explanation → next → score card
- `/pariksha` — official 50-mark scheme, Group A/B rules, Group A (12) + Group B (9) model Q&A with reveal buttons, outcomes + references

## Seed facts (`cd /app/backend && python seed.py`, idempotent)
- **24 topics** — 12 in unit 1 (patra-lekhan-parichay, anaupcharik-patra, aupcharik-patra, avedan-patra,
  vyavsayik-patra, sampadak-ke-naam-patra, nibandh-lekhan-vidhi, nibandh-paryavaran, nibandh-naitikta,
  nibandh-vigyan, nibandh-swasthya, nibandh-rashtriyata) and 12 in unit 2 (sandhi, samas, varna-vichar,
  vakya-shuddhi, muhavare, lokoktiyan, karak-vibhakti, upsarg, pratyay, pallavan, sankshepan,
  anek-shabdon-ke-liye-ek-shabd)
- **99 questions** — 78 mcq, 12 short (Group A), 9 descriptive (Group B)
- Content source: `backend/content/unit1.py`, `unit2.py`, `questions.py`

## Auth
None. No credentials anywhere; `memory/test_credentials.md` intentionally records "no auth".

## Exam scheme (from syllabus, shown on /pariksha)
Full marks 50 · pass 20 · duration 1.5 h · credits 02 · teaching hours 30.
Group A: 5 very-short × 1 = 5 (compulsory). Group B: 6 descriptive × 15, answer any 3 = 45.
