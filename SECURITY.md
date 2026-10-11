# Security

## Required controls

- Argon2id password hashing through `pwdlib`.
- Random session tokens; only SHA-256 token hashes stored in SQLite.
- HttpOnly, SameSite cookies; `Secure` in production; expiration and revocation enforced server side.
- Origin and CSRF validation for cookie-authenticated mutations.
- Role and resource membership checks in backend services for every private record.
- Private uploads stored under generated identifiers, validated by size, extension, MIME, and file signature.
- Audit events for authentication, administrative actions, verification, access changes, document access, and destructive actions.
- Rate limits for authentication and AI endpoints before deployment.
- Retrieved documents treated as untrusted data in AI prompts.

## Implemented controls

- Argon2 password hashes and random session tokens whose SHA-256 hashes are stored in SQLite.
- Database-backed session expiry, revocation, suspended-account rejection, and HttpOnly cookies.
- Public registration cannot assign the administrator role.
- Mutation requests carrying an `Origin` header are accepted only from `CORS_ORIGINS`.
- Lawyer and administrator verification routes enforce roles in backend dependencies.
- Case, message, task, note, appointment, and document routes require explicit case participation.
- Internal case summaries, private notes, tasks, and documents are filtered from client responses.
- PDF/DOCX uploads use byte signatures, generated storage keys, size limits, path containment, and authenticated downloads.
- Login and AI endpoints have configurable process-local rate limits.
- Retrieved legal text is marked untrusted and generated source IDs are validated against the retrieval set.

## Current risks

The unused legacy Node source remains in the repository but is no longer launched. FastAPI does not yet implement password recovery, email verification, malware scanning, shared multi-process rate limiting, or complete audit coverage for every document read. No production deployment should occur until the remaining hardening and authorization tests are complete.

Secrets belong in `.env` or the deployment secret manager and must never enter Git. Any key pasted into chat or committed elsewhere must be rotated.
