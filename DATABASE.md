# Database

SQLite is the development database. `DATABASE_URL` overrides the default `DATA_DIR/legalit.db`. Schema changes are applied only through Alembic.

## Current schema

- `users`: identity, role, account state, and password hash.
- `client_profiles`: minimal client contact preferences.
- `lawyer_profiles`: declared professional profile. Public visibility is separate from verification.
- `lawyer_verifications`: submission and administrator review state.
- `user_sessions`: hashed durable session tokens and revocation.
- `cases`: matter metadata and separate client-visible summary.
- `case_participants`: explicit user-to-case access relationship and capabilities.
- `audit_logs`: immutable security and administrative event records.
- `client_records`: lawyer-owned records optionally linked to a registered client.
- `consultation_requests`, `consultation_status_events`: request lifecycle and history.
- `case_documents`, `case_notes`, `case_tasks`, `appointments`, `messages`, `notifications`: case operations.
- `legal_sources`, `legal_documents`, `legal_documents_fts`: normalized sources and trigger-maintained FTS5 search.
- `legal_news`, `saved_legal_references`: sourced updates and saved research.
- `ai_conversations`, `ai_messages`, `ai_citations`, `ingestion_jobs`: research history, validated citations, and ingestion operations.

## Commands

From `backend/` with `PYTHONPATH=.`:

```bash
../.venv/bin/alembic upgrade head
../.venv/bin/alembic downgrade -1
../.venv/bin/alembic current
```

Never delete the database to resolve a migration problem. Back up the database and uploads before production upgrades.
