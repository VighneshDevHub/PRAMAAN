<div align="center">

<img src="logo2.png" alt="NTRO PRAMAAN Logo" width="100%" />

# प्रमाण — PRAMAAN

### Digital Forensics & Evidence Integrity Platform

**SIH 2026 · Problem ID 26149 · Ministry of Home Affairs / NTRO**

---

*Government-grade digital forensics platform with cryptographic tamper-evidence, secure data sanitisation, deleted file recovery, and court-admissible certificate generation.*

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://docker.com)

</div>

---

## Table of Contents

1. [What is PRAMAAN?](#1-what-is-pramaan)
2. [System Architecture](#2-system-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Technology Stack](#4-technology-stack)
5. [Core Modules](#5-core-modules)
6. [End-to-End Flow](#6-end-to-end-flow)
7. [Security & Trust Model](#7-security--trust-model)
8. [Quick Start — Local Dev](#8-quick-start--local-dev)
9. [Docker Deployment](#9-docker-deployment)
10. [Environment Variables](#10-environment-variables)
11. [API Overview](#11-api-overview)
12. [WebSocket Events](#12-websocket-events)
13. [Role-Based Access Control](#13-role-based-access-control)
14. [Running Tests](#14-running-tests)
15. [Demo Screenshots](#15-demo-screenshots)
16. [Compliance Standards](#16-compliance-standards)
17. [Roadmap](#17-roadmap)

---

## 1. What is PRAMAAN?

**PRAMAAN** (Hindi: *प्रमाण* — proof, evidence) is a full-stack, enterprise-grade digital forensics platform designed for India's law enforcement, intelligence, and judicial agencies. Every forensic operation — whether erasing a seized drive, recovering deleted files, or cataloguing evidence — is:

- **Cryptographically signed** with ECDSA P-256 at the moment of completion
- **Chained** into a tamper-evident ledger using SHA-256 hash chains (blockchain-style)
- **Auditable** with a court-admissible PDF certificate and QR-verifiable digital signature
- **Role-controlled** through four-tier RBAC (Administrator → Supervisor → Investigator → Auditor)
- **Real-time tracked** via WebSocket job progress streams

PRAMAAN is not a single tool — it is a **platform** composed of five integrated components:

| Component | Role |
|---|---|
| `backend/` | FastAPI REST + WebSocket API. The cryptographic trust core. |
| `frontend/` | Next.js 14 government-grade operator dashboard |
| `drive-eraser-agent/` | Python CLI — NIST SP 800-88 compliant drive sanitisation |
| `file-folder-eraser/` | Python CLI — selective secure file/folder deletion |
| `recovery-engine/` | Python CLI — signature-based deleted file recovery |

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OPERATOR BROWSER                                   │
│              Next.js 14  ·  Government UI  ·  PRAMAAN Console               │
│   Landing  │  Login  │  Dashboard  │  Cases  │  Jobs  │  Devices  │ Reports │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │  HTTPS / WSS
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRAMAAN BACKEND                                    │
│                      FastAPI  ·  Python 3.12  ·  Uvicorn                    │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │     Auth     │  │    Cases     │  │  Jobs/Queue  │  │  Trust Layer   │  │
│  │  JWT HS256   │  │  Evidence    │  │  WS Push     │  │  ECDSA Sign    │  │
│  │  RBAC        │  │  Timeline    │  │  Progress    │  │  SHA-256 Hash  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Devices    │  │    Ledger    │  │   Reports    │  │   Analytics    │  │
│  │  SMART Meta  │  │  SHA-256     │  │  PDF/CSV     │  │  Notifications │  │
│  │  Inventory   │  │  Chain       │  │  QR Code     │  │  System Logs   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │  SQLAlchemy async
                                   ▼
                    ┌──────────────────────────────┐
                    │   PostgreSQL 16 / SQLite      │
                    │   (13 tables, indexed)        │
                    └──────────────────────────────┘

        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │  Drive Eraser    │  │  File / Folder   │  │    Recovery      │
        │     Agent        │  │     Eraser       │  │     Engine       │
        │  Python CLI      │  │  Python CLI      │  │  Python CLI      │
        │  NIST 800-88     │  │  Multi-pass      │  │  File Carving    │
        └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                     │                      │
                 └─────────────────────┴──────────────────────┘
                                       │
                    Loaded in-process by backend via
                    job_execution_service.py (no separate process needed)
```

### Component Communication Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  How the 3 forensic engines connect to the backend                   │
│                                                                      │
│  Option A — Dashboard Job (most common)                              │
│  ─────────────────────────────────────                               │
│  Browser  →  POST /api/v1/jobs  →  Backend creates Job (PENDING)     │
│                                 →  asyncio.create_task()             │
│                                 →  job_execution_service.py          │
│                                 →  sys.path trick → imports engine   │
│                                 →  asyncio.to_thread() → runs engine │
│                                 →  result signed + ledger appended   │
│                                 →  WebSocket push → Browser updates  │
│                                                                      │
│  Option B — CLI Agent (external / hardware access)                   │
│  ──────────────────────────────────────────────────                  │
│  CLI Agent  →  POST /api/v1/auth/login   →  JWT token                │
│             →  [runs forensic operation locally]                     │
│             →  POST /api/v1/operations   →  Signs + Ledger           │
│             →  Certificate ID returned                               │
│             →  GET  /api/v1/operations/{id}/pdf → PDF Certificate    │
└──────────────────────────────────────────────────────────────────────┘
```

### Database Schema Diagram

```
users ──────────────────────────────────────────────────────────────────┐
  id, email, hashed_password, role, full_name, created_at               │
                                                                        │
operation_records ──────────────────────────────────────────────────────┤
  certificate_id (PK), operation_type, target_description,              │
  started_at, completed_at, success, operator, details (JSON),          │
  report_hash, signature                                                 │
        │                                                               │
        ▼                                                               │
ledger_entries                                                          │
  id, sequence_number (unique), operation_record_id (FK),               │
  report_hash, previous_hash, entry_hash                                │
                                                                        │
cases ──────────────────────────────────────────────────────────────────┤
  id, case_number (FG-2026-000001), title, status, lead_investigator_id │
        │                                                               │
        ├──► case_investigators  (case_id × user_id × is_lead)          │
        ├──► case_evidence_items (case_id × evidence_type × details)    │
        ├──► case_operation_links (case_id × operation_record_id)       │
        └──► timeline_events (case_id × event_type × actor × payload)  │
                                                                        │
devices                                                                 │
  id, serial_number (unique), model, media_type, connection_type,       │
  health, status, last_seen_at                                          │
                                                                        │
jobs                                                                    │
  id, job_number (FGJ-2026-0000001), operation_type, payload (JSON),    │
  status, progress_percent, stage, assigned_agent_id, certificate_id   │
        │
        ▼
notifications  (user_id nullable for broadcasts)
settings       (key-value store for org config)
system_logs    (level, category, source, message, details JSON)
```

---

## 3. Repository Structure

```
PRAMAAN/
│
├── backend/                          ← FastAPI application (trust core)
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               get_db · get_current_user · require_roles
│   │   │   └── v1/                   17 route modules
│   │   │       ├── auth.py           register · login · /me
│   │   │       ├── operations.py     submit · list · get · pdf download
│   │   │       ├── verify.py         public tamper verification (no auth)
│   │   │       ├── cases.py          case CRUD + investigators + evidence + timeline
│   │   │       ├── devices.py        device inventory CRUD
│   │   │       ├── jobs.py           task queue (9 endpoints, skip-locked claim)
│   │   │       ├── ws.py             WebSocket: /jobs/{id} · /user/{id} · /logs
│   │   │       ├── notifications.py  notification inbox + mark-read
│   │   │       ├── analytics.py      summary stats + 30-day timeseries
│   │   │       ├── public.py         unauthenticated platform stats
│   │   │       ├── search.py         cross-entity full-text search
│   │   │       ├── evidence.py       recovered file explorer
│   │   │       ├── ledger.py         hash chain view + integrity verify
│   │   │       ├── reports.py        certificate · recovery · audit · monthly
│   │   │       ├── settings.py       org settings (ADMIN only)
│   │   │       ├── system_logs.py    structured log query
│   │   │       └── users.py          operator list + role management
│   │   ├── core/
│   │   │   ├── config.py             pydantic-settings env config
│   │   │   ├── crypto.py             ECDSA P-256 sign · verify · keypair lifecycle
│   │   │   ├── security.py           JWT HS256 + bcrypt (separate from crypto)
│   │   │   └── logging.py            AsyncLogBuffer singleton
│   │   ├── db/
│   │   │   └── session.py            async engine + Base + AsyncSessionLocal
│   │   ├── models/                   13 SQLAlchemy ORM models
│   │   ├── schemas/                  Pydantic v2 request/response schemas
│   │   ├── services/                 Business logic (10 service modules)
│   │   │   ├── job_execution_service.py  ← runs all 3 engines in-process
│   │   │   ├── ledger_service.py         hash chain append + verify
│   │   │   ├── pdf_service.py            ReportLab PDF + QR code
│   │   │   ├── ws_manager.py             WebSocket connection registry
│   │   │   ├── analytics_service.py
│   │   │   ├── case_service.py
│   │   │   ├── device_service.py
│   │   │   ├── job_service.py
│   │   │   ├── notification_service.py
│   │   │   └── settings_service.py
│   │   └── main.py                   FastAPI app factory · CORS · lifespan
│   ├── keys/                         auto-generated ECDSA keypair (gitignored)
│   ├── tests/                        pytest suite (20+ test files)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pytest.ini
│
├── frontend/                         ← Next.js 14 App Router dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              Public landing page (9 sections)
│   │   │   ├── login/page.tsx        Login form
│   │   │   ├── verify/[certId]/      Public certificate verification
│   │   │   └── dashboard/            Protected operator console
│   │   │       ├── page.tsx          Analytics overview
│   │   │       ├── cases/            Case management + detail
│   │   │       ├── devices/          Device inventory
│   │   │       ├── jobs/             Task queue + live progress
│   │   │       ├── ledger/           Hash chain visualizer
│   │   │       ├── reports/          Report center (4 tabs)
│   │   │       ├── search/           Global cross-entity search
│   │   │       ├── settings/         Org settings (ADMIN)
│   │   │       ├── system-logs/      Live log stream console
│   │   │       └── users/            Operator management (ADMIN)
│   │   ├── components/
│   │   │   ├── AppShell.tsx          Topbar + sidebar + notifications
│   │   │   ├── ThemeProvider.tsx     govt-light / govt-dark themes
│   │   │   ├── cases/                TimelineRail + EvidenceExplorer
│   │   │   └── jobs/                 JobRow + JobProgressBar + templates
│   │   └── lib/
│   │       ├── api.ts                All API wrapper functions
│   │       ├── types.ts              TypeScript types mirroring backend
│   │       ├── auth.ts               localStorage JWT helpers
│   │       └── ws.ts                 useJobSocket · useUserSocket · useLogsSocket
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── recovery-engine/                  ← Deleted file recovery CLI
│   ├── src/
│   │   ├── main.py                   CLI entry point
│   │   ├── recovery_engine.py        Pipeline orchestrator
│   │   ├── image_reader.py           Read-only evidence image + SHA-256
│   │   ├── carver.py                 Signature-based file carving
│   │   ├── signatures.py             Header/footer database (12+ types)
│   │   ├── classifier.py             Structural file validation (Pillow)
│   │   ├── confidence_scorer.py      0.0–1.0 per-file confidence
│   │   ├── report_builder.py         Build report dict for backend
│   │   └── api_client.py             Backend HTTP client
│   ├── tests/
│   └── requirements.txt
│
├── file-folder-eraser/               ← Selective file/folder erasure CLI
│   ├── src/
│   │   ├── main.py                   CLI entry point
│   │   ├── batch_runner.py           Multi-file orchestration
│   │   ├── selective_deleter.py      3-pass overwrite + unlink
│   │   ├── metadata_scrubber.py      Zero timestamps + rename before delete
│   │   ├── freespace_overwriter.py   Overwrite slack space post-deletion
│   │   ├── report_builder.py
│   │   └── api_client.py
│   ├── tests/
│   └── requirements.txt
│
├── drive-eraser-agent/               ← NIST drive sanitisation CLI
│   ├── src/
│   │   ├── main.py                   CLI entry point + orchestrator
│   │   ├── method_selector.py        Auto-select wipe method
│   │   ├── verifier.py               Pre/post-wipe sampling
│   │   ├── report_builder.py
│   │   ├── api_client.py
│   │   ├── detectors/
│   │   │   ├── file_target.py        Safe demo mode (file as device)
│   │   │   ├── windows_block_device.py
│   │   │   └── linux_block_device.py
│   │   └── wipers/
│   │       ├── clear.py              NIST Clear (0x00, 0xFF, random)
│   │       ├── purge.py              NIST Purge (ATA Secure Erase)
│   │       └── crypto_erase.py       Crypto Erase (key destruction)
│   ├── tests/
│   └── requirements.txt
│
├── docs/
│   ├── DEPLOYMENT.md                 Full deployment guide
│   ├── MANUAL_TESTING_GUIDE.md       Step-by-step test scenarios
│   ├── END_TO_END_TESTING_GUIDE.md
│   ├── DEMO_JUDGE_GUIDE.md           SIH judge walkthrough
│   └── DEPLOY_FREE.md                Railway free-tier deployment
│
├── docker-compose.yml                PostgreSQL + Backend + Frontend
├── .env.example                      Environment variable template
└── README.md                         ← You are here
```

---

## 4. Technology Stack

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | FastAPI | 0.115+ | Async REST + WebSocket API |
| Runtime | Python | 3.12 | Core language |
| ASGI Server | Uvicorn | latest | Production server |
| ORM | SQLAlchemy | 2.0+ | Async database access |
| DB (dev) | SQLite + aiosqlite | 3.x | Zero-config local development |
| DB (prod) | PostgreSQL + asyncpg | 16 | Production persistence |
| Auth | python-jose + passlib | latest | JWT HS256 + bcrypt |
| Cryptography | cryptography | 43.0+ | ECDSA P-256 signing |
| PDF | reportlab + qrcode | latest | Signed certificate generation |
| Validation | Pydantic v2 | 2.9+ | Schema validation |
| Config | pydantic-settings | 2.6+ | Env-based configuration |
| Testing | pytest + pytest-asyncio + httpx | latest | Async API tests |

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 14.2 | App Router, SSR/CSR |
| Language | TypeScript | 5.5 | Type safety |
| Styling | Tailwind CSS | 3.4 | Government design system |
| Real-time | WebSocket (native) | — | Job progress + log streaming |
| State | React hooks | 18.3 | Local component state |
| HTTP | fetch (native) | — | No external HTTP client |

### Forensic Engines (Python CLIs)

| Agent | Key Libraries | Standards |
|---|---|---|
| `drive-eraser-agent` | httpx | NIST SP 800-88 Rev.1 |
| `file-folder-eraser` | httpx | DoD 5220.22-M |
| `recovery-engine` | httpx, Pillow | ISO/IEC 27037:2012 |

### Infrastructure

| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Containerised deployment |
| Railway | Cloud deployment (frontend + backend) |
| Alembic | Database migrations |

---

## 5. Core Modules

### 5.1 Job Execution — How the Engines Run

All three forensic engines are loaded and executed **inside the backend process** by `job_execution_service.py`. No separate agent process is required for dashboard-initiated jobs.

```
Backend process (uvicorn)
         │
         │  User submits job via dashboard
         │
         ▼
  job_execution_service.py
         │
         │  sys.path.insert(0, engine_root)        ← adds engine folder to Python path
         │  importlib.import_module("src.xxx")      ← imports engine code dynamically
         │  asyncio.to_thread(engine_fn, payload)   ← runs engine in background thread
         │                                             (never blocks the event loop)
         │
         ▼
  Engine runs  →  returns report dict
         │
         ▼
  sign_payload()   →  SHA-256 hash + ECDSA P-256 signature
         │
         ▼
  append_to_ledger()  →  chained hash entry in DB
         │
         ▼
  WebSocket broadcast  →  browser updates in real-time
         │
         ▼
  PDF certificate generated on demand
```

### 5.2 Drive Eraser Agent

```
Detect Device
    ├── Windows  → Get-PhysicalDisk DeviceId → WMI metadata
    ├── Linux    → /proc/partitions → /sys/block metadata
    └── File     → stat() → virtual device (safe demo mode)
          │
          ▼
Select Wipe Method (auto)
    ├── NIST Clear      → 3-pass overwrite (0x00, 0xFF, random) — all media
    ├── NIST Purge      → ATA Secure Erase command — SSD/NVMe
    └── Crypto Erase    → Replace encryption key — self-encrypting drives
          │
          ▼
Pre-wipe sampling → Capture random byte regions for verification
          │
          ▼
Execute Wipe
          │
          ▼
Post-wipe verification → Read same offsets → confirm all changed
          │
          ▼
Submit report → Backend signs → Certificate issued
```

### 5.3 File & Folder Eraser Agent

```
Scan target (file or directory tree)
    │
    ▼
Build file list (batch_runner.py)
    │
    ▼
For each file:
    ├── selective_deleter.py
    │     ├── Pass 1: write 0x00 × filesize → flush → fsync
    │     ├── Pass 2: write 0xFF × filesize → flush → fsync
    │     ├── Pass 3: write random × filesize → flush → fsync
    │     └── os.unlink(file)
    │
    └── metadata_scrubber.py
          ├── os.utime(0, 0) → zero timestamps
          ├── Rename to random temp name → confound journal recovery
          └── Remove extended attributes (xattr / NTFS ADS)
    │
    ▼
freespace_overwriter.py
    └── Write random-bytes fill file (95% free space) → delete it
    │
    ▼
Submit report → Backend signs → Certificate issued
```

### 5.4 Recovery Engine

```
image_reader.py → open evidence image READ-ONLY
    └── SHA-256 hash BEFORE recovery (integrity checkpoint)
    │
    ▼
carver.py → scan every byte for file signatures
    ├── JPEG: FF D8 FF ... FF D9
    ├── PDF:  %PDF- ... %%EOF
    ├── ZIP:  PK\x03\x04 ... PK\x05\x06
    └── + 9 more types (PNG, GIF, BMP, MP4, AVI, MP3, SQLite, DOCX, XLSX)
    │
    ▼
classifier.py → structural validation
    ├── Pillow.Image.open() → verify JPEG/PNG/GIF
    └── zipfile.is_zipfile() → verify ZIP/DOCX/XLSX
    │
    ▼
confidence_scorer.py → score 0.0–1.0 per file
    ├── 0.85 base if footer found (complete file)
    ├── 0.35 base if truncated
    ├── +0.15 if structural validation passed
    └── -0.25 if structural validation failed
    │
    ▼
Write recovered files to output_dir (source untouched)
    │
    ▼
SHA-256 hash AFTER recovery → must match BEFORE
    │
    ▼
Submit report → Backend signs → Certificate issued
```

---

## 6. End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE OPERATION LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────────────┘

  1. OPERATOR ACTION
     └── Opens dashboard → selects operation type → fills job form → submits

  2. JOB CREATION
     └── POST /api/v1/jobs → Job created in DB (status: PENDING)
         → asyncio.create_task() fires immediately (non-blocking)

  3. ENGINE EXECUTION (inside backend process)
     └── Job: PENDING → CLAIMED → RUNNING
         → asyncio.to_thread() → forensic engine runs in background thread
         → WebSocket push → browser progress bar updates live

  4. TRUST LAYER
     └── Engine returns result dict
         → canonical_json(result, sort_keys=True)     [deterministic]
         → SHA-256 hash = report_hash
         → ECDSA P-256 sign(payload_bytes)            [private key server-side only]
         → OperationRecord saved to DB                [with hash + signature]

  5. LEDGER APPEND (atomic with record insert)
     └── entry_hash = SHA-256(prev_entry_hash + report_hash)
         → LedgerEntry saved (sequence N)
         → Both records committed in ONE transaction

  6. NOTIFICATION + COMPLETION
     └── Job: RUNNING → COMPLETED
         → Notification sent to operator
         → WebSocket push → browser shows green COMPLETED
         → certificate_id attached to job

  7. CERTIFICATE DELIVERY
     └── GET /api/v1/operations/{id}/pdf
         → pdf_service.py generates PDF in-memory (ReportLab)
         → QR code embeds /verify/{certificate_id} URL
         → PDF downloaded by operator

  8. PUBLIC VERIFICATION (anyone, no login)
     └── Scan QR code → /verify/{certificate_id}
         → Backend: re-derives canonical JSON → re-computes SHA-256
         → ECDSA verify(stored_signature, payload_bytes, public_key)
         → Ledger chain integrity checked
         → Returns: verified ✓ / tampered ✗
```

---

## 7. Security & Trust Model

### Cryptographic Pipeline

```
Operation result dict (Python)
         │
         ▼
canonical_json()  →  sorted keys, no whitespace, UTF-8 bytes
         │           [deterministic regardless of upstream formatting]
         ▼
SHA-256 hash  →  report_hash  (64 hex chars)
         │
         ▼
ECDSA P-256 sign(payload_bytes)  →  signature  (DER-encoded hex)
         │       [private key NEVER leaves the backend server]
         ▼
Stored in operation_records table
         │
         ▼
append_to_ledger():
    entry_hash = SHA-256( prev_entry_hash + report_hash )
         │
         ▼
Stored in ledger_entries table (sequence N)
         │
         ▼
Any future change to the record → SHA-256 changes
→ entry_hash recomputation fails → chain breaks at sequence N
→ verify_chain_integrity() returns broken_at_sequence=N
→ tamper alert broadcast to all ADMIN/AUDITOR users
```

### Key Management

| Priority | Source | When Used |
|---|---|---|
| 1 (highest) | `SIGNING_PRIVATE_KEY_PEM` env var | Production / secrets manager |
| 2 | `backend/keys/private.pem` file | Dev persistence across restarts |
| 3 (auto) | Auto-generated + written to `keys/` | First-run self-healing |

> The Docker volume `keys_data` mounts at `/app/keys` — auto-generated keys survive `docker compose down && up`.

### Authentication

```
Login: POST /api/v1/auth/login
  └── bcrypt.verify(password, hashed_password)
  └── JWT HS256 issued (30 min expiry)
  └── Identical error for wrong email vs wrong password (no enumeration)

Protected endpoints: Authorization: Bearer <token>
  └── decode_access_token() → user_id
  └── DB lookup → User object
  └── require_roles(*roles) → 403 if insufficient

WebSocket auth: ?token=<JWT> query param or Sec-WebSocket-Protocol header
```

### RBAC Matrix

| Permission | ADMINISTRATOR | SUPERVISOR | INVESTIGATOR | AUDITOR |
|---|:---:|:---:|:---:|:---:|
| Submit operations | ✓ | ✓ | ✓ | — |
| Create/manage cases | ✓ | ✓ | ✓ | — |
| View all operations | ✓ | ✓ | ✓ | ✓ |
| Manage devices | ✓ | ✓ | ✓ | — |
| Create/cancel jobs | ✓ | ✓ | ✓ | — |
| View audit ledger | ✓ | ✓ | ✓ | ✓ |
| View system logs | ✓ | ✓ | — | ✓ |
| Manage users | ✓ | — | — | — |
| Change org settings | ✓ | — | — | — |
| Download PDF certs | ✓ | ✓ | ✓ | ✓ |

---

## 8. Quick Start — Local Dev

> Prerequisites: Python 3.11+, Node.js 18+, npm 9+

### Step 1 — Clone and create virtual environment

```bash
git clone https://github.com/your-org/pramaan.git
cd pramaan

# Create shared virtual environment at repo root
python -m venv .venv

# Activate
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate
```

### Step 2 — Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 3 — Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

First run auto-creates `forensicguard.db` (SQLite) and all 13 tables. ECDSA keypair is auto-generated and saved to `backend/keys/`.

```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 4 — Create the first admin user

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

### Step 5 — Start the frontend

```bash
# New terminal — from repo root
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

### Step 6 — Login and explore

Open http://localhost:3000 → Login with `admin@pramaan.gov.in` / `SecurePass@123`

> **Interactive API docs**: http://localhost:8000/docs (Swagger UI)

---

## 9. Docker Deployment

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Compose plugin (Linux)
- At minimum 2 GB RAM available

### Step 1 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Required — generate a real secret:
# python -c "import secrets; print(secrets.token_urlsafe(48))"
JWT_SECRET_KEY=your-random-48-byte-secret-here

# Optional — leave blank for auto-generated keypair
SIGNING_PRIVATE_KEY_PEM=
SIGNING_PUBLIC_KEY_PEM=

# URLs (change if deploying to a server)
PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 2 — Build and launch

```bash
docker compose up --build
```

This starts three containers:
- `postgres` on port 5432
- `backend` on port 8000
- `frontend` on port 3000

### Step 3 — Watch for ready state

```
pramaan-backend-1   | INFO:     Application startup complete.
pramaan-frontend-1  | ▲ Next.js 14.2.35
pramaan-frontend-1  | ✓ Ready on http://0.0.0.0:3000
```

### Step 4 — Create admin user (first time only)

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pramaan.gov.in",
    "password": "SecurePass@123",
    "full_name": "Administrator",
    "role": "ADMINISTRATOR"
  }'
```

### Docker Services Overview

```
┌─────────────────────────────────────────────────┐
│  docker-compose.yml                             │
│                                                 │
│  postgres:16-alpine     ← port 5432             │
│    volume: postgres_data                        │
│    healthcheck: pg_isready                      │
│                                                 │
│  backend (python:3.12-slim)  ← port 8000        │
│    depends_on: postgres (healthy)               │
│    volume: keys_data → /app/keys                │
│                                                 │
│  frontend (node:20-alpine)   ← port 3000        │
│    depends_on: backend                          │
│    build arg: NEXT_PUBLIC_API_URL               │
└─────────────────────────────────────────────────┘
```

### Useful Docker Commands

```bash
# View live logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop without losing data
docker compose down

# Stop AND wipe all data (fresh start)
docker compose down -v

# Rebuild after code changes
docker compose up --build

# Open backend shell
docker compose exec backend bash

# Open psql
docker compose exec postgres psql -U forensicguard
```

---

## 10. Environment Variables

### Root `.env` (used by Docker Compose)

| Variable | Default | Required | Description |
|---|---|---|---|
| `POSTGRES_USER` | `forensicguard` | Docker only | PostgreSQL user |
| `POSTGRES_PASSWORD` | `change-me` | **Yes** | PostgreSQL password |
| `POSTGRES_DB` | `forensicguard` | Docker only | PostgreSQL database |
| `JWT_SECRET_KEY` | `change-me` | **Yes** | JWT signing secret (48+ random bytes) |
| `SIGNING_PRIVATE_KEY_PEM` | _(auto)_ | No | ECDSA private key (PEM) |
| `SIGNING_PUBLIC_KEY_PEM` | _(auto)_ | No | ECDSA public key (PEM) |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | No | Frontend URL (CORS) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | No | Backend URL for browser |

### Generate a JWT secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Generate an ECDSA keypair manually (optional)

```bash
cd backend
python -c "
from app.core.crypto import generate_keypair
priv, pub = generate_keypair()
print('SIGNING_PRIVATE_KEY_PEM=' + priv.replace(chr(10), '\\\\n'))
print('SIGNING_PUBLIC_KEY_PEM=' + pub.replace(chr(10), '\\\\n'))
"
```

---

## 11. API Overview

All endpoints are under `/api/v1/`. Full interactive docs at `/docs` (Swagger) and `/redoc`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create new operator account |
| POST | `/auth/login` | — | Login, get JWT |
| GET | `/auth/me` | JWT | Current user info |

### Operations (Core)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/operations` | JWT | Submit a signed forensic operation record |
| GET | `/operations` | JWT | List operation records (filterable) |
| GET | `/operations/{id}` | JWT | Get single record + verification status |
| GET | `/operations/{id}/pdf` | JWT | Download PDF certificate |
| GET | `/verify/{certId}` | — | Public tamper verification (no auth) |

### Jobs (Task Queue)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/jobs` | JWT | Create a new job |
| GET | `/jobs` | JWT | List jobs (filterable by status/type) |
| GET | `/jobs/{id}` | JWT | Get job detail + progress |
| POST | `/jobs/{id}/cancel` | JWT | Cancel a pending/running job |
| POST | `/jobs/claim` | JWT | Claim next pending job (agent endpoint) |
| PATCH | `/jobs/{id}/progress` | JWT | Update progress (agent endpoint) |
| POST | `/jobs/{id}/complete` | JWT | Mark job complete + attach certificate |
| POST | `/jobs/{id}/fail` | JWT | Mark job failed |

### WebSocket Channels

| URL | Auth | Events |
|---|---|---|
| `ws://host/api/v1/ws/jobs/{jobId}` | JWT via `?token=` | `CLAIMED`, `PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `ws://host/api/v1/ws/user/{userId}` | JWT via `?token=` | `NOTIFICATION`, `CERT_GENERATED`, `TAMPER_DETECTED` |
| `ws://host/api/v1/ws/logs` | JWT via `?token=` | `LOG` (level, category, message, timestamp) |

### Ledger

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/ledger/chain` | JWT | Paginated ledger entries |
| GET | `/ledger/chain/verify` | JWT | Verify chain integrity from genesis |

---

## 12. WebSocket Events

### Job Progress Event

```json
{
  "type": "PROGRESS",
  "job_id": "abc123",
  "status": "RUNNING",
  "progress_percent": 45,
  "stage": "CARVING",
  "message": "Scanning for JPEG signatures..."
}
```

### Job Completion Event

```json
{
  "type": "COMPLETED",
  "job_id": "abc123",
  "status": "COMPLETED",
  "progress_percent": 100,
  "stage": "COMPLETED",
  "certificate_id": "CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Tamper Detection Event

```json
{
  "type": "TAMPER_DETECTED",
  "broken_at_sequence": 7,
  "reason": "entry_hash does not match recomputed hash — record was altered"
}
```

---

## 13. Role-Based Access Control

Four roles form a strict hierarchy. Higher roles include all permissions of lower roles.

```
ADMINISTRATOR
    ├── Full access to all features
    ├── User management (create, patch roles)
    ├── Org settings
    └── System logs + audit ledger

SUPERVISOR
    ├── All investigator permissions
    ├── View system logs
    └── View all users (read-only)

INVESTIGATOR
    ├── Submit operations
    ├── Create/manage cases and devices
    ├── Create and monitor jobs
    └── Download certificates

AUDITOR
    ├── View all operations (read-only)
    ├── View ledger chain
    ├── View system logs
    └── Download certificates (read-only)
```

---

## 14. Running Tests

### Backend Tests

```bash
cd backend
pytest -v                          # all tests
pytest tests/test_ledger_chain_api.py -v   # ledger tests
pytest tests/test_jobs_api.py -v           # job queue tests
pytest tests/test_rbac.py -v               # RBAC permission tests
pytest --tb=short -q               # quiet summary
```

All backend tests use in-memory SQLite — no server or external services required.

### Recovery Engine Tests

```bash
cd recovery-engine
pytest tests/ -v
```

### File/Folder Eraser Tests

```bash
cd file-folder-eraser
pytest tests/ -v
```

### Drive Eraser Tests

```bash
cd drive-eraser-agent
pytest tests/ -v
```

All tests use file-based targets only — no real hardware required. Cross-platform (Windows, Linux, macOS).

---

## 15. Demo Screenshots

> Screenshots of the working prototype — taken from the PRAMAAN dashboard.

### Dashboard Overview
<!-- Add screenshot: dashboard analytics with stat cards, SVG charts, recent jobs -->
```
[ Screenshot — Dashboard Analytics Overview ]
  Path: docs/screenshots/dashboard-overview.png
```

### Case Management
<!-- Add screenshot: case list with status badges + case detail with timeline -->
```
[ Screenshot — Case Management & Timeline ]
  Path: docs/screenshots/case-management.png
```

### Job Monitor — Live Progress
<!-- Add screenshot: job running with WebSocket progress bar -->
```
[ Screenshot — Real-time Job Progress via WebSocket ]
  Path: docs/screenshots/job-live-progress.png
```

### PDF Certificate
<!-- Add screenshot: generated PDF certificate with QR code and ECDSA signature -->
```
[ Screenshot — Court-admissible PDF Certificate with QR Code ]
  Path: docs/screenshots/pdf-certificate.png
```

### Certificate Verification (Public)
<!-- Add screenshot: /verify/{certId} page showing tamper check result -->
```
[ Screenshot — Public Certificate Verification Page ]
  Path: docs/screenshots/certificate-verify.png
```

### Audit Ledger — Hash Chain Visualizer
<!-- Add screenshot: ledger entries showing chain hashes -->
```
[ Screenshot — Tamper-Evident Ledger Chain ]
  Path: docs/screenshots/ledger-chain.png
```

### Recovery Engine Output
<!-- Add screenshot: recovered files in evidence explorer -->
```
[ Screenshot — Evidence Explorer with Recovered Files ]
  Path: docs/screenshots/evidence-explorer.png
```

### Drive Eraser Certificate
<!-- Add screenshot: drive erase PDF with NIST compliance section -->
```
[ Screenshot — Drive Erasure Certificate (NIST SP 800-88) ]
  Path: docs/screenshots/drive-erase-certificate.png
```

---

## 16. Compliance Standards

| Standard | Module | How Implemented |
|---|---|---|
| NIST SP 800-88 Rev.1 | Drive Eraser | Clear (3-pass overwrite), Purge (ATA Secure Erase), Crypto Erase methods |
| ISO/IEC 27037:2012 | Recovery Engine | Read-only evidence access, pre/post SHA-256 integrity verification |
| Indian Evidence Act 2023 (§63) | Backend | ECDSA-signed PDF certificates, tamper-evident ledger chain |
| DoD 5220.22-M | File Eraser | 3-pass overwrite pattern (0x00, 0xFF, random) |
| SWGDE Best Practices | Recovery Engine | Source image never opened with write permissions |

---

## 17. Roadmap

### Implemented (Current Build)

- [x] ECDSA P-256 signing on all operation records
- [x] SHA-256 hash chain ledger (tamper-evident)
- [x] PDF certificate generation with embedded QR code
- [x] Public certificate verification (no login)
- [x] Full RBAC (4 roles)
- [x] WebSocket real-time job progress
- [x] Case management with evidence catalogue and timeline
- [x] Device inventory with health tracking
- [x] Drive eraser (NIST Clear / Purge / Crypto Erase)
- [x] File/folder eraser (3-pass + metadata scrubbing)
- [x] Recovery engine (signature carving + confidence scoring)
- [x] All three engines run in-process (no separate agent required)
- [x] Analytics dashboard with 30-day timeseries
- [x] Docker Compose full-stack deployment

### Planned (Future)

- [ ] Celery + Redis for distributed job queue
- [ ] MinIO / S3 object storage for evidence files
- [ ] Mobile app (React Native) for field officers
- [ ] NTFS MFT parsing for higher-accuracy recovery
- [ ] AI image content classification (ResNet)
- [ ] E01/EWF forensic image format support
- [ ] Hindi (hi-IN) language support
- [ ] Alembic-based schema migrations
- [ ] Nginx reverse proxy + TLS termination
- [ ] GitHub Actions CI/CD pipeline

---

## Documentation

| Document | Description |
|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Full deployment guide (local, Docker, production) |
| [docs/MANUAL_TESTING_GUIDE.md](docs/MANUAL_TESTING_GUIDE.md) | Step-by-step test scenarios |
| [docs/END_TO_END_TESTING_GUIDE.md](docs/END_TO_END_TESTING_GUIDE.md) | End-to-end test flows |
| [docs/DEMO_JUDGE_GUIDE.md](docs/DEMO_JUDGE_GUIDE.md) | SIH judge walkthrough guide |
| [backend/README.md](backend/README.md) | Backend API reference |
| [frontend/README.md](frontend/README.md) | Frontend setup and design system |
| [recovery-engine/README.md](recovery-engine/README.md) | Recovery engine internals |
| [file-folder-eraser/README.md](file-folder-eraser/README.md) | File eraser internals |
| [drive-eraser-agent/README.md](drive-eraser-agent/README.md) | Drive eraser internals |

---

## License & Disclaimer

This project is developed for **Smart India Hackathon 2026** (Problem ID 26149) under the Ministry of Home Affairs / NTRO category.

> This platform is a prototype built for demonstration purposes. It is not yet certified for use in live government investigations. All cryptographic operations, sanitisation methods, and forensic procedures follow recognised standards but have not undergone official government security audit.

---

<div align="center">

**PRAMAAN — प्रमाण**  
*Every operation leaves proof. Every proof is tamper-evident.*

Built for SIH 2026 · Problem ID 26149 · Ministry of Home Affairs / NTRO

</div>
