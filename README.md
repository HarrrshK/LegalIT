# LegalIt

LegalIt is a role-aware Indian legal operations platform built with React, TypeScript, FastAPI, SQLAlchemy, Alembic, and SQLite. It provides client, lawyer, and administrator interfaces, private case collaboration, lawyer verification, legal search, and a Groq-backed retrieval assistant.

No demo users, lawyers, cases, legal sources, or news are created automatically.
The backend does not depend on PyYAML; Uvicorn is configured through command-line arguments.

## Windows setup

Install Python 3.11+ and Node.js 20+, extract the project, and double-click `install.bat`. It creates `.venv`, installs both dependency sets, creates a private `.env`, migrates SQLite, starts FastAPI and Vite, and opens `http://localhost:5173`.

Add your own Groq key to `.env` when AI inference is needed. Search and source excerpts work without it. Never commit or send a populated `.env`.

Create the first administrator from Command Prompt or PowerShell:

```bat
npm run account:create -- --role admin --name "Platform Admin" --email "admin@example.com"
```

The command prints a one-time password. Client and lawyer accounts can also be created by changing `--role`, while public registration supports clients and lawyers.

## Linux setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm install
cd backend
../.venv/bin/alembic upgrade head
cd ..
npm run dev
```

Open `http://localhost:5173`. FastAPI documentation is at `http://127.0.0.1:8000/api/v1/docs`.

## Management commands

```bash
# Create accounts and generated one-time passwords
npm run account:create -- --role client --name "Client Name" --email "client@example.com"
npm run account:create -- --role lawyer --name "Lawyer Name" --email "lawyer@example.com"
npm run account:create -- --role admin --name "Platform Admin" --email "admin@example.com"

# Deliberately erase every SQLite record and uploaded file
npm run data:reset

# Erase all data and uploads while preserving administrator accounts
npm run data:nuke-keep-admin

# Import reviewed legal documents from the format documented in AI_SYSTEM.md
npm run legal:import -- path/to/legal-documents.json
npm run news:import -- path/to/legal-news.json

# Back up and restore SQLite plus uploads; stop the API before restore
npm run data:backup -- --output backups/legalit.zip
npm run data:restore -- backups/legalit.zip --yes
```

Stop the API before either erase command. `data:nuke-keep-admin` preserves only
administrator user accounts; it removes their sessions along with every other
account, case, legal source, audit entry, and uploaded file, so administrators
must sign in again afterward.

## Verification

```bash
PYTHONPATH=backend .venv/bin/pytest backend/tests -q
npm run lint
npm run build
```

## Storage and secrets

- SQLite defaults to `data/legalit.db` and uploads to `data/uploads`.
- Override them with `DATABASE_URL`, `DATA_DIR`, and `UPLOAD_DIR` on durable storage.
- `CORS_ORIGINS` must list the actual frontend origins.
- `GROQ_API_KEY` stays in the backend environment.
- `.env`, SQLite files, uploads, backups, and private documents are ignored by Git.

## Current limitations

Read [PROJECT_STATUS.md](./PROJECT_STATUS.md) before using real client data. Email verification/recovery, malware scanning, production monitoring, and deployment verification are incomplete. Legal and news records must come from reviewed sources whose access and reuse are permitted.
