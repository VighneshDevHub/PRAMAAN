# PRAMAAN — SIH 2026 Demo Video Guide

> **Smart India Hackathon 2026 · Problem ID 26149 · Ministry of Home Affairs / NTRO**
> Complete step-by-step guide to recording and presenting the PRAMAAN prototype demo video.

---

## Table of Contents

1. [Video Overview](#1-video-overview)
2. [Before You Record — Setup Checklist](#2-before-you-record--setup-checklist)
3. [Prepare Demo Data](#3-prepare-demo-data)
4. [Start All Services](#4-start-all-services)
5. [Screen & Recording Setup](#5-screen--recording-setup)
6. [Full Demo Script — Scene by Scene](#6-full-demo-script--scene-by-scene)
7. [Post-Recording Editing Guide](#7-post-recording-editing-guide)
8. [Honest Claims Reference](#8-honest-claims-reference)
9. [Frequently Asked Questions by Judges](#9-frequently-asked-questions-by-judges)

---

## 1. Video Overview

### Target Duration
```
Cinematic Story    →   ~40 seconds  (pre-recorded video)
Live Prototype     →   ~5–7 minutes (screen recording)
Total              →   ~6–8 minutes
```

### The One-Line Story Arc
```
PROBLEM → CASE → DEVICE → RECOVER → SANITIZE → VERIFY → CERTIFICATE → AUDIT → PRAMAAN
```

### The One Rule
> Never say "Now I'll show you the feature."
> Always say "Here's the problem — watch how PRAMAAN solves it."

---

## 2. Before You Record — Setup Checklist

Do every item on this list **before** you open OBS or start screen recording.

### System
- [ ] Close all unnecessary applications (Slack, Discord, browser tabs, email)
- [ ] Turn off all notifications (Windows: Focus Assist → Priority Only)
- [ ] Set display resolution to **1920×1080**
- [ ] Set browser zoom to **100%**
- [ ] Check microphone is working and not picking up fan/AC noise
- [ ] Plug in laptop power — don't record on battery

### Browser
- [ ] Open Chrome or Edge in a **clean profile** (no bookmarks bar visible)
- [ ] Navigate to `http://localhost:3000`
- [ ] Login as admin in advance — don't fumble with password on camera
- [ ] Bookmark these pages for fast navigation:
  ```
  http://localhost:3000/dashboard
  http://localhost:3000/dashboard/cases
  http://localhost:3000/dashboard/devices
  http://localhost:3000/dashboard/jobs
  http://localhost:3000/dashboard/ledger
  http://localhost:3000/dashboard/reports
  ```
- [ ] Keep `http://localhost:8000/docs` open in a separate tab (backup)

### Terminal (keep minimized, not visible)
- [ ] Backend running on `:8000`
- [ ] Frontend running on `:3000`
- [ ] No error messages in terminal

---

## 3. Prepare Demo Data

Run these commands **before recording** to seed the database with realistic demo data.

### Step 1 — Activate virtual environment

```powershell
# Windows
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN"
.venv\Scripts\Activate.ps1
```

### Step 2 — Start services

**Terminal 1 — Backend:**
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev -- --port 3000
```

### Step 3 — Create demo admin account (first time only)

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "demo@pramaan.gov.in",
    "password": "Demo@2026",
    "full_name": "Chief Forensic Examiner",
    "role": "ADMINISTRATOR"
  }'
```

### Step 4 — Create demo investigator account

```powershell
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "investigator@pramaan.gov.in",
    "password": "Demo@2026",
    "full_name": "Senior Investigator",
    "role": "INVESTIGATOR"
  }'
```

### Step 5 — Create a test evidence disk image

```powershell
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\recovery-engine"
python make_test_evidence.py
# Creates: seized_drive.dd  (synthetic image with JPEG, PDF, ZIP embedded)
```

### Step 6 — Create a test file for erasure demo

```powershell
# Create a fake sensitive document for the erasure demo
New-Item -Path "c:\Users\vighn\Desktop\demo-evidence" -ItemType Directory -Force
Set-Content "c:\Users\vighn\Desktop\demo-evidence\CONFIDENTIAL_REPORT.pdf" "SENSITIVE FORENSIC DATA - FOR DEMO PURPOSES"
Set-Content "c:\Users\vighn\Desktop\demo-evidence\case_notes.txt" "Case notes - classified content"
Set-Content "c:\Users\vighn\Desktop\demo-evidence\suspect_photo.jpg" "Binary image data placeholder"
```

### Step 7 — Pre-verify everything works

```powershell
# Test backend health
curl http://localhost:8000/health
# Expected: {"status": "ok", "environment": "development"}

# Test frontend
Start-Process "http://localhost:3000"
# Should load PRAMAAN landing page
```

---

## 4. Start All Services

Every time before recording, run these in order:

```powershell
# Terminal 1 — Backend (keep open, minimize)
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level warning

# Terminal 2 — Frontend (keep open, minimize)
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\frontend"
npm run dev -- --port 3000
```

Wait for:
```
INFO:     Application startup complete.       ← backend ready
✓ Ready in X.Xs                               ← frontend ready
```

Then open browser at `http://localhost:3000` and login.

---

## 5. Screen & Recording Setup

### Recommended Recording Tool
**OBS Studio** (free) — https://obsproject.com

### OBS Scene Setup

```
Scene: "PRAMAAN Demo"
  Sources:
    1. Display Capture (your full screen)
    2. Audio Input Capture (your microphone)

Settings → Output:
  Recording Format: MP4
  Encoder: x264
  Rate Control: CRF 18
  Resolution: 1920×1080
  FPS: 30
```

### Window Layout During Recording

```
┌─────────────────────────────────────────┐
│                                         │
│         PRAMAAN Dashboard               │
│         (Full screen browser)           │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

Keep terminals **minimized** — only bring up if showing backend logs as a bonus moment.

### Font Size / Zoom Tips
- Browser zoom: 100% (default)
- If judges are watching on projector: 110%
- Dashboard text must be readable — test by taking a screenshot and zooming out to 50%

### Do a 30-second test recording before the real one
- Check audio levels (voice should peak at -12dB to -6dB)
- Check screen capture is showing the right monitor
- Check no personal info visible in browser tabs

---

## 6. Full Demo Script — Scene by Scene

> **How to use this script:**
> Each scene has:
> - **SCREEN** — what to have visible / what to click
> - **SAY** — exact words to speak
> - **TIME** — approximate timestamp

---

### SCENE 0 — Cinematic Video Transition
**TIME:** 0:00

**SCREEN:** Play your pre-recorded cinematic story (40 seconds)
The cinematic ends with: **PRAMAAN — RECOVER • SANITIZE • VERIFY • REPORT**

Immediately switch to your screen showing the PRAMAAN login page.

**SAY:**
> "So that was the problem. Now let me show you what happens when we actually put PRAMAAN to work."

> "Instead of showing you a collection of separate tools — I will walk you through one complete investigation, end to end."

*Pause 1 second.*

> "Let's take the same device from our story and treat it as a real digital evidence case."

---

### SCENE 1 — Login
**TIME:** 0:20

**SCREEN:** `http://localhost:3000/login`

Do NOT type slowly. Have credentials already filled or use browser autofill.

**SAY:**
> "The investigator securely authenticates into PRAMAAN."

*Click Login.*

> "And from here, the entire investigation is managed from a single platform."

---

### SCENE 2 — Dashboard Overview
**TIME:** 0:30

**SCREEN:** `http://localhost:3000/dashboard`

Let it load. Don't click anything for 3 seconds. Let judges absorb the UI.

**SAY:**
> "This is the PRAMAAN dashboard."

*Gesture broadly at the screen.*

> "Cases. Devices. Recovery jobs. Erasure operations. Audit ledger. Reports. All connected."

*Point at stat cards.*

> "The important idea is simple — one investigation. One workflow. One verifiable record."

---

### SCENE 3 — Create Case
**TIME:** 0:50

**SCREEN:** `http://localhost:3000/dashboard/cases`

Click **Create New Case** or open a pre-created case.

**Case details to enter:**
```
Case Number : CASE-2026-NTRO-001
Title       : Confidential USB Device Investigation
Description : Seized USB device from suspect. Recovery and sanitization required.
```

**SAY:**
> "Every investigation starts with a case."

*Type or show the case.*

> "I'll create our investigation case — a confidential USB device that has been seized."

*Create the case.*

> "From this point, every operation we perform — recovery, erasure, verification — is linked to this case."

---

### SCENE 4 — Register Device
**TIME:** 1:10

**SCREEN:** `http://localhost:3000/dashboard/devices`

Register the USB device or show a pre-registered device.

**Device details:**
```
Serial Number : USB-DEMO-2026-001
Model         : SanDisk Ultra 32GB
Type          : USB
Status        : IN CUSTODY
```

**SAY:**
> "Before we touch the device, we register it."

*Show the device entry.*

> "PRAMAAN records the device metadata — serial number, model, type — creating an evidence chain from the moment we receive it."

*If you have a physical USB plugged in, hold it up to camera for 2 seconds.*

> "This is the actual physical device we'll be working with."

---

### SCENE 5 — Recovery Engine
**TIME:** 1:30

**SCREEN:** `http://localhost:3000/dashboard/jobs`

Click **New Job** → Select **Recovery** operation.

**Job details:**
```
Operation Type : RECOVERY
Image Path     : C:\...\recovery-engine\seized_drive.dd
Output Dir     : C:\Users\vighn\Desktop\demo-recovered
```

**SAY:**
> "Now — let's go back to the first part of our story."

*Pause.*

> **"The file was deleted. But was it really gone?"**

*Pause for effect.*

*Click Create Job / Start.*

> "PRAMAAN starts the recovery process."

---

### SCENE 5A — Recovery Progress
**TIME:** 1:50

**SCREEN:** Job detail page with live WebSocket progress bar

Watch the progress bar move through stages.

**SAY:**
> "The recovery engine doesn't depend only on the filesystem."

*Point at progress stages.*

> "It examines the underlying raw data and searches for known file signatures."

> "JPEG. PDF. ZIP. SQLite databases. Twelve file types."

*Progress reaches completion.*

> "And importantly — the engine validates what it finds before presenting it as evidence."

---

### SCENE 5B — Show Recovered Files
**TIME:** 2:10

**SCREEN:** Job completed — show recovered files / Evidence Explorer

This is your **first big moment**. Slow down.

**SAY slowly:**

> **"And here is the result."**

*Pause 2 seconds.*

> "The file that appeared to be deleted — has been recovered from the raw device data."

*Point at confidence score.*

> "PRAMAAN doesn't just say 'file found.' It provides structural validation and a confidence score for every recovered file."

*Strong line — say this clearly:*

> **"RECOVER — complete."**

---

### SCENE 6 — File Erasure
**TIME:** 2:40

**SCREEN:** Navigate to **New Job** → **File Erase**

**Job details:**
```
Operation Type  : FILE_ERASE
Target          : C:\Users\vighn\Desktop\demo-evidence\
Free Space Wipe : Yes
```

**SAY:**
> "But forensic systems have the exact opposite requirement as well."

*Pause.*

> "Sometimes the data must be securely removed — not recovered."

> "Imagine a device being returned to its owner after case closure. Sensitive investigation files cannot simply be deleted."

*Start the erasure job.*

> **"PRAMAAN performs a controlled erasure workflow."**

---

### SCENE 6A — Erasure Progress
**TIME:** 2:55

**SCREEN:** Job detail — progress bar moving through OVERWRITING → METADATA_SCRUBBING → COMPLETED

**SAY:**
> "The process includes content overwriting across multiple passes."

*Watch progress.*

> "Metadata scrubbing — timestamps, file names."

> "And free space overwrite — so remnant sectors can't be carved."

*Completed.*

> "The key difference from pressing Delete is that this operation is **recorded, controlled, and verifiable.**"

*Strong line:*

> **"SANITIZE — complete."**

---

### SCENE 7 — Cryptographic Verification
**TIME:** 3:20

**SCREEN:** Navigate to **Operations** list — click on any completed operation record

This is your **strongest technical moment**. Slow down, let judges read.

**SAY:**
> "Now — here is the most important question."

*Pause.*

> **"How do we prove that this operation actually happened and that the record was not modified afterward?"**

*Pause.*

> **"This is where PRAMAAN's verification layer comes in."**

---

### SCENE 7A — SHA-256
**TIME:** 3:35

**SCREEN:** Show the `report_hash` field on the operation record

Point at the hash.

**SAY:**
> "For every operation, PRAMAAN generates a SHA-256 hash of the complete operation record."

*Point at the 64-character hash string.*

> "This is a cryptographic fingerprint. Any change to the record — any modification, even a single character — produces a completely different hash."

---

### SCENE 7B — ECDSA Signature
**TIME:** 3:50

**SCREEN:** Show the `signature` field

Point at the signature.

**SAY:**
> "The record is then digitally signed using ECDSA — Elliptic Curve Digital Signature Algorithm."

> "The private signing key never leaves the server."

*Strong line:*

> **"So we don't just store a database record. We create a cryptographically verifiable record."**

---

### SCENE 7C — Hash Chain Ledger
**TIME:** 4:10

**SCREEN:** `http://localhost:3000/dashboard/ledger`

Scroll through ledger entries slowly.

**SAY:**
> "These signed records are also linked through a hash chain."

*Point at sequence numbers and hash values.*

> "Each operation is mathematically connected to the previous one."

> "If someone were to modify an earlier record — the integrity verification would detect the inconsistency."

*Click Verify Chain button.*

*Show result: verified ✓*

> **"VERIFY — complete."**

---

### SCENE 8 — QR Code Verification
**TIME:** 4:40

**SCREEN:** Certificate detail page — show embedded QR code

If possible, **physically scan the QR** with your phone and show the verification page opening on phone screen.

**SAY:**
> "The investigator doesn't need to ask anyone to trust the database."

*Point at QR.*

> "Every operation produces a certificate containing the cryptographic verification data."

*Scan the QR or navigate to `/verify/{certId}`.*

> **"Anyone — a court, an auditor, a senior officer — can independently verify the certificate."**

*Show verification result: ECDSA Verified ✓*

> "No database access required. No login required. The mathematics speaks for itself."

---

### SCENE 9 — PDF Certificate Download
**TIME:** 5:05

**SCREEN:** Click Download Certificate — open the PDF

This is your **final visual moment**. Let the PDF load fully.

**SAY:**
> "And the technical record is converted into something an investigator or auditor can actually use."

*Scroll through the PDF slowly — let judges see:*

```
- Case ID and operation type
- Device details
- Timestamps in IST
- SHA-256 hash
- ECDSA signature
- Ledger sequence number
- QR code
- Formal attestation box
```

> "A court-admissible certificate. Covering the operation details, cryptographic proof, and a verifiable chain of custody."

*Strong line:*

> **"REPORT — complete."**

---

### SCENE 10 — Audit Trail
**TIME:** 5:30

**SCREEN:** Back to dashboard — show the complete operations list or ledger

Scroll slowly through multiple entries.

**SAY:**
> "And because all of this is connected to the same investigation case —"

*Point at the list.*

> "Recovery."
> "File erasure."  
> "Verification."
> "Certificate."

*Pause.*

> **"Instead of having evidence in one tool, erasure in another tool, and reports somewhere else — PRAMAAN brings the complete workflow into one platform."**

---

### SCENE 11 — Final Statement
**TIME:** 5:50

**SCREEN:** PRAMAAN dashboard or landing page — full logo visible

Stop clicking. Look at camera if presenting live.

**SAY:**
> "Let's come back to the story we started with."

*Pause.*

> "A digital device can contain evidence that must be recovered."

> "The same device can contain data that must be securely sanitized."

> "And in both situations — the most important question is —"

*Pause for 2 full seconds.*

> **"Can we prove what happened?"**

*Pause.*

> **"That is the problem PRAMAAN is designed to solve."**

---

### SCENE 12 — PRAMAAN Closing
**TIME:** 6:10

**SCREEN:** PRAMAAN logo / dashboard

**SAY:**
> **"Recover what matters."**
> **"Sanitize what must disappear."**
> **"Verify every operation."**
> **"Generate trusted, auditable evidence."**

*Final line — say this clearly and stop:*

> **"PRAMAAN. Recover. Sanitize. Verify. Report."**

**Do not keep talking after this line.**

---

## 7. Post-Recording Editing Guide

### Recommended Tools
- **DaVinci Resolve** (free) — professional grade
- **CapCut** (free) — quick and easy
- **Premiere Pro** — if you have it

### Edit Structure

```
00:00 – 00:40   Cinematic story video  (pre-made, drop in)
00:40 – 01:00   PRAMAAN intro + login
01:00 – 01:30   Dashboard + Case creation
01:30 – 02:10   Device + Recovery job
02:10 – 02:40   Recovered files reveal
02:40 – 03:20   File erasure
03:20 – 04:20   SHA-256 + ECDSA + Hash chain
04:20 – 05:00   QR verification + live scan
05:00 – 05:30   PDF certificate
05:30 – 06:00   Audit trail
06:00 – 06:20   Final statement + PRAMAAN logo
```

### Text Overlays to Add (at key moments)

| Timestamp | Text Overlay |
|---|---|
| 00:40 | `PRAMAAN — Digital Forensics Platform` |
| 01:30 | `STEP 1: DEVICE REGISTRATION` |
| 01:50 | `STEP 2: FILE RECOVERY` |
| 02:10 | `✓ RECOVERY COMPLETE` |
| 02:40 | `STEP 3: SECURE ERASURE` |
| 03:10 | `✓ SANITIZATION COMPLETE` |
| 03:20 | `STEP 4: CRYPTOGRAPHIC VERIFICATION` |
| 03:35 | `SHA-256 Hash` |
| 03:50 | `ECDSA P-256 Digital Signature` |
| 04:10 | `Tamper-Evident Hash Chain Ledger` |
| 04:40 | `✓ VERIFICATION COMPLETE` |
| 05:05 | `STEP 5: COURT-ADMISSIBLE CERTIFICATE` |
| 05:30 | `✓ AUDIT TRAIL COMPLETE` |
| 06:00 | `PRAMAAN — RECOVER • SANITIZE • VERIFY • REPORT` |

### Music
- Keep music low — **-20dB to -25dB** under voice
- Use royalty-free tracks only (YouTube Audio Library, Pixabay)
- Suggested mood: **corporate / investigative / serious** — not dramatic action music
- Fade music completely during the technical explanation sections (SHA-256 onwards)

### Export Settings
```
Resolution : 1920×1080
FPS        : 30
Format     : MP4 (H.264)
Bitrate    : 8-12 Mbps
Audio      : AAC 192kbps
```

---

## 8. Honest Claims Reference

Use these exact phrases when speaking about capabilities. These protect you from overclaiming while still sounding confident.

### Recovery Engine

| ❌ Don't say | ✅ Say instead |
|---|---|
| "We can recover any deleted file" | "Recovery depends on media condition and whether the data has been overwritten. Our engine provides signature-based carving with structural validation and confidence scoring." |
| "AI-powered recovery" | "Signature-based file carving with structural classification using Pillow and zipfile validation." |

### Drive Eraser

| ❌ Don't say | ✅ Say instead |
|---|---|
| "We wipe drives using ATA Secure Erase" | "Our current prototype implements the sanitization workflow, operation tracking, and verification reporting. Direct ATA/NVMe hardware command integration is the next production layer." |
| "NIST 800-88 certified" | "Our sanitization workflow follows NIST SP 800-88 Rev. 2 methodology." |

### Ledger / Blockchain

| ❌ Don't say | ✅ Say instead |
|---|---|
| "Blockchain-based" | "Cryptographically-linked hash chain ledger with ECDSA signatures — tamper-evident without the overhead of a distributed network." |
| "Cannot be tampered with" | "Any modification to a record is detectable through hash chain integrity verification." |

### Legal Admissibility

| ❌ Don't say | ✅ Say instead |
|---|---|
| "Legally admissible in court" | "The certificate provides cryptographic evidence of the recorded operation. Legal admissibility depends on applicable forensic procedures and jurisdiction." |

---

## 9. Frequently Asked Questions by Judges

Prepare these answers before the presentation.

---

**Q: Did you actually perform ATA Secure Erase on real hardware?**

> "Not at the hardware-command level in this prototype. The sanitization workflow, operation orchestration, verification and PDF certificate generation are fully implemented. Direct ATA Secure Erase and NVMe Sanitize commands are the next integration layer — requiring kernel-level access and physical device provisioning."

---

**Q: Can you recover every deleted file?**

> "No. Recovery depends on the media condition, filesystem state, and whether the underlying sectors have been overwritten. Our engine provides signature-based carving with structural validation and a confidence score for each recovered file — so investigators know which files are reliable evidence and which are fragments."

---

**Q: Is this blockchain?**

> "No traditional blockchain is involved. We use a SHA-256 hash chain — each operation record is linked to the previous one through a cryptographic hash. Combined with ECDSA signatures, this gives us tamper-evident records without the overhead or complexity of a distributed blockchain network."

---

**Q: Is the certificate legally valid in Indian courts?**

> "The certificate provides cryptographic proof of what operation was performed and when. Legal admissibility under the Indian Evidence Act 2023 Section 63 requires proper forensic acquisition procedures, chain of custody documentation, and expert witness testimony — our prototype addresses the technical integrity layer of that requirement."

---

**Q: What happens if the signing key is compromised?**

> "In production, the signing key is managed through a secrets manager and rotated periodically. Key rotation events are logged in the audit trail. In the current prototype, the key is auto-generated and persisted to a secure volume on first run."

---

**Q: How is this different from EnCase or FTK?**

> "EnCase and FTK are excellent tools for their specific purposes. PRAMAAN is designed as a platform that connects the complete workflow — device registration, recovery, sanitization, cryptographic signing, ledger-based audit trail, and certificate generation — in a unified system built for India's law enforcement context, with court-aligned output and government RBAC."

---

**Q: What standards does it follow?**

> "Recovery follows ISO/IEC 27037:2012. Drive sanitization follows NIST SP 800-88 Rev. 2. File erasure follows DoD 5220.22-M patterns. Certificates are designed for compliance with Indian Evidence Act 2023 Section 63."

---

## Quick Reference Card

Print this and keep it next to you while recording.

```
╔══════════════════════════════════════════════════════════╗
║           PRAMAAN DEMO — QUICK REFERENCE                 ║
╠══════════════════════════════════════════════════════════╣
║  URL        : http://localhost:3000                      ║
║  Admin      : demo@pramaan.gov.in / Demo@2026            ║
║  Investigator: investigator@pramaan.gov.in / Demo@2026   ║
╠══════════════════════════════════════════════════════════╣
║  Demo Case  : CASE-2026-NTRO-001                         ║
║  Test Image : recovery-engine/seized_drive.dd            ║
║  Test Files : C:\Users\vighn\Desktop\demo-evidence\      ║
╠══════════════════════════════════════════════════════════╣
║  SCENE ORDER:                                            ║
║  1. Login          4. Recovery job    7. QR verify       ║
║  2. Dashboard      5. Recovered files 8. PDF cert        ║
║  3. Case + Device  6. File erasure    9. Final statement ║
╠══════════════════════════════════════════════════════════╣
║  KEY LINES TO REMEMBER:                                  ║
║  "The file was deleted. Was it really gone?"             ║
║  "How do we prove what happened?"                        ║
║  "Not just a database record — a verifiable record."     ║
║  "PRAMAAN. Recover. Sanitize. Verify. Report."           ║
╚══════════════════════════════════════════════════════════╝
```

---

*PRAMAAN — SIH 2026 · Problem ID 26149 · Ministry of Home Affairs / NTRO*
