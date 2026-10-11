# Deployment

No container runtime is required.

## Intended Linux layout

- Build the React frontend with `npm ci && npm run build`.
- Create a Python virtual environment and install `backend/requirements.txt`.
- Place persistent SQLite and uploads on a mounted durable directory configured by `DATA_DIR`, `DATABASE_URL`, and `UPLOAD_DIR`.
- Run `alembic upgrade head` before starting the new application version.
- Run FastAPI through Uvicorn under systemd.
- Serve `dist/` and reverse proxy `/api/` through Caddy or Nginx with HTTPS.

Example production files are in `deploy/legalit.service`, `deploy/Caddyfile.example`, and `deploy/build-release.sh`. Replace the example domain and paths for the target host. A host with ephemeral filesystems is unsuitable unless SQLite and uploads are moved to durable managed storage.

## Linux deployment outline

1. Create a dedicated `legalit` system account and `/opt/legalit/current` release directory.
2. Mount durable storage at `/var/lib/legalit` and grant it only to the service account.
3. Put secrets in `/etc/legalit/legalit.env` with mode `0600`. Configure `DATA_DIR=/var/lib/legalit`, `UPLOAD_DIR=/var/lib/legalit/uploads`, an absolute SQLite `DATABASE_URL`, the public HTTPS `CORS_ORIGINS`, and a rotated Groq key.
4. Run `deploy/build-release.sh` as the release user.
5. Install the systemd unit and Caddy configuration, run `systemctl daemon-reload`, and enable both services.
6. Verify `/api/v1/health`, browser registration/login, uploads, and a backup after deployment.

The supplied unit runs one application process because SQLite has limited concurrent write capacity. Scale-out requires moving to PostgreSQL and a shared rate limiter/storage design.

## Backup and restore

Stop writes before restore. Backups use SQLite's online backup API and include private uploads:

```bash
npm run data:backup -- --output backups/legalit.zip
npm run data:restore -- backups/legalit.zip --yes
cd backend && ../.venv/bin/alembic upgrade head
```

Restore validates archive paths and SQLite integrity before replacement. Backup, erase, and restore were exercised on isolated data. Production still needs scheduled encrypted off-host backups and retention monitoring.

Rollback, secret rotation, log inspection, and production health verification must be exercised before deployment approval.
