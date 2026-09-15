<div align="center">

<img src="../logo2.png" alt="NTRO PRAMAAN Logo" width="280" />

# PRAMAAN — Frontend Dashboard

**Next.js 14 · TypeScript 5.5 · Tailwind CSS · Government Design System**

*The operator-facing console for the PRAMAAN digital forensics platform.*

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [Setup & Running](#3-setup--running)
4. [Page Reference](#4-page-reference)
5. [Design System](#5-design-system)
6. [Authentication Flow](#6-authentication-flow)
7. [WebSocket Hooks](#7-websocket-hooks)
8. [API Layer](#8-api-layer)
9. [Role-Aware Navigation](#9-role-aware-navigation)
10. [Environment Variables](#10-environment-variables)
11. [Docker Build](#11-docker-build)
12. [Demo Screenshots](#12-demo-screenshots)
13. [Known Issues & Improvements](#13-known-issues--improvements)

---

## 1. Overview

The PRAMAAN frontend is a government-grade, enterprise-quality dashboard built with **Next.js 14 App Router**. It provides the complete operator interface for:

- **Public Landing Page** — government presentation with live platform statistics
- **Certificate Verification** — public, no-login tamper verification with QR support
- **Authenticated Dashboard** — analytics, cases, devices, jobs, reports, settings
- **Real-time Updates** — WebSocket job progress and live system log streaming
- **Role-Aware UI** — navigation and actions adapt per RBAC role

### Tech choices at a glance

| Choice | Rationale |
|---|---|
| Next.js 14 App Router | Server components where possible, client components for WS/state |
| TypeScript strict mode | All backend schemas mirrored in `lib/types.ts` |
| Tailwind CSS | No runtime CSS-in-JS overhead; government design tokens as config |
| Native `fetch` + `WebSocket` | Zero external HTTP/WS dependencies |
| `localStorage` JWT | Simple stateless auth; refresh on 401 redirects to `/login` |

---

## 2. Directory Structure

```
frontend/
├── src/
│   ├── app/                                  ← Next.js App Router pages
│   │   ├── layout.tsx                        Root layout (ThemeProvider wrapper)
│   │   ├── globals.css                       Government CSS design tokens
│   │   ├── page.tsx                          Public landing page (9 sections)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                      Login form + JWT storage
│   │   │
│   │   ├── verify/
│   │   │   └── [certId]/
│   │   │       └── page.tsx                  Public certificate verification (no auth)
│   │   │
│   │   └── dashboard/                        Protected — redirects to /login if no JWT
│   │       ├── layout.tsx                    AppShell wrapper (topbar + sidebar)
│   │       ├── page.tsx                      Analytics overview
│   │       │
│   │       ├── cases/
│   │       │   ├── page.tsx                  Case list + create form
│   │       │   └── [caseId]/
│   │       │       └── page.tsx              Case detail: overview + investigators
│   │       │                                   + evidence + timeline
│   │       ├── devices/
│   │       │   └── page.tsx                  Device inventory: filter bar + table
│   │       │                                   + create/edit modal
│   │       ├── jobs/
│   │       │   ├── page.tsx                  Task queue: status tabs + actions
│   │       │   └── [jobId]/
│   │       │       └── page.tsx              Job detail: live WS progress bar
│   │       │                                   + lifecycle timestamps
│   │       ├── ledger/
│   │       │   └── page.tsx                  Hash chain visualizer + verify action
│   │       │
│   │       ├── reports/
│   │       │   └── page.tsx                  4-tab report center:
│   │       │                                   certificates · recovery · audit · monthly
│   │       ├── search/
│   │       │   └── page.tsx                  Global search results + type filter chips
│   │       │
│   │       ├── settings/
│   │       │   └── page.tsx                  Org settings form (ADMIN only)
│   │       │
│   │       ├── system-logs/
│   │       │   └── page.tsx                  Live log stream + category tabs
│   │       │
│   │       └── users/
│   │           └── page.tsx                  Operator list + role management (ADMIN)
│   │
│   ├── components/
│   │   ├── AppShell.tsx                      Main layout: topbar + sidebar
│   │   │                                       + notification bell + global search
│   │   ├── ThemeProvider.tsx                 govt-light / govt-dark context
│   │   ├── OperationBadges.tsx               Operation type colour badges
│   │   ├── cases/
│   │   │   ├── TimelineRail.tsx              Investigation timeline with note composer
│   │   │   └── EvidenceExplorer.tsx          Recovered file browser by category
│   │   └── jobs/
│   │       └── JobUI.tsx                     JobRow · JobProgressBar · JobStatusBadge
│   │                                           · job creation templates
│   └── lib/
│       ├── api.ts                            All API wrapper functions (fetch-based)
│       ├── types.ts                          TypeScript types mirroring backend schemas
│       ├── auth.ts                           localStorage JWT/email/role helpers
│       └── ws.ts                             useJobSocket · useUserSocket
│                                               · useLogsSocket · useSystemLogStream
│
├── package.json
├── tailwind.config.js                        Government colour palette + custom tokens
├── tsconfig.json                             Strict TypeScript config
├── next.config.js
└── Dockerfile
```

---

## 3. Setup & Running

### Prerequisites

```
Node.js 18+    →   node --version
npm 9+         →   npm --version
```

### Development

```bash
cd frontend
npm install
npm run dev
```

App starts at **http://localhost:3000**

> Make sure the backend is running at `http://localhost:8000` first.

### Production Build

```bash
npm run build        # type-check + compile → .next/
npm run start        # serve production build
```

### Lint

```bash
npm run lint
```

---

## 4. Page Reference

### Public Pages (no login required)

#### `/` — Landing Page

Nine sections rendered server-side:

```
1. Hero          → tagline + Sign In CTA + Verify Certificate CTA
2. Live Stats    → fetches /api/v1/public/stats on load
                   (operations count, verified %, active cases, devices)
3. Features      → 6 capability cards (Recovery · Erase · Sanitise · Ledger · RBAC · PDF)
4. Architecture  → SVG system diagram
5. Standards     → NIST SP 800-88 · SHA-256 · ECDSA P-256 · ISO 27037 badges
6. Workflow      → 6-step numbered process
7. FAQ Accordion → expand/collapse common questions
8. Contact       → department contact block
9. Footer        → ministry attribution + links
```

#### `/verify/[certId]` — Certificate Verification

Public. No login required. Called when anyone scans the QR code on a PDF certificate.

```
Displays:
  · Operation type + target description
  · Operator (authenticated email)
  · Timestamps (IST format)
  · SHA-256 report hash
  · ECDSA signature verification result  ✓ Verified / ✗ Tampered
  · Ledger chain position (sequence number)
  · Chain integrity status
```

#### `/login` — Login Form

```
POST /api/v1/auth/login
  └── stores { access_token, role, user_id, email } in localStorage
  └── redirects to /dashboard
```

---

### Dashboard Pages (JWT required)

All dashboard pages check for a valid JWT in `localStorage` on mount. Missing or expired token → redirect to `/login`.

#### `/dashboard` — Analytics Overview

```
7 stat cards:
  · Operations Today
  · Total Certificates Issued
  · Files Recovered
  · Data Sanitised (GB)
  · Success Rate (%)
  · Active Cases
  · Registered Devices

SVG line chart:
  · 30-day timeseries
  · 5 toggleable metrics: operations / successes / failures / recoveries / erases

Top Investigators table (by operation count)
Recent Jobs list (live badge updates via WS)
```

#### `/dashboard/cases` — Case Management

```
List view:
  · Status filter tabs (OPEN · ACTIVE · CLOSED · ARCHIVED)
  · Create Case form (title, description, lead investigator)
  · Case number auto-generated (FG-2026-000001)

Detail view /dashboard/cases/[caseId]:
  · Overview tab: metadata + status + lead investigator
  · Investigators tab: add/remove team members
  · Evidence tab: EvidenceExplorer (browse recovered files by category)
  · Timeline tab: TimelineRail with note composer
  · Linked Operations: associated certificates
```

#### `/dashboard/jobs` — Task Queue

```
Status tabs: ALL · PENDING · RUNNING · COMPLETED · FAILED
Per-job actions: Cancel (PENDING/RUNNING) · Retry (FAILED)

Job creation modal:
  · Operation type selector (RECOVERY · FILE_ERASE · DRIVE_ERASE)
  · Payload fields depend on type
  · auto_execute toggle (run in-process immediately)
```

#### `/dashboard/jobs/[jobId]` — Job Detail

```
· Real-time progress bar via useJobSocket(jobId)
· Status badge updates without page refresh
· Stage label (SCANNING · CARVING · OVERWRITING · WIPING · etc.)
· Full lifecycle timestamps (created · claimed · started · completed)
· Error message if FAILED
· Certificate ID + link to PDF when COMPLETED
```

#### `/dashboard/ledger` — Hash Chain Visualizer

```
· Paginated block cards showing:
    sequence_number · entry_hash (truncated) · report_hash · operation_type
· Verify Chain button → GET /api/v1/ledger/chain/verify
    → shows: valid=true · total_entries=N
    → or:    broken_at_sequence=N · reason=...
```

#### `/dashboard/reports` — Report Center

```
4 tabs:
  · Certificates   → filterable table + PDF download + CSV export
  · Recovery       → files recovered with confidence scores
  · Audit          → operation audit trail (AUDITOR+ only)
  · Monthly        → aggregate summary by month
```

---

## 5. Design System

All design tokens are defined in `globals.css` and `tailwind.config.js`. The system is inspired by NIC/NTRO government aesthetics.

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `govt-navy` | `#0f2d5e` | Primary headings, active nav, brand |
| `govt-blue` | `#1a56a0` | Buttons, links, active states |
| `govt-blueLight` | `#e8f0fb` | Hover backgrounds, card highlights |
| `govt-green` | `#1a7a3e` | Success, verified, connected |
| `govt-red` | `#b91c1c` | Error, tamper detected, danger |
| `govt-gold` | `#a16207` | Warning, paused, fair health |
| `grey-50…900` | — | Borders, backgrounds, muted text |

### CSS Component Classes

```css
/* Buttons */
.fg-btn              /* secondary / outline */
.fg-btn-primary      /* filled navy blue */
.fg-btn-ghost        /* icon buttons, no visible border */

/* Cards / Panels */
.fg-panel            /* white card with border-radius + shadow */
.fg-panel-header     /* panel title row with bottom border */

/* Navigation */
.fg-topbar           /* sticky header bar */
.fg-sidebar          /* left navigation rail */
.fg-nav-item         /* nav link — data-active="true" highlights in navy */

/* Forms */
.fg-input            /* text inputs, selects, textareas */
.fg-label            /* input labels */

/* Tables */
.fg-table            /* data table with hover rows + header bg */

/* Badges */
.fg-badge            /* neutral grey */
.fg-badge--green     /* success / completed */
.fg-badge--navy      /* info / running */
.fg-badge--gold      /* warning / pending */
.fg-badge--red       /* danger / failed */
.fg-badge--blue      /* info alt / recovery */
```

### Themes

| Theme | Class | Description |
|---|---|---|
| `govt-light` | default | White panels, navy nav — NTRO standard |
| `govt-dark` | toggled | Dark grey backgrounds, adapted for low-light ops |

Toggle is managed by `ThemeProvider.tsx` using React context + `localStorage` persistence.

### Operation Type Colour Mapping

```
DRIVE_ERASE  →  fg-badge--red     (destructive — wipe)
FILE_ERASE   →  fg-badge--gold    (selective — delete)
RECOVERY     →  fg-badge--blue    (constructive — recover)
```

---

## 6. Authentication Flow

```
User enters email + password on /login
          │
          ▼
POST /api/v1/auth/login
          │
          ▼
{ access_token, token_type, role, user_id, email }
    └── stored in localStorage:
          "pramaan_token"  → access_token
          "pramaan_role"   → role
          "pramaan_uid"    → user_id
          "pramaan_email"  → email
          │
          ▼
router.push("/dashboard")
          │
          ▼
All subsequent requests:
    authFetch(url)
      └── Authorization: Bearer <token>   (from getToken())
          │
          ▼
Token expiry (30 min default):
    next authFetch → 401 response
      └── UnauthorizedError thrown
      └── caught in page component
      └── router.push("/login")
          │
          ▼
Logout:
    clearAuth()  →  removes all localStorage keys
    router.push("/login")
```

---

## 7. WebSocket Hooks

All hooks are in `lib/ws.ts`. They build `ws://` or `wss://` from the HTTP `API_BASE`, attach JWT as `?token=`, and handle reconnect states.

### Job Progress Hook

```typescript
const { readyState, lastEvent } = useJobSocket(jobId: string);

// lastEvent shape:
{
  type: "PROGRESS" | "COMPLETED" | "FAILED" | "CLAIMED" | "CANCELLED",
  job_id: string,
  status: string,
  progress_percent: number,
  stage: string,
  message: string,
  certificate_id?: string,   // present when COMPLETED
}

// readyState: "connecting" | "open" | "closed" | "unauthenticated"
```

### User Notification Hook

```typescript
const { readyState, lastEvent } = useUserSocket(userId: string);

// lastEvent shape:
{
  type: "CERT_GENERATED" | "TAMPER_DETECTED" | "NOTIFICATION",
  certificate_id?: string,
  broken_at_sequence?: number,
  message: string,
}
```

### Live Log Stream Hook

```typescript
const { readyState, events } = useLogsSocket();
// events: WSLogEvent[] — bounded tail of 500 most recent entries

// WSLogEvent shape:
{
  type: "LOG",
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL",
  category: string,
  source: string,
  message: string,
  timestamp: string,   // UTC ISO 8601
}
```

### System Log Stream (page variant)

```typescript
useSystemLogStream((event: WSLogEvent) => {
  // called for each new log entry from WebSocket
  // used by /dashboard/system-logs page
});
```

### Reconnect States

```
"connecting"      → socket created, waiting for handshake
"open"            → connected, receiving events
"closed"          → disconnected (network error, server restart)
"unauthenticated" → server closed with code 403 (invalid JWT)
```

---

## 8. API Layer

All API calls go through typed wrapper functions in `lib/api.ts`. Every function uses `authFetch()` which automatically attaches the JWT.

### Pattern

```typescript
export async function listJobs(params: JobListParams): Promise<JobOut[]> {
  const qs = new URLSearchParams();
  if (params.status)        qs.set("status", params.status);
  if (params.operation_type) qs.set("operation_type", params.operation_type);
  const res = await authFetch(`/api/v1/jobs?${qs}`);
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok)            throw new Error(await res.text());
  return res.json();
}
```

### Key Functions

```typescript
// Auth
loginUser(email, password)          → TokenResponse
registerUser(payload)               → UserOut
getCurrentUser()                    → UserOut

// Operations
submitOperation(report)             → OperationRecordOut
listOperations(filters)             → OperationRecordOut[]
getOperation(id)                    → OperationRecordOut
getOperationPdfUrl(id)              → string   (URL for <a href> download)
verifyOperation(certId)             → VerifyResponse   (public, no auth)

// Jobs
createJob(payload)                  → JobOut
listJobs(filters)                   → JobOut[]
getJob(id)                          → JobOut
cancelJob(id)                       → void

// Cases
createCase(payload)                 → CaseOut
listCases(filters)                  → CaseOut[]
getCase(id)                         → CaseOut
addInvestigator(caseId, userId)     → void
addEvidence(caseId, payload)        → EvidenceItemOut
getCaseTimeline(caseId)             → TimelineEventOut[]

// Devices
listDevices(filters)                → DeviceOut[]
createDevice(payload)               → DeviceOut
updateDevice(id, patch)             → DeviceOut

// Ledger
getLedgerChain(page, size)          → LedgerEntryOut[]
verifyLedgerChain(upToSeq?)         → ChainVerifyResponse

// Analytics
getAnalyticsSummary()               → SummaryStats
getTimeseries(days)                 → TimeseriesPoint[]

// Reports
getCertificateReport(filters)       → CertificateReportRow[]
downloadCertificatesCsv()          → Blob

// Users (ADMIN)
listUsers()                         → UserOut[]
patchUserRole(id, role)             → UserOut

// Notifications
listNotifications()                 → NotificationOut[]
markNotificationRead(id)            → void
```

---

## 9. Role-Aware Navigation

`AppShell.tsx` controls sidebar visibility based on `userRole` from `localStorage`:

```typescript
const NAV_ITEMS = [
  { href: "/dashboard",              label: "Analytics",    icon: "📊" },
  { href: "/dashboard/cases",        label: "Cases",        icon: "🗂️" },
  { href: "/dashboard/devices",      label: "Devices",      icon: "💾" },
  { href: "/dashboard/jobs",         label: "Jobs",         icon: "⚙️" },
  { href: "/dashboard/ledger",       label: "Ledger",       icon: "🔗" },
  { href: "/dashboard/reports",      label: "Reports",      icon: "📄" },
  { href: "/dashboard/search",       label: "Search",       icon: "🔍" },
  // Restricted:
  { href: "/dashboard/system-logs",  label: "System Logs",  icon: "📋",
    roles: ["ADMINISTRATOR", "AUDITOR", "SUPERVISOR"] },
  { href: "/dashboard/users",        label: "Users",        icon: "👥",
    roles: ["ADMINISTRATOR", "SUPERVISOR"] },
  { href: "/dashboard/settings",     label: "Settings",     icon: "⚙️",
    roles: ["ADMINISTRATOR"] },
];
```

Items without a `roles` array are visible to all authenticated users. Items with `roles` are hidden if the current user's role is not in the list.

---

## 10. Environment Variables

Only one environment variable is needed for the frontend:

```env
# .env.local  (development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Docker build arg  (production)
NEXT_PUBLIC_API_URL=https://api.pramaan.yourdomain.gov.in
```

This value is baked into the Next.js bundle at build time. It must point to wherever the backend is reachable **from the browser** (not Docker-internal hostnames).

---

## 11. Docker Build

The frontend uses a multi-stage Docker build:

```
Stage 1: deps    (node:20-alpine)
  └── npm ci --only=production

Stage 2: builder (node:20-alpine)
  └── COPY source
  └── ARG NEXT_PUBLIC_API_URL
  └── npm run build → .next/

Stage 3: runner  (node:20-alpine)
  └── COPY .next/ from builder
  └── PORT injected at runtime via $PORT
  └── CMD: node server.js
```

```bash
# Build manually
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  -t pramaan-frontend \
  ./frontend

# Run
docker run -p 3000:3000 pramaan-frontend
```

---

## 12. Demo Screenshots

### Landing Page (Public)
```
[ Screenshot — Public landing page hero section + live stats ]
  Path: ../docs/screenshots/landing-page.png
```

### Login Page
```
[ Screenshot — Login form with government branding ]
  Path: ../docs/screenshots/login.png
```

### Dashboard Analytics
```
[ Screenshot — Dashboard with 7 stat cards + 30-day SVG line chart ]
  Path: ../docs/screenshots/dashboard-analytics.png
```

### Jobs — Live Progress
```
[ Screenshot — Job detail page with real-time WebSocket progress bar
  at 60% CARVING stage ]
  Path: ../docs/screenshots/job-live-progress.png
```

### Case Detail — Timeline & Evidence
```
[ Screenshot — Case detail with TimelineRail and EvidenceExplorer tabs ]
  Path: ../docs/screenshots/case-detail.png
```

### Ledger Chain Visualizer
```
[ Screenshot — Hash chain block cards with Verify Chain result overlay ]
  Path: ../docs/screenshots/ledger-visualizer.png
```

### Certificate Verification (Public)
```
[ Screenshot — /verify/{certId} showing ECDSA verified ✓ status
  with operator, timestamps, hash, chain position ]
  Path: ../docs/screenshots/cert-verify.png
```

### System Logs Live Stream
```
[ Screenshot — /dashboard/system-logs with coloured level badges
  and live WebSocket entries scrolling in ]
  Path: ../docs/screenshots/system-logs.png
```

---

## 13. Known Issues & Improvements

### Known Issues

| Issue | File | Fix |
|---|---|---|
| `/dashboard/audit` nav link leads to 404 | `AppShell.tsx` | Remove nav item or add stub page |
| JWT not auto-refreshed on expiry | `auth.ts` | Add refresh token endpoint + silent refresh |
| No loading skeleton states | all dashboard pages | Replace "Loading..." text with shimmer |

### Suggested Improvements

1. **Virtualized tables** — use `@tanstack/react-virtual` for large device/case lists (1000+ rows)
2. **Optimistic UI** — update job status immediately on cancel/retry, roll back on error
3. **Error boundaries** — wrap each dashboard section in a React `ErrorBoundary`
4. **Skeleton loading** — add shimmer placeholder components for all async data
5. **Accessibility** — add `aria-live` regions for WebSocket updates; audit with NVDA/VoiceOver
6. **PWA support** — add service worker for offline certificate viewing
7. **i18n** — add Hindi (`hi-IN`) language support given the government context
8. **End-to-end tests** — add Playwright tests for login → create job → verify certificate flow
9. **JWT refresh** — add `POST /auth/refresh` endpoint + silent background token renewal
10. **Mobile responsive** — sidebar collapses to bottom nav on viewport < 768px

---

*Part of the PRAMAAN platform — see [root README](../README.md) for full system documentation.*
