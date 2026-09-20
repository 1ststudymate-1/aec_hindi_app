# Google authentication testing

Use the real Google redirect at auth.emergentagent.com, with redirect dynamically derived from window.location.origin. Only the backend exchanges the session_id with the session-data service. Never impersonate a real Google user.

For browser automation, create clearly marked temporary test identities directly in Mongo via lib.db.db. Every user has a custom user_id; session.user_id must match. This is a synthetic authentication fixture, NOT proof of a completed Google OAuth flow or payment. Store only hashed opaque session tokens; timezone-aware expiry must be checked by the server. Use separate unpaid, expired and entitled fixtures to test access control. Do not expose a production bypass endpoint.

1. Create a test user and a 1-day user_sessions entry (token_hash, user_id, expires_at) using the application's hashing helper. Record fixture identity and cookie in memory/test_credentials.md immediately.
2. Curl /api/auth/me with the session_token cookie and confirm user_id and entitlement. Confirm unauthenticated study requests are 401; unpaid/expired requests are 403.
3. Inject the HttpOnly secure SameSite=None session_token cookie into the public-preview browser context; open protected pages and complete a topic/quiz journey. Verify mobile navigation and overflow.
4. Validate callback detection via useLocation().hash, prior to rendering auth queries; session exchange uses a guarded mutation and then router navigation. No hardcoded redirect host.
5. Ensure all queries exclude Mongo _id, match user_id, and normalise Mongo naive timestamps to UTC.
6. Remove test sessions/users after verification, update the credentials record, and explicitly disclose that interactive Google login and real Razorpay payments require separate human verification.

Read this file and memory/test_credentials.md before auth testing. There are no Google passwords, allowlists, or seeded public login accounts.