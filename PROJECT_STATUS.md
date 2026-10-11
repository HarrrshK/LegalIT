# Project Status

Updated: 2026-10-11

## Current milestone

Milestone 8 — Hardening (in progress). Milestones 0–6 have functional foundations; remaining UI coverage and operational hardening prevent production readiness.

## Implemented

- React 19, Vite 8, TypeScript, React Router, TanStack Query, Tailwind CSS, shadcn-style primitives, React Hook Form, Zod, and Lucide.
- FastAPI, Pydantic Settings, SQLAlchemy, Alembic, SQLite with foreign keys and FTS5, and configurable private storage.
- Client/lawyer registration, Argon2 hashing, durable hashed sessions, logout, password changes, suspension, trusted origins, and login/AI rate limits.
- Profiles, lawyer verification submission/admin review, verified public directory, authenticated active-lawyer selection with an explicit verification label, and administrator account issuance and metrics.
- Consultation lifecycle, client case intake, lawyer accept/reject, lawyer-created cases, explicit participants, internal/client summaries, private/shared notes, tasks, appointments, messages, and notifications.
- Lawyer-owned client records with optional registered-account linking.
- PDF/DOCX signature and size checks, generated storage paths, extraction, private downloads, and explicit client sharing.
- Manual permitted-source legal JSON ingestion, normalized legal records, FTS5 ranking, metadata filters, and source freshness fields.
- Groq RAG boundary with retrieved evidence, structured JSON, source-ID validation, injection-resistant prompting, empty-evidence abstention, and search-only fallback.
- Source-backed legal news storage/API with no fabricated entries.
- Public landing, privacy, terms, `/client/*`, `/lawyer/*`, and `/admin/*` paths.
- Windows `install.bat` and cross-platform Node launchers install dependencies, migrate SQLite, and start FastAPI plus Vite.
- The backend uses plain Uvicorn without its optional PyYAML configuration dependency, improving installation compatibility on newer Python releases.
- Commands for creating users, erasing all local data, erasing data while retaining administrator accounts, importing legal records, backup, and integrity-checked restore.

## Incomplete

- The admin source/ingestion endpoints and account suspension API still need dedicated controls in the admin page.
- Password recovery and email verification require an email provider and are not active.
- Legal/news data must be imported from reviewed, permitted real sources; the repository intentionally contains no fabricated records.
- Rate limits are process-local and need a shared implementation before multi-process deployment.
- Malware scanning, OCR execution, document versions, saved news, formal accessibility testing, and production monitoring remain incomplete.
- Production service/reverse-proxy configuration and deployment verification remain Milestone 9 work.

## Database migration status

Revisions `2d0dbe6e94d9` and `56cf859679d6` pass isolated upgrade and downgrade tests, including FTS5. Existing JSON data was not deleted or silently imported.

## Required environment

`DATA_DIR`, `UPLOAD_DIR`, `DATABASE_URL`, `CORS_ORIGINS`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_TIMEOUT_SECONDS`, `MAX_AI_INPUT_CHARS`, `MAX_AI_OUTPUT_TOKENS`, `RETRIEVAL_RESULT_COUNT`, `MAX_UPLOAD_BYTES`, `LOGIN_RATE_LIMIT`, `AI_RATE_LIMIT`, `RATE_LIMIT_WINDOW_SECONDS`.

## Verified results

- `PYTHONPATH=backend .venv/bin/pytest backend/tests -q` — 12 passed.
- `npm run lint` — passed without warnings.
- `npm run build` — passed.
- Alembic upgrade and downgrade — passed on isolated SQLite.
- `npm run api` applied migrations and returned healthy FastAPI status.
- Multi-role HTTP flow passed: registration, lawyer profile, verification/admin approval, directory, client case intake, lawyer acceptance, private DOCX extraction, denied client download before sharing, successful download after sharing, and disallowed-origin rejection.
- Backup → erase → restore recovered 3 users, 1 case, 1 document record, and 1 uploaded file.
- Admin-preserving reset was exercised on isolated migrated SQLite: the administrator remained, all non-admin accounts/domain rows/uploads were removed.

## Known security limitations

Email verification/recovery and malware scanning are not configured. The rate limiter is per process. Domain HTTP authorization coverage needs expansion. Do not deploy with real client data yet.

## Exact next action

Add admin source/ingestion and suspension controls, expand HTTP authorization and upload-limit tests, perform an accessibility pass, and finish Milestone 8 before production deployment verification.
