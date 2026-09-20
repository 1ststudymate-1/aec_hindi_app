# ₹349 / 6 calendar months — activation checklist

Implementation file groups: backend/models/access.py, lib/access.py, routers/auth.py, routers/billing.py, lib/db.py, server.py; frontend/lib/access.ts, lib/razorpay.ts, auth pages and access guard; syllabus API + page; content revisions and seed; responsive Layout/TopicPage/ContentBlocks/Exam/Quiz/Home/Unit, index.css/index.html; living SPEC and credentials.

Razorpay is intentionally DISABLED. No credentials were provided; none are invented. No simulated success endpoint exists. Google uses Emergent-managed OAuth without user-supplied client secrets.

Before accepting money, collect secrets securely from the owner and add via apply_patch to backend/.env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_ENABLED=true. Start with rzp_test_. All three secrets plus explicit enabling are required. Never expose Key Secret or webhook secret. Public Key ID only appears in authenticated order response.

Configure Razorpay auto-capture and signed payment.captured / order.paid / payment.refunded events at https://grammar-master-82.preview.emergentagent.com/api/billing/webhook. Webhook secret is separately chosen in Dashboard → Webhooks. Verify provider account/KYC/domain and publish owner-approved contact, refund/cancellation, terms and privacy information before real sales. Those business details are not supplied yet; do not invent contact addresses or refund guarantees.

Perform real sandbox success/cancel/failure/replay/closed-browser/reconciliation/refund tests first. Only then switch all keys/webhook configuration to Live Mode. Test entitlements never carry into live access. No recurring subscription or automatic deduction. Entitlement begins on first server confirmation of captured payment, with calendar month-end clamping; all study routes require a currently active entitlement. Replayed callback and webhook share one atomic entitlement marker per order.

Google account access follows the same user_id on different devices. Reading/quiz progress remains browser-local and is namespaced per account, not cloud synced. Tests use explicitly labeled short-lived DB fixtures; never present fixture access as a real Google login/payment.