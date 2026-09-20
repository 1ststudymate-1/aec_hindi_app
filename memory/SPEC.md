# Kiji Technology — Hindi study app SPEC

## What the app does
Hindi-language study portal for the FYUGP **AEC Hindi (Compulsory)** course "हिंदी व्याकरण"
(Sido Kanhu Murmu University, Dumka). Header now says Kiji Technology only, with no old Hindi-brand or university subtitle. User requested their real logo but has not supplied an asset; text-only branding is temporary, not an invented logo. Footer must read exactly `Developer by Kiji Technology`.

## Current paid-access model
- Every study route including home, units, topics, quizzes, exam and syllabus requires Google login AND a currently active paid entitlement, enforced by FastAPI as well as the React route guard.
- Only the membership/login/account shell is public. No preview lessons and no free trial.
- One-time ₹349 (34900 INR paise), 6 calendar months after verified capture, month-end clamped. No automatic deduction or renewal. Active accounts cannot initiate another purchase.
- Google OAuth is Emergent-managed: dynamic window.location.origin + /account redirect, hash session_id exchanged server-side, local random opaque session cookie secure + HttpOnly + SameSite=None; token hash only in Mongo, 7-day expiry. No app passwords. OAuth response/replay is validated, all writes require same-origin non-simple header.
- Razorpay code supports order creation, checkout, HMAC verification, captured-payment fetch, signed raw-body webhooks, replay-safe single-document entitlement updates, and account-owned recovery after browser closure. Test/live access separated.
- **Razorpay intentionally DISABLED**: owner has no keys and explicitly requested no real payments yet. Requires all 3 credentials plus RAZORPAY_ENABLED=true; absent config returns 503 on authenticated payment calls, UI button disabled, no fake successes.
- Interactive Google consent and real Razorpay capture cannot be proven with synthetic fixtures. See auth_testing.md and memory/PAYMENTS.md. No production bypass or admin access was added.
- users: user_id, email(unique), name, picture, live_access_until?, test_access_until?, applied_orders[]. user_sessions: token_hash, user_id, expires_at (TTL). auth_exchanges: exchange_hash, expires_at (TTL). payment_orders: order_id(unique), user_id, key_id, mode, amount, currency, status, payment_id?, access_until?, created_at.

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
- `GET /api/syllabus` → course metadata, objectives, outcomes, references, exam notes, required topic links with Mongo availability
- `GET /api/auth/me` → `{user: UserView|null}` (200 anonymous state, no token in JSON)
- `POST /api/auth/session`, `/auth/logout`
- `GET /api/billing/plan`; `POST /api/billing/orders`, `/billing/verify`, `/billing/reconcile`, `/billing/webhook`

## Routes / key flows
- `/` — hero, exam scheme at a glance, stats strip, localStorage progress widget, both unit cards, objectives
- `/ikai/1`, `/ikai/2` — topic grid + search filter (`unit-search-input`)
- `/vishay/:slug` — reader: outline sidebar, rich blocks, "पढ़ लिया" toggle (localStorage), prev/next pagination
- `/abhyas` — MCQ runner: topic select (mixed default) → option click reveals correct/wrong + explanation → next → score card
- `/pariksha` — official 50-mark scheme, Group A/B rules, Group A (25) + Group B (25) model Q&A with reveal buttons, outcomes + references
- `/syllabus` — protected readable syllabus tab, objectives/outcomes and chapter-linked coverage checklist; कारक and विभक्ति shown separately linking to the joint chapter
- `/membership`, `/account`, `/login` — public purchase/login/account screen. Logged-in account displays active/expired/not-purchased status and IST expiry. Navbar has account/logout; mobile controlled sheet closes on navigation, explicit close button, 44px touch targets. Tables scroll within min-width-constrained content, exam tabs wrap, long topic navigation wraps.
- Navigation dismisses previous-page toasts so a reading-progress notification does not cover the next page's quiz choices on mobile.

## Seed facts (`cd /app/backend && python seed.py`, idempotent)
- **25 topics** — 13 in unit 1 (patra-lekhan-parichay, anaupcharik-patra, aupcharik-patra, avedan-patra,
  vyavsayik-patra, sampadak-ke-naam-patra, nibandh-lekhan-vidhi, nibandh-paryavaran, nibandh-naitikta,
  nibandh-vigyan, nibandh-sahitya, nibandh-rashtriyata, nibandh-swasthya) and 12 in unit 2 (sandhi, samas, varna-vichar,
  vakya-shuddhi, muhavare, lokoktiyan, karak-vibhakti, upsarg, pratyay, pallavan, sankshepan,
  anek-shabdon-ke-liye-ek-shabd)
- Rebuilt question bank: 168 questions (118 MCQs, at least 3 per topic; 25 short Group A; 25 full descriptive Group B model answers). All practice, not predictions of actual exam questions. Stats come from Mongo.
- Canonical revised source: `backend/content/writing.py`, `grammar.py`, `question_bank.py`, `syllabus.py`. Old inaccurate source files removed. `seed.py` validates Pydantic models and upserts; no user/payment data touched.
- Content check found literature missing and incorrect sandhi/varna splits, fabricated idioms/proverbs, suffix categories and false grammar corrections. Replaced these with revised instruction and real examples. Five required essay domains include साहित्य; स्वास्थ्य is explicitly extra, not a substitute. Full letters and essays replace outline-only content. Unit 2 covers 13 syllabus entries via 12 chapters (कारक-विभक्ति together).

## Auth
Google login required, followed by paid access. No admin or password accounts. Testing identities, if present temporarily, are explicitly synthetic and removed after verification; see memory/test_credentials.md. Browser-local progress uses hv-progress-v2-{user_id} and hv-scores-v2-{user_id}. Legacy anonymous v1 data is not silently assigned to a new Google user. Purchased access, but not progress, follows the account across devices. Auth logout clears query cache and resets local progress namespace.

## Exam scheme (from syllabus, shown on /pariksha)
Full marks 50 · pass 20 · duration 1.5 h · credits 02 · teaching hours 30.
Group A: 5 very-short × 1 = 5 (compulsory). Group B: 6 descriptive × 15, answer any 3 = 45.
