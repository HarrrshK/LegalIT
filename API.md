# API

All new endpoints use `/api/v1`. OpenAPI is available at `/api/v1/docs` in environments where documentation is enabled.

## Implemented endpoints

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Process and database connectivity health |
| POST | `/api/v1/auth/register` | Public | Register a client or lawyer and start a session |
| POST | `/api/v1/auth/login` | Public | Start a durable cookie session |
| GET | `/api/v1/auth/me` | Session | Return the authenticated account |
| POST | `/api/v1/auth/logout` | Session optional | Revoke the current session |
| GET | `/api/v1/lawyers/me/verification` | Lawyer | View own verification status |
| POST | `/api/v1/lawyers/me/verification/submit` | Lawyer | Submit a draft or corrected verification |
| GET | `/api/v1/admin/lawyer-verifications` | Admin | List submitted verification records |
| POST | `/api/v1/admin/lawyer-verifications/{id}/review` | Admin | Approve, reject, or request changes |
| GET/PATCH | `/api/v1/profiles/me*` | Client/Lawyer | Read or update the current profile |
| GET | `/api/v1/lawyers` | Public | Search approved visible lawyers |
| GET/POST/PATCH | `/api/v1/consultations*` | Participant/Admin | Consultation workflow |
| GET/POST/PATCH | `/api/v1/cases*` | Case member/Lawyer | Case intake and management |
| GET/POST | `/api/v1/cases/{id}/notes` | Case member/Lawyer | Shared or internal notes |
| GET/POST | `/api/v1/cases/{id}/tasks` | Case member/Lawyer | Tasks and deadlines |
| GET/POST | `/api/v1/cases/{id}/documents` | Case member | Authorized document access |
| GET/PATCH | `/api/v1/documents/{id}/*` | Case member/Lawyer | Download and sharing controls |
| GET/POST | `/api/v1/cases/{id}/messages` | Case member | Case messages |
| GET/POST | `/api/v1/appointments*` | Case member/Lawyer | Visible appointments |
| GET/POST | `/api/v1/notifications*` | Account owner | Notifications and read state |
| GET | `/api/v1/research/search` | Session | FTS5 legal search |
| POST | `/api/v1/research/ask` | Session | Retrieved, citation-validated answer |
| GET | `/api/v1/news` | Session | Sourced legal news |
| GET/PATCH/POST | `/api/v1/admin/*` | Admin | Metrics, accounts, cases, audit, verification |

Public registration accepts only client and lawyer roles. Administrator accounts are created from the local management command. The unversioned routes in `server/index.mjs` are legacy and scheduled for replacement.
