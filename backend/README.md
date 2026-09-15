<div align="center">

<img src="../logo2.png" alt="NTRO PRAMAAN Logo" width="100%" />

# PRAMAAN — Backend API

**FastAPI · Python 3.12 · SQLAlchemy 2.0 · PostgreSQL / SQLite**

*The cryptographic trust core of the PRAMAAN digital forensics platform.*

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [Setup & Running](#3-setup--running)
4. [Architecture Internals](#4-architecture-internals)
5. [Trust Layer — Signing & Ledger](#5-trust-layer--signing--ledger)
6. [Job Execution Service](#6-job-execution-service)
7. [Database Models](#7-database-models)
8. [API Reference](#8-api-reference)
9. [WebSocket Channels](#9-websocket-channels)
10. [Services Reference](#10-services-reference)
11. [Environment Variables](#11-environment-variables)
12. [Running Tests](#12-running-tests)
13. [Production Checklist](#13-production-checklist)
14. [Demo Screenshots](#14-demo-screenshots)

---

## 1. Overview

The backend is the authoritative hub of PRAMAAN. Every forensic operation — regardless of whether it comes from the dashboard or a CLI agent — is authenticated, cryptographically signed, chained into a tamper-evident ledger, and acknowledged with a PDF certificate.

**Responsibilities:**

- Authentication — JWT HS256 issuance, bcrypt password hashing, RBAC enforcement
- Operation Trust Layer — ECDSA P-256 signing, SHA-256 hash-chain ledger
- In-Process Engine Execution — runs all 3 forensic engines as background threads
- Case Management — full investigation lifecycle with evidence catalogue and timeline
- Device Inventory — forensic asset tracking with health and status metadata
- Task Queue — dashboard-driven job orchestration with WebSocket live progress
- Analytics & Reporting — KPI aggregates, PDF certificate generation, CSV exports
- Notifications — real-time in-app alerts for certificate issuance and tamper events
- System Logging — structured async log buffer with live WebSocket tail

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                   ← Dependency injection hub
│   │   │     get_db()                   async DB session per request
│   │   │     get_current_user()         JWT → User object
│   │   │     require_roles(*roles)      RBAC factory dependency
│   │   │     get_signing_keys()         ECDSA keypair resolver
│   │   └── v1/                       ← 17 route modules
│   │       ├── auth.py               register · login · /me
│   │       ├── operations.py         submit · list · get · pdf download
│   │       ├── verify.py             public tamper verification (no auth)
│   │       ├── cases.py              case CRUD + investigators + evidence + timeline
│   │       ├── devices.py            device inventory CRUD + filter
│   │       ├── jobs.py               task queue (9 endpoints, skip-locked claim)
│   │       ├── ws.py                 WebSocket: /jobs/{id} · /user/{id} · /logs
│   │       ├── notifications.py      notification inbox + mark-read
│   │       ├── analytics.py          summary stats + 30-day timeseries
│   │       ├── public.py             unauthenticated landing page stats
│   │       ├── search.py             cross-entity full-text search
│   │       ├── evidence.py           recovered file explorer
│   │       ├── ledger.py             hash chain view + integrity verify endpoint
│   │       ├── reports.py            certs · recovery · audit · monthly CSV
│   │       ├── settings.py           org settings key-value store (ADMIN only)
│   │       ├── system_logs.py        structured log query + level filter
│   │       └── users.py              operator list + role patch (ADMIN only)
│   │
│   ├── core/
│   │   ├── config.py                 pydantic-settings BaseSettings, env parsing
│   │   ├── crypto.py                 ECDSA P-256 sign · verify · keypair lifecycle
│   │   ├── security.py               JWT HS256 create/decode + bcrypt verify
│   │   └── logging.py                AsyncLogBuffer — batched DB writes
│   │
│   ├── db/
│   │   └── session.py                async engine + Base + AsyncSessionLocal factory
│   │
│   ├── models/                       SQLAlchemy ORM (13 tables)
│   │   ├── user.py                   User, UserRole enum
│   │   ├── operation_record.py       OperationRecord, LedgerEntry, OperationType
│   │   ├── case_management.py        Case, CaseInvestigator, CaseEvidenceItem,
│   │   │                             CaseOperationLink, CaseStatus
│   │   ├── devices.py                Device, DeviceStatus, MediaType
│   │   ├── jobs.py                   Job, TaskStatus, JobNumber
│   │   ├── notifications.py          Notification, NotificationType
│   │   ├── timeline.py               TimelineEvent
│   │   ├── setting.py                Setting (key-value)
│   │   └── system_log.py             SystemLog, LogLevel, LogCategory
│   │
│   ├── schemas/                      Pydantic v2 request/response schemas
│   │   ├── auth.py                   LoginRequest, TokenResponse, UserOut
│   │   ├── case.py                   CaseCreate, CaseOut, EvidenceItemOut
│   │   ├── device.py                 DeviceCreate, DeviceOut
│   │   ├── job.py                    JobCreate, JobOut, JobProgressUpdate
│   │   ├── operation.py              OperationReportIn, OperationRecordOut
│   │   ├── timeline.py               TimelineEventOut
│   │   ├── notification.py           NotificationOut
│   │   ├── user.py                   UserCreate, UserOut, RolePatch
│   │   └── ws.py                     WSJobEvent, WSLogEvent
│   │
│   ├── services/                     Business logic layer
│   │   ├── job_execution_service.py  ← runs all 3 engines in-process
│   │   ├── ledger_service.py         hash chain append + full integrity verify
│   │   ├── pdf_service.py            ReportLab PDF + QR code generation
│   │   ├── ws_manager.py             WebSocket connection registry + broadcast
│   │   ├── analytics_service.py      SQL KPI aggregates + timeseries buckets
│   │   ├── case_service.py           case number generation (FG-2026-000001)
│   │   ├── device_service.py         filtered device listing
│   │   ├── job_service.py            atomic skip-locked claim
│   │   ├── notification_service.py   create + broadcast notifications
│   │   └── settings_service.py       cached org settings read/write
│   │
│   ├── assets/
│   │   ├── ntro-logo.png             NTRO logo embedded in PDF certificates
│   │   └── ntro-logo2.png
│   │
│   └── main.py                       FastAPI app factory · CORS · lifespan
│
├── keys/                             Auto-generated ECDSA keypair (gitignored)
│   ├── private.pem                   P-256 private key (chmod 600)
│   └── public.pem                    P-256 public key
│
├── tests/                            pytest + pytest-asyncio test suite
│   ├── conftest.py                   In-memory SQLite + TestClient fixtures
│   ├── test_auth.py
│   ├── test_operations.py
│   ├── test_ledger_chain_api.py
│   ├── test_jobs_api.py
│   ├── test_cases_api.py
│   ├── test_devices_api.py
│   ├── test_rbac.py
│   └── ...
│
├── requirements.txt
├── Dockerfile
└── pytest.ini
```

---

## 3. Setup & Running

### Local Development (SQLite — zero config)

```bash
# From repo root, activate virtual environment first
# Windows:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start server
cd backend
uvicorn app.main:app --reload --port 8000
```

On first run:
- `forensicguard.db` is auto-created in `backend/`
- All 13 tables are created via `Base.metadata.create_all()`
- ECDSA keypair is auto-generated and saved to `backend/keys/`

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

**Interactive API docs:** http://localhost:8000/docs

### Register First Admin

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pramaan.gov.in",
    "password": "SecurePass@123",
    "full_name": "Platform Administrator",
    "role": "ADMINISTRATOR"
  }'
```

### Switch to PostgreSQL (production)

```bash
# Set in your .env or shell
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/forensicguard"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 4. Architecture Internals

### Request Lifecycle

```
Incoming HTTP Request
        │
        ▼
FastAPI router matches endpoint
        │
        ▼
Dependency injection chain:
    get_db()             → yields AsyncSession (auto-closed after request)
    get_current_user()   → decodes JWT → DB lookup → User object
    require_roles(...)   → checks user.role ∈ allowed_roles → 403 if not
        │
        ▼
Route handler executes
    └── calls service layer (ledger_service, pdf_service, etc.)
    └── service calls model layer (SQLAlchemy ORM)
    └── returns Pydantic schema response
        │
        ▼
Response serialised → JSON / StreamingResponse (PDF)
```

### Async Architecture

```
uvicorn event loop
    │
    ├── HTTP requests → FastAPI route handlers (async def)
    │       └── await db.execute(...)       [non-blocking DB]
    │       └── await ledger_service.(...)  [non-blocking]
    │
    ├── WebSocket connections → ConnectionManager
    │       └── asyncio.gather(*[ws.send_json(e) for ws in subscribers])
    │
    ├── Background job tasks → asyncio.create_task()
    │       └── asyncio.to_thread(engine_fn, payload)
    │               └── forensic engine runs in thread pool
    │                   [never blocks the event loop]
    │
    └── AsyncLogBuffer flush task
            └── runs every 1 second, batches SystemLog writes
```

### CORS Policy

```python
# Development (ENVIRONMENT=development):  allow_origins=["*"]
# Production:                             allow_origins=[PUBLIC_BASE_URL] + EXTRA_CORS_ORIGINS
```

---

## 5. Trust Layer — Signing & Ledger

This is the most critical module. Every operation record — regardless of type — passes through the same pipeline.

### Signing Process

```
operation result dict
        │
        ▼
canonical_json(data)
    → json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
    → deterministic bytes regardless of upstream dict ordering
        │
        ▼
SHA-256(canonical_bytes)  →  report_hash  (64 hex chars)
        │
        ▼
ECDSA P-256 sign(canonical_bytes, private_key)
    → signature (DER-encoded, hex string)
    → private key NEVER leaves the backend server
        │
        ▼
OperationRecord saved with:
    report_hash = "<64 hex chars>"
    signature   = "<DER hex string>"
```

### Signable Fields (stable — never change without invalidating past signatures)

```python
{
    "certificate_id":     str,   # UUID
    "operation_type":     str,   # "DRIVE_ERASE" | "FILE_ERASE" | "RECOVERY"
    "target_description": str,   # human-readable target
    "started_at":         str,   # UTC ISO 8601
    "completed_at":       str,   # UTC ISO 8601
    "success":            bool,
    "operator":           str,   # authenticated JWT email — NOT client-supplied
    "details":            dict,  # module-specific payload
}
```

### Ledger Chain

```
GENESIS_HASH = "0" * 64    (publicly known starting value)

LedgerEntry 1:
    previous_hash = GENESIS_HASH
    entry_hash    = SHA-256( GENESIS_HASH + record_1.report_hash )

LedgerEntry 2:
    previous_hash = LedgerEntry_1.entry_hash
    entry_hash    = SHA-256( LedgerEntry_1.entry_hash + record_2.report_hash )

LedgerEntry N:
    previous_hash = LedgerEntry_(N-1).entry_hash
    entry_hash    = SHA-256( previous_hash + record_N.report_hash )

─────────────────────────────────────────────────────────────────
  Tamper record N → report_hash changes → entry_hash(N) changes
  → entry_hash(N+1) recomputation fails
  → verify_chain_integrity() returns broken_at_sequence = N
  → TAMPER_DETECTED notification broadcast
─────────────────────────────────────────────────────────────────
```

**Key property:** `append_to_ledger()` is called inside the **same DB transaction** as the `OperationRecord` insert — they commit atomically. Either both succeed or neither does.

### Key Persistence (priority order)

```
1. SIGNING_PRIVATE_KEY_PEM env var   ← production / secrets manager (highest)
2. backend/keys/private.pem          ← dev persistence (auto-loaded if exists)
3. Auto-generate + write to keys/    ← first-run self-healing (lowest)
```

> Docker volume `keys_data` mounts at `/app/keys` — keys survive `docker compose down && up`.

---

## 6. Job Execution Service

`app/services/job_execution_service.py` is the bridge between the dashboard and the three forensic engines. No separate CLI process is required for dashboard-initiated jobs.

### How Engine Loading Works

```python
_REPO_ROOT          = Path(__file__).resolve().parents[3]
_FILE_ERASER_ROOT   = _REPO_ROOT / "file-folder-eraser"
_RECOVERY_ROOT      = _REPO_ROOT / "recovery-engine"
_DRIVE_ERASER_ROOT  = _REPO_ROOT / "drive-eraser-agent"

# At job execution time:
sys.path.insert(0, str(_RECOVERY_ROOT))              # add engine to Python path
run_recovery = importlib.import_module(              # import engine code
    "src.recovery_engine"
).run_recovery
result = await asyncio.to_thread(run_recovery, ...)  # run in thread pool
```

An `_isolated_agent_imports()` context manager prevents `src.*` namespace leakage between engines — each engine's `src` package is loaded, used, then unloaded from `sys.modules`.

### Job Lifecycle

```
Job created (PENDING)
        │
        ▼
asyncio.create_task(execute_xxx_job(job_id, operator_email))
        │
        ▼
Job → CLAIMED  (WebSocket push)
        │
        ▼
Job → RUNNING  (WebSocket push, progress_percent=5)
        │
        ▼
asyncio.to_thread(engine_fn, payload)
    └── engine runs in background thread
    └── returns report dict
        │
        ▼
_record_operation():
    sign_payload()           → SHA-256 + ECDSA signature
    OperationRecord saved
    append_to_ledger()       → chained hash entry
    notification_service()   → CERT_GENERATED notification
        │
        ▼
Job → COMPLETED (progress_percent=100, certificate_id attached)
        │
        ▼
WebSocket push → browser updates
```

---

## 7. Database Models

### Full Schema

```
┌─────────────────────────────────────────────────────────────┐
│  users                                                      │
│  id (UUID PK), email (unique), hashed_password, role,       │
│  full_name, is_active, created_at                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ FK: lead_investigator_id
┌───────────────────────────▼─────────────────────────────────┐
│  cases                                                      │
│  id (UUID PK), case_number (FG-2026-000001, unique),         │
│  title, description, status, lead_investigator_id,          │
│  created_at, updated_at                                     │
└──┬──────────────┬────────────────┬───────────────┬──────────┘
   │              │                │               │
   ▼              ▼                ▼               ▼
case_          case_evidence_  case_operation_  timeline_
investigators  items            links            events
(case×user×    (case×type×     (case×           (case×type×
 is_lead)       details)        operation_id)    actor×payload)

┌─────────────────────────────────────────────────────────────┐
│  operation_records                                          │
│  certificate_id (UUID PK), operation_type (enum),           │
│  target_description, started_at, completed_at,              │
│  success, operator (email), details (JSON),                 │
│  report_hash (SHA-256), signature (ECDSA hex)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ FK: operation_record_id
┌───────────────────────────▼─────────────────────────────────┐
│  ledger_entries                                             │
│  id (UUID PK), sequence_number (unique, auto-increment),    │
│  operation_record_id (FK), report_hash,                     │
│  previous_hash, entry_hash                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  jobs                                                       │
│  id (UUID PK), job_number (FGJ-2026-0000001, unique),        │
│  operation_type (enum), payload (JSON), status (enum),      │
│  progress_percent, stage, message, error_message,           │
│  assigned_agent_id, certificate_id,                         │
│  claimed_at, started_at, completed_at, retry_count          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  devices                                                    │
│  id (UUID PK), serial_number (unique), model,               │
│  media_type (enum), connection_type, health, status (enum), │
│  last_seen_at, details (JSON)                               │
└─────────────────────────────────────────────────────────────┘

notifications  → id, user_id (nullable), type (enum), title,
                 message, read_at, created_at

settings       → id, setting_key (unique), setting_value, updated_at

system_logs    → id, level (enum), category (enum), source,
                 message, details (JSON), created_at
```

---

## 8. API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Create operator account |
| POST | `/api/v1/auth/login` | — | Login → JWT token |
| GET | `/api/v1/auth/me` | JWT | Current user profile |

### Operations

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/api/v1/operations` | JWT | All | Submit signed forensic operation |
| GET | `/api/v1/operations` | JWT | All | List operations (filter: type, success, date) |
| GET | `/api/v1/operations/{id}` | JWT | All | Single record + verification result |
| GET | `/api/v1/operations/{id}/pdf` | JWT | All | Download PDF certificate |
| GET | `/api/v1/verify/{certId}` | — | Public | Tamper verification (no login) |

### Cases

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/cases` | JWT | Create case |
| GET | `/api/v1/cases` | JWT | List cases (filter: status, investigator) |
| GET | `/api/v1/cases/{id}` | JWT | Case detail |
| PATCH | `/api/v1/cases/{id}` | JWT | Update case |
| POST | `/api/v1/cases/{id}/investigators` | JWT | Add investigator |
| DELETE | `/api/v1/cases/{id}/investigators/{uid}` | JWT | Remove investigator |
| POST | `/api/v1/cases/{id}/evidence` | JWT | Add evidence item |
| GET | `/api/v1/cases/{id}/evidence` | JWT | List evidence |
| GET | `/api/v1/cases/{id}/timeline` | JWT | Case timeline events |
| POST | `/api/v1/cases/{id}/operations` | JWT | Link operation to case |

### Devices

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/devices` | JWT | Register device |
| GET | `/api/v1/devices` | JWT | List devices (filter: status, type, health) |
| GET | `/api/v1/devices/{id}` | JWT | Device detail |
| PATCH | `/api/v1/devices/{id}` | JWT | Update device |
| DELETE | `/api/v1/devices/{id}` | JWT | Remove device |

### Jobs (Task Queue)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/jobs` | JWT | Create job (optionally auto-execute) |
| GET | `/api/v1/jobs` | JWT | List jobs (filter: status, type) |
| GET | `/api/v1/jobs/{id}` | JWT | Job detail + progress |
| POST | `/api/v1/jobs/{id}/cancel` | JWT | Cancel pending/running job |
| POST | `/api/v1/jobs/claim` | JWT | Claim next pending job (agent) |
| PATCH | `/api/v1/jobs/{id}/progress` | JWT | Update progress % + stage |
| POST | `/api/v1/jobs/{id}/complete` | JWT | Mark completed + attach cert |
| POST | `/api/v1/jobs/{id}/fail` | JWT | Mark failed + error message |

### Ledger

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/ledger/chain` | JWT | Paginated ledger entries |
| GET | `/api/v1/ledger/chain/verify` | JWT | Verify full chain from genesis |

### Analytics & Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/analytics/summary` | JWT | KPI stat cards |
| GET | `/api/v1/analytics/timeseries` | JWT | 30-day operation counts |
| GET | `/api/v1/reports/certificates` | JWT | Certificate report (filterable) |
| GET | `/api/v1/reports/certificates/download.csv` | JWT | CSV export |
| GET | `/api/v1/reports/recovery` | JWT | Recovery summary report |
| GET | `/api/v1/reports/audit` | JWT | Audit report (AUDITOR+) |
| GET | `/api/v1/reports/monthly` | JWT | Monthly aggregate |
| GET | `/api/v1/public/stats` | — | Landing page platform stats |

### Users, Settings, System Logs

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/v1/users` | JWT | ADMIN, SUPERVISOR | List operators |
| PATCH | `/api/v1/users/{id}/role` | JWT | ADMIN | Change user role |
| GET | `/api/v1/settings` | JWT | ADMIN | Get org settings |
| PATCH | `/api/v1/settings` | JWT | ADMIN | Update org settings |
| GET | `/api/v1/system-logs` | JWT | ADMIN, AUDITOR, SUPERVISOR | Query logs |
| GET | `/api/v1/search` | JWT | All | Cross-entity search |
| GET | `/api/v1/notifications` | JWT | All | Notification inbox |
| PATCH | `/api/v1/notifications/{id}/read` | JWT | All | Mark notification read |

---

## 9. WebSocket Channels

All three channels require JWT authentication via `?token=<JWT>` query param.

### Job Progress — `/api/v1/ws/jobs/{jobId}`

Accessible by any authenticated user.

```json
{
  "type": "PROGRESS",
  "job_id": "abc-123",
  "status": "RUNNING",
  "progress_percent": 60,
  "stage": "CARVING",
  "message": "Scanning for JPEG signatures at offset 2048000"
}
```

```json
{
  "type": "COMPLETED",
  "job_id": "abc-123",
  "status": "COMPLETED",
  "progress_percent": 100,
  "stage": "COMPLETED",
  "certificate_id": "CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### User Notifications — `/api/v1/ws/user/{userId}`

```json
{
  "type": "CERT_GENERATED",
  "certificate_id": "CERT-xxx",
  "message": "Certificate issued for FILE_ERASE operation"
}
```

```json
{
  "type": "TAMPER_DETECTED",
  "broken_at_sequence": 7,
  "reason": "entry_hash does not match recomputed hash"
}
```

### Live Log Stream — `/api/v1/ws/logs`

ADMINISTRATOR, AUDITOR, SUPERVISOR only.

```json
{
  "type": "LOG",
  "level": "WARNING",
  "category": "SECURITY",
  "source": "auth.py",
  "message": "Failed login attempt for unknown@example.com",
  "timestamp": "2026-09-13T10:42:01Z"
}
```

### ConnectionManager internals

```
ws_manager.ConnectionManager
    │
    ├── connections: dict[str, set[WebSocket]]
    │     "job:<job_id>"   → set of job subscriber sockets
    │     "user:<user_id>" → set of user subscriber sockets
    │     "logs"           → set of log subscriber sockets
    │
    ├── connect(ws, channel, key)    → adds to set
    ├── disconnect(ws)               → removes from all sets
    └── broadcast_job_event(job_id, type, data)
              └── asyncio.gather(*[ws.send_json(event) for ws in subs])
```

---

## 10. Services Reference

| Service | File | Key Function |
|---|---|---|
| **Ledger** | `ledger_service.py` | `append_to_ledger(db, record)` — atomic chain append. `verify_chain_integrity(db)` — O(n) full walk from genesis. |
| **PDF** | `pdf_service.py` | `generate_certificate_pdf(record, verify_url)` — ReportLab A4 PDF with NTRO header, QR code, SHA-256, ECDSA signature, formal attestation box. |
| **WS Manager** | `ws_manager.py` | `broadcast_job_event()`, `broadcast_user_event()`, `broadcast_log_event()` — fire-and-forget via `asyncio.create_task`. |
| **Job Execution** | `job_execution_service.py` | `execute_file_erase_job()`, `execute_recovery_job()`, `execute_drive_erase_job()` — in-process engine orchestration. |
| **Analytics** | `analytics_service.py` | `get_summary_stats()` — 7 KPI cards. `get_timeseries(days=30)` — bucketed daily counts. |
| **Case** | `case_service.py` | `generate_case_number()` — produces `FG-{year}-{seq:06d}` serially. |
| **Job** | `job_service.py` | `claim_next_job(db, type)` — `SELECT FOR UPDATE SKIP LOCKED` for race-safe claiming. |
| **Notification** | `notification_service.py` | `notify_cert_generated()`, `notify_tamper_detected_broadcast()`. |
| **Settings** | `settings_service.py` | `get_setting(key)`, `set_setting(key, value)` — cached org config. |

---

## 11. Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./forensicguard.db` | No | DB connection string |
| `ENVIRONMENT` | `development` | No | `development` or `production` (affects CORS) |
| `JWT_SECRET_KEY` | `change-me` | **Yes** | JWT signing secret (min 32 chars) |
| `JWT_ALGORITHM` | `HS256` | No | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | No | Token lifetime in minutes |
| `SIGNING_PRIVATE_KEY_PEM` | auto-generated | No | ECDSA P-256 private key (PEM string) |
| `SIGNING_PUBLIC_KEY_PEM` | auto-generated | No | ECDSA P-256 public key (PEM string) |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | No | Frontend URL — used in QR codes + CORS |
| `EXTRA_CORS_ORIGINS` | `` | No | Comma-separated extra allowed origins |
| `APP_NAME` | `PRAMAAN` | No | Platform display name |

### Generate a secure JWT secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Generate an ECDSA keypair

```bash
cd backend
python -c "
from app.core.crypto import generate_keypair
priv, pub = generate_keypair()
print('SIGNING_PRIVATE_KEY_PEM=' + priv.replace(chr(10), '\\\\n'))
print('SIGNING_PUBLIC_KEY_PEM='  + pub.replace(chr(10), '\\\\n'))
"
```

---

## 12. Running Tests

```bash
cd backend

# Full suite (in-memory SQLite, no external services needed)
pytest -v

# Specific module
pytest tests/test_auth.py -v
pytest tests/test_operations.py -v
pytest tests/test_ledger_chain_api.py -v
pytest tests/test_jobs_api.py -v
pytest tests/test_cases_api.py -v
pytest tests/test_rbac.py -v

# Quiet summary with short tracebacks
pytest --tb=short -q

# With coverage (install pytest-cov first)
pytest --cov=app --cov-report=term-missing
```

All tests use `pytest-asyncio` with a fresh in-memory SQLite database provisioned per session by `conftest.py`. No PostgreSQL, no running server, no real files required.

---

## 13. Production Checklist

```
Security
  [ ] JWT_SECRET_KEY = cryptographically random 48+ byte value
  [ ] SIGNING_PRIVATE_KEY_PEM / PUBLIC injected from secrets manager
  [ ] ENVIRONMENT=production (CORS restricted to PUBLIC_BASE_URL)
  [ ] Rate limiting on /auth/login and /auth/register
  [ ] TLS termination via Nginx / load balancer

Database
  [ ] DATABASE_URL = postgresql+asyncpg://...
  [ ] Mount keys_data Docker volume (or use env-var keys)
  [ ] Set up Alembic migrations before first deploy
  [ ] Enable PostgreSQL connection pooling (PgBouncer)

Operations
  [ ] Rotate signing keypair periodically + log rotation date
  [ ] Set up log aggregation (backend system_logs → external SIEM)
  [ ] Configure backup for postgres_data volume
  [ ] Health check: GET /health → {"status": "ok"}
```

---

## 14. Demo Screenshots

### Swagger UI (Interactive API Docs)
```
[ Screenshot — /docs Swagger UI showing all 17 route modules ]
  Path: ../docs/screenshots/swagger-ui.png
```

### Operation Record — Signed Response
```
[ Screenshot — POST /api/v1/operations response with certificate_id,
  report_hash, signature, ledger_sequence_number ]
  Path: ../docs/screenshots/operation-response.png
```

### Chain Verify Response
```
[ Screenshot — GET /api/v1/ledger/chain/verify returning
  { valid: true, total_entries: 12 } ]
  Path: ../docs/screenshots/chain-verify.png
```

### Live WebSocket Log Stream
```
[ Screenshot — /dashboard/system-logs live console with
  coloured log entries streaming via WebSocket ]
  Path: ../docs/screenshots/system-logs-ws.png
```

---

*Part of the PRAMAAN platform — see [root README](../README.md) for full system documentation.*
