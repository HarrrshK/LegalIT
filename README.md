# LegalIt

LegalIt is a React and TypeScript legal portal prototype with a Node.js API for account access, administrator provisioning, audit events, and Groq-powered legal information answers.

## Run locally

Requires Node.js 20 or newer.

### Windows one-click setup

Install Node.js 20 or newer, extract the project folder, and double-click `install.bat`. On the first run it asks for a Groq API key, creates the private `.env` file, installs dependencies, starts both servers, and opens LegalIt in the default browser. Later runs reuse the existing `.env`.

Never send a populated `.env` file to someone else. Each installation should use its own Groq key.

Start the complete app from the project folder:

```bash
npm run dev
```

This starts both the frontend and the account API. Open the local URL printed next to `WEB`. Client registration and sign-in work without any environment setup.

To include an administrator account, set a unique administrator email and a password with at least 16 characters before starting the app. Add the Groq key if you want the AI assistant enabled.

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='use-a-long-unique-password-here' GROQ_API_KEY='your-groq-api-key' npm run dev
```

The first run provisions the administrator. Its credentials are stored as a password hash in `data/store.json`. Keep this file private and backed up. The API defaults to port 3001.

For frontend-only work, use:

```bash
npm run client
```

## Account commands

Stop the app before using these commands so the running API cannot overwrite the data file.

Create an active client account and print its generated user ID and temporary password:

```bash
npm run account:create -- --role client --name "Client Name" --email "client@example.com"
```

Create an active legal professional account:

```bash
npm run account:create -- --role lawyer --name "Lawyer Name" --email "lawyer@example.com"
```

Both account types must replace the temporary password on first sign-in. To erase every local account and audit event:

```bash
npm run data:reset -- --yes
```

After a reset, restart the app. An administrator account will be recreated only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are supplied.

To build the static frontend, run `npm run build`. The API runs separately with `npm run api`.

## Accounts and permissions

- Clients can register and sign in with email or their generated user ID.
- Clients and legal professionals can register and sign in immediately.
- Clients can describe an issue, use the configured AI service to prepare an editable case draft, select an active legal professional, and submit the case.
- A submitted case is persisted and appears in both the creating client's workspace and the selected legal professional's workspace.
- Legal professionals use the full dashboard and can accept or reject cases assigned to them. Decisions are persisted, added to the case timeline, and shown to the client.
- An authenticated administrator can issue client or professional accounts, receive a one-time user ID and temporary password, suspend or restore accounts, and review the audit log.
- Issued passwords must be changed at first sign-in.
- The first administrator is created from server environment variables; there is no hidden master password or browser-side admin bypass.
- Sign-in sessions use HTTP-only, same-site cookies. Sessions expire after 12 hours or when the API process restarts.

## Groq AI

The browser sends questions to `/api/ai/chat`. The server calls Groq using `GROQ_API_KEY`, so the key is not included in frontend code. `GROQ_MODEL` can override the default `llama-3.3-70b-versatile` model. AI responses are general legal information and may be incomplete or incorrect; they are not legal advice. The current endpoint does not retrieve verified legal sources or client case files, so it must not be described as citation-grounded RAG.

## Current limitations

The account, audit, and case store is a local JSON file for development, not a multi-instance production database. New accounts start with no cases, documents, hearings, assigned lawyers, notifications, or messages. Administrators can persist a case and link it to a client and legal professional; linked cases appear in both workspaces. Document file storage, hearing editing, messaging, and consultation booking are not yet implemented. Before storing real client information, replace the JSON store with a transactional database, add durable shared sessions, rate limiting, password reset and recovery, verified email, backups, monitoring, malware scanning and private document storage, and review deployment security and applicable privacy obligations.
