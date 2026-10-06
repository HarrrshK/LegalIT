# NyayaFlow

NyayaFlow is a React and TypeScript legal portal prototype with a Node.js API for account access, administrator provisioning, audit events, and Groq-powered legal information answers.

## Run locally

Requires Node.js 20 or newer.

Open two terminals in the project folder:

1. Start the API. Set a unique administrator email and a password with at least 16 characters. Add the Groq key if you want the AI assistant enabled.

   ```bash
   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='use-a-long-unique-password-here' GROQ_API_KEY='your-groq-api-key' npm run api
   ```

   The first run provisions the administrator. Its credentials are stored as a password hash in `data/store.json`. Keep this file private and backed up. The API defaults to port 3001.

2. Start the frontend:

   ```bash
   npm run dev
   ```

   Open the local URL printed by Vite. Vite forwards `/api` requests to the API on port 3001.

To build the static frontend, run `npm run build`. The API runs separately with `npm run api`.

## Accounts and permissions

- Clients can register and sign in with email or their generated user ID.
- Legal professionals can register, but their accounts wait for administrator approval.
- An authenticated administrator can issue client or professional accounts, receive a one-time user ID and temporary password, suspend or restore accounts, and review the audit log.
- Issued passwords must be changed at first sign-in.
- The first administrator is created from server environment variables; there is no hidden master password or browser-side admin bypass.
- Sign-in sessions use HTTP-only, same-site cookies. Sessions expire after 12 hours or when the API process restarts.

## Groq AI

The browser sends questions to `/api/ai/chat`. The server calls Groq using `GROQ_API_KEY`, so the key is not included in frontend code. `GROQ_MODEL` can override the default `llama-3.3-70b-versatile` model. AI responses are general legal information and may be incomplete or incorrect; they are not legal advice. The current endpoint does not retrieve verified legal sources or client case files, so it must not be described as citation-grounded RAG.

## Current limitations

The account and audit store is a local JSON file for development, not a multi-instance production database. Existing case, hearing, lawyer, document, and notification pages still use sample data from `src/data/mockData.ts`; the client and lawyer workspaces are not yet backed by real case-management records. Lawyer registration approval and account issuance are available, but full lawyer workflows are not implemented. Before storing real client information, replace the JSON store with a transactional database, add durable shared sessions, rate limiting, password reset and recovery, verified email, backups, monitoring, malware scanning and private document storage, and review deployment security and applicable privacy obligations.
