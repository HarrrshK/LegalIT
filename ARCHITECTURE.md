# Architecture

## Target shape

```text
React/Vite browser application
        |
        | HTTPS /api/v1
        v
FastAPI modular monolith
  |-- domain routers and Pydantic schemas
  |-- service and repository layers
  |-- authorization policy checks
  |-- ingestion and retrieval interfaces
        |
        +-- SQLite via SQLAlchemy/Alembic
        +-- private filesystem uploads
        +-- Groq HTTPS API
```

The modular monolith keeps transactions and authorization understandable. PostgreSQL can later replace SQLite through SQLAlchemy repositories. Uploaded bytes remain outside the database and are served only through authorized API endpoints.

## Migration state

React authentication, cases, lawyer discovery, administration, and research now use `/api/v1`. `npm run dev` launches FastAPI and Vite. The old Node source is unused and remains only as migration reference until inherited views are fully replaced.

## Main layers

- `app/api`: transport, validation, status codes, and response schemas.
- `app/services`: transactions and use cases.
- `app/repositories`: persistence queries and ownership filters.
- `app/models`: relational persistence models.
- `app/core`: settings, security, logging, and cross-cutting policy.
- `migrations`: Alembic schema history.
- `tests`: isolated API, authorization, migration, and storage checks.
