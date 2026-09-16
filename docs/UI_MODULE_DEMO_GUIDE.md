# PRAMAAN — UI Module Demo Guide

> Step-by-step walkthrough for demonstrating all three core forensic modules
> through the web dashboard — no CLI, no terminal needed.

---

## Prerequisites — Do This First

Before running any module demo, make sure both servers are running.

**Terminal 1 — Backend:**
```powershell
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\backend"
.\..\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**
```powershell
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\frontend"
npm run dev -- --port 3000
```

Wait until you see:
```
INFO:     Application startup complete.     ← backend ready
✓ Ready in X.Xs                             ← frontend ready
```

Open browser → `http://localhost:3000` → Login.

---

## Create Demo Test Files (One-time Setup)

Run these once before your demo. These are the files the modules will operate on.

```powershell
# Create a synthetic disk image for Recovery demo
cd "c:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\recovery-engine"
python make_test_evidence.py
# Output: recovery-engine/seized_drive.dd

# Create files for File/Folder Eraser demo
New-Item -Path "C:\pramaan-demo\to-erase" -ItemType Directory -Force
"CONFIDENTIAL CASE FILE - DO NOT DISTRIBUTE" | Set-Content "C:\pramaan-demo\to-erase\confidential_report.txt"
"Suspect communication log - classified" | Set-Content "C:\pramaan-demo\to-erase\comms_log.txt"
"Evidence metadata JSON" | Set-Content "C:\pramaan-demo\to-erase\evidence_meta.json"

# Create a test image file for Drive Eraser demo (safe - just a file, not real hardware)
$bytes = New-Object byte[] (1024 * 1024)  # 1 MB
[System.IO.File]::WriteAllBytes("C:\pramaan-demo\test_drive.img", $bytes)

Write-Output "Demo files created successfully"
```

Verify:
```powershell
Get-ChildItem "C:\pramaan-demo" -Recurse | Select-Object FullName
```

---

## Module 1 — Recovery Engine

**URL:** `http://localhost:3000/dashboard/recovery`

**What it does:** Recovers deleted files from a disk image using signature-based file carving.

**Demo files needed:** `recovery-engine/seized_drive.dd` (created above)

---

### Step 1 — Open Recovery Engine

Click **Recovery Engine** in the left sidebar under **FORENSIC TOOLKIT**.

You land on: **Evidence Recovery & Forensic Carving**

You will see a **4-step wizard** in the main panel.

---

### Step 2 — Step 01: Evidence Source

**What you see:**
- Dropdown: "Registered Media Inventory Device"
- Input field: "Evidence Image Path (.dd / .raw / .img)"
- Input field: "Recovery Output Destination Directory"

**What to fill:**

| Field | Demo Value |
|---|---|
| Registered Device | Leave as "No registered device selected" |
| Evidence Image Path | `C:\Users\vighn\Desktop\STAY-HARD\SIH 2026\PRAMAAN\recovery-engine\seized_drive.dd` |
| Output Directory | `C:\pramaan-demo\recovered-output` |

**Click:** `Continue to Scan Profile →`

> **What to say while doing this:**
> "We point PRAMAAN at the evidence disk image. The source is opened strictly read-only — the original is never touched."

---

### Step 3 — Step 02: Scan Profile

**What you see:** 4 scan mode cards to choose from:

| Card | What it means |
|---|---|
| Quick Scan | Fast, header-only detection |
| Deep Scan | Full header + footer matching |
| Full Surface | Entire image surface analysis |
| Custom | Manual configuration |

**What to select:** Click **Deep Scan** (recommended for demo — finds complete files)

**Click:** `Continue to File Types →`

> **What to say:**
> "Deep scan searches for both file headers and footers — so it recovers complete, validated files, not just fragments."

---

### Step 4 — Step 03: Target File Categories

**What you see:** A grid of file type cards:

```
Images (JPEG, PNG, BMP)     Documents (PDF, DOCX, XLSX)
Videos (MP4, AVI, MOV)      Archives (ZIP, RAR, 7Z)
Audio (MP3, WAV, AAC)       Databases (SQLite, MDB)
```

**What to do:** All categories are selected by default — keep them all selected.

You can click individual cards to toggle them on/off (they highlight in blue when selected).

**Click:** `Review Recovery Parameters →`

> **What to say:**
> "We can target specific file types — images, documents, databases. For this demo we'll recover everything the engine finds."

---

### Step 5 — Step 04: Review & Dispatch

**What you see:**
- Summary tiles: Evidence Source, Scan Profile, Target Categories
- Case linkage dropdown

**What to do:**

1. Check the summary looks correct
2. In the **LINK CASE FILE** dropdown — select your demo case (e.g. `CASE-2026-NTRO-001`) if you created one
3. **Click: `Start Recovery Job →`**

The page **immediately redirects** to the Job Detail page.

> **What to say:**
> "We link this operation to our active case — creating a chain of custody. Then we dispatch the job."

---

### Step 6 — Watch the Job Run (Task Queue)

You are automatically taken to: `http://localhost:3000/dashboard/jobs/{jobId}`

**What you see:**
- Job number (e.g. `FGJ-2026-0000001`)
- Status badge: `PENDING` → `CLAIMED` → `RUNNING` → `COMPLETED`
- Live progress bar (WebSocket — updates without page refresh)
- Stage labels: `SCANNING` → `CARVING` → `CLASSIFYING` → `COMPLETED`

**Wait ~30 seconds** for the job to complete.

> **What to say while progress bar fills:**
> "The recovery engine is now scanning the disk image byte by byte, searching for known file signatures. JPEG starts with FF D8 FF. PDF starts with %PDF. Each match is extracted and structurally validated."

---

### Step 7 — View the Result

When status turns **COMPLETED** (green badge):

- The **Certificate ID** appears (e.g. `CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- Click **View Certificate** or navigate to **Operations** to see the signed record

**What to look for:**
```
Operation Type  : RECOVERY
Files Recovered : 3
Avg Confidence  : 0.85
Source Hash     : a3f2c1... (before)
Source Hash     : a3f2c1... (after — matches = evidence not modified)
```

**Click "Download PDF Certificate"** to show the court-admissible output.

> **What to say:**
> "Three files recovered. Average confidence 0.85. And critically — the source hash before and after recovery is identical. We prove the evidence was not modified during the investigation."

---

## Module 2 — File / Folder Eraser

**URL:** `http://localhost:3000/dashboard/file-eraser`

**What it does:** Securely overwrites and deletes specific files or folders — defeating undelete tools.

**Demo files needed:** `C:\pramaan-demo\to-erase\` folder (created above)

---

### Step 1 — Open File Eraser

Click **File / Folder Eraser** in the left sidebar under **FORENSIC TOOLKIT**.

You land on: **Selective Logical Data Destruction**

You will see a **4-step wizard**.

---

### Step 2 — Step 01: Target Paths

**What you see:**
- Textarea: "Target File / Folder Paths (One per line)"
- Dropdown: "Registered Inventory Device Linkage"

**What to enter in the textarea:**
```
C:\pramaan-demo\to-erase
```

Or enter individual files:
```
C:\pramaan-demo\to-erase\confidential_report.txt
C:\pramaan-demo\to-erase\comms_log.txt
C:\pramaan-demo\to-erase\evidence_meta.json
```

**Click:** `Continue to Standard →`

> **What to say:**
> "We specify the exact files or folders to be destroyed. This is surgical precision — only these paths are touched. Nothing else on the system is affected."

---

### Step 3 — Step 02: Overwrite Standard

**What you see:** 3 standard cards:

| Card | What it means |
|---|---|
| **NIST Clear** | Single overwrite pass — fast |
| **DoD 3-Pass** | 3 passes: zeros, ones, random — standard |
| **Gutmann 35-Pass** | 35 passes — maximum destruction |

**What to select for demo:** Click **DoD 3-Pass** (good balance of speed + demonstration value)

**Below the cards, two checkboxes:**

| Checkbox | Setting for demo |
|---|---|
| Scrub Filesystem Inode Metadata | ✅ Enabled |
| Overwrite Unallocated Free Space | ✅ Enabled |

**Free-Space Cap:** Set to `256` MB (limits demo time)

**Click:** `Continue to Preview →`

> **What to say:**
> "We select 3-pass overwrite — zeros, ones, then random bytes. We also enable metadata scrubbing, which zeros the timestamps and renames the file before deletion to defeat journal recovery tools."

---

### Step 4 — Step 03: Target Preview

**What you see:**
- Amber warning panel showing the list of files to be destroyed
- Summary tiles: Standard, Metadata Scrub status, Free-Space status
- A **READ-ONLY PREVIEW** badge — nothing has happened yet

This is your safety checkpoint. Judges can see the exact scope before anything runs.

> **What to say:**
> "This is the scope preview — strictly read-only. We can see exactly what will be erased before a single byte is touched. This is critical for chain-of-custody accountability."

**Click:** `Continue to Review →`

---

### Step 5 — Step 04: Review & Dispatch

**What you see:**
- Case linkage dropdown
- Target Device Linkage summary
- Execution Agent: `file-folder-eraser CLI Agent`
- RED warning banner: "IRREVERSIBLE SANITISATION MANDATE"

**What to do:**
1. Select your demo case from the dropdown
2. **Click: `Queue File Erase Job →`**

Redirects to Job Detail page automatically.

> **What to say:**
> "Notice the irreversible mandate warning — PRAMAAN makes it explicitly clear this cannot be undone. We link to our case and dispatch."

---

### Step 6 — Watch Job Run

**Job Detail page shows:**
- Status: `PENDING` → `CLAIMED` → `RUNNING` → `COMPLETED`
- Stage: `OVERWRITING` → `METADATA_SCRUBBING` → `FREESPACE_WIPE` → `COMPLETED`
- Progress bar fills from 0% to 100%

**Wait ~20-30 seconds.**

> **What to say:**
> "Three-pass overwrite running now. Then metadata scrub. Then free-space overwrite. After this, even professional data recovery tools cannot reconstruct these files."

---

### Step 7 — View Certificate

When **COMPLETED**:
- Certificate ID appears
- Navigate to **Operations** → find the FILE_ERASE record
- Click **Download PDF** to show the signed certificate

**Certificate shows:**
```
Operation Type      : FILE_ERASE
Files Deleted       : 3
Total Bytes Overwritten : X MB
Metadata Scrubbed   : Yes
Passes              : 3
Standard            : DoD 3-Pass
```

> **What to say:**
> "The certificate records exactly what was destroyed, how many passes, whether metadata was scrubbed — and it's signed with ECDSA and chained into the ledger. Permanent, auditable proof that the sanitization happened."

---

## Module 3 — Drive Eraser

**URL:** `http://localhost:3000/dashboard/drive-eraser`

**What it does:** Wipes entire drives or disk images using NIST SP 800-88 compliant methods.

**Demo file needed:** `C:\pramaan-demo\test_drive.img` (created above — safe file target)

> ⚠️ For demo: use the `.img` file target, NOT real hardware. Leave "Real Device Mode" unchecked.

---

### Step 1 — Open Drive Eraser

Click **Drive Eraser** in the left sidebar under **FORENSIC TOOLKIT**.

You land on: **Secure Storage Sanitisation**

You will see a **4-step wizard**.

---

### Step 2 — Step 01: Drive Selection

**What you see:**
- Dropdown: "Registered Media Inventory Device"
- Input: "Target File Path or Windows Device Identifier"
- Safety warning card (red — always visible)

**What to fill:**

| Field | Demo Value |
|---|---|
| Registered Device | Select a device from dropdown if available, or leave blank |
| Target Path | `C:\pramaan-demo\test_drive.img` |

**The safety warning card says:**
```
DESTRUCTIVE OPERATION
Never target system drives, mounted volumes, or active OS partitions.
```

This is intentional — judges will see PRAMAAN enforces safety warnings.

**Click:** `Continue to Health Check →`

> **What to say:**
> "We specify the target — in this demo, a test image file that acts as a virtual drive. Notice the built-in safety warning. PRAMAAN won't let you proceed without acknowledging the irreversible nature of this operation."

---

### Step 3 — Step 02: Drive Health & Geometry

**What you see:** Device health summary panel

If a registered device is selected, it shows:
```
Device Serial     : USB-DEMO-2026-001
Media Type        : USB
Connection        : USB 3.0
Health Status     : GOOD
Capacity          : 32 GB
```

If no device is registered (using file target only):
```
No device metadata available — using file target path
```

> **What to say:**
> "Before wiping, PRAMAAN checks device health and geometry metadata — serial number, media type, interface. This all goes into the certificate. For hardware with S.M.A.R.T. support, health readings are captured here."

**Click:** `Choose Erase Profile →`

---

### Step 4 — Step 03: Sanitisation Profile

**What you see:** 4 method cards:

| Card | Standard | What it does |
|---|---|---|
| **NIST Clear** | SP 800-88 §2.4 | 3-pass overwrite: 0x00, 0xFF, random |
| **NIST Purge** | SP 800-88 §2.5 | ATA Secure Erase command (SSD/NVMe firmware) |
| **Crypto Erase** | SP 800-88 §2.6 | Replace encryption key (Self-Encrypting Drives) |
| **Verify Only** | — | Read-back verification without wiping |

**Also:** A checkbox: "Mandatory 100% Read-Back Verification"

**What to select for demo:** Click **NIST Clear**

**Leave:** Verification checkbox ✅ enabled

**Click:** `Review Confirmation →`

> **What to say:**
> "Three methods available — each mapped to NIST SP 800-88 guidance. NIST Clear is multi-pass overwrite for all media types. NIST Purge uses the ATA Secure Erase firmware command, which is more thorough for SSDs because it can reach wear-levelled sectors. Crypto Erase destroys the encryption key on self-encrypting drives — near-instantaneous."

---

### Step 5 — Step 04: Confirm & Dispatch

**What you see:**
- RED banner: "IRREVERSIBLE SANITISATION MANDATE" with pulsing red dot
- Target Identifier summary
- Sanitisation Plan: `NIST Clear · 100% Verified`
- Case linkage dropdown
- Red checkbox: "Enable Real-Device Hardware Overwrite Mode"

**What to do:**
1. Select demo case from dropdown
2. **Leave** "Real-Device Hardware Overwrite Mode" **UNCHECKED** (file target mode)
3. **Click: `Dispatch Drive Erase Job →`**

> **What to say:**
> "The mandate warning is mandatory — and intentional. Real-device mode is explicitly disabled here. We're using a test image file. Link to our case, and dispatch."

---

### Step 6 — Watch Job Run

**Job Detail shows:**
- Status: `PENDING` → `CLAIMED` → `RUNNING` → `COMPLETED`
- Stage: `WIPING` → `VERIFYING` → `COMPLETED`
- Progress bar 0% → 100%

**Wait ~15-20 seconds** for the file wipe.

> **What to say:**
> "NIST Clear running now. Three passes. Then read-back verification — random sectors are re-read to confirm they were actually overwritten."

---

### Step 7 — View Certificate

When **COMPLETED:**

**Certificate shows:**
```
Operation Type      : DRIVE_ERASE
Method              : NIST Clear
Passes              : 3
Bytes Processed     : 1,048,576 (1 MB)
Verification Passed : Yes
Samples Checked     : 10/10
Device Serial       : test_drive.img
```

Click **Download PDF** to show the full certificate with:
- NTRO header
- Device hardware details
- Wipe method and pass count
- Verification result
- SHA-256 hash
- ECDSA P-256 signature
- Ledger sequence number
- QR code (scan to verify independently)

> **What to say:**
> "The certificate proves the wipe happened. Not just a log entry — a cryptographically signed, ledger-anchored document. Scan the QR code and anyone can independently verify this certificate without needing access to the database."

---

## After All Three Modules — Show the Audit Trail

After running all three demos, go to:

`http://localhost:3000/dashboard/ledger`

**What you see:**
```
Sequence  Certificate ID        Operation     Hash
1         CERT-xxxx...          RECOVERY      a3f2c1...
2         CERT-yyyy...          FILE_ERASE    b7e9d4...
3         CERT-zzzz...          DRIVE_ERASE   c1a8f2...
```

Click **Verify Chain** button.

**Result:** `✓ Chain valid — 3 entries verified from genesis`

> **What to say:**
> "Every operation from this investigation is chained together. Recovery. File erasure. Drive wipe. Three operations, three certificates, one tamper-evident audit chain. Change any record and the chain breaks."

---

## Task Queue — Live View

At any point during demos, go to:

`http://localhost:3000/dashboard/jobs`

**What you see:**
- All jobs listed with status badges
- Active jobs show progress bars
- Filter tabs: ALL / PENDING / RUNNING / COMPLETED / FAILED
- Click any row → live WebSocket job detail

This is where judges can see **real-time execution** happening inside the backend.

---

## Quick Reference — All Demo Values

```
╔═══════════════════════════════════════════════════════════════╗
║               PRAMAAN UI DEMO — QUICK REFERENCE              ║
╠═══════════════════════════════════════════════════════════════╣
║  Frontend  : http://localhost:3000                            ║
║  Backend   : http://localhost:8000                            ║
║  Login     : demo@pramaan.gov.in / Demo@2026                  ║
╠═══════════════════════════════════════════════════════════════╣
║  MODULE 1 — RECOVERY ENGINE                                   ║
║  URL       : /dashboard/recovery                              ║
║  Image     : recovery-engine/seized_drive.dd                  ║
║  Output    : C:\pramaan-demo\recovered-output                 ║
║  Scan Mode : Deep Scan                                        ║
╠═══════════════════════════════════════════════════════════════╣
║  MODULE 2 — FILE / FOLDER ERASER                              ║
║  URL       : /dashboard/file-eraser                           ║
║  Target    : C:\pramaan-demo\to-erase                         ║
║  Method    : DoD 3-Pass                                       ║
║  Metadata  : Enabled                                          ║
║  Freespace : Enabled (256 MB cap)                             ║
╠═══════════════════════════════════════════════════════════════╣
║  MODULE 3 — DRIVE ERASER                                      ║
║  URL       : /dashboard/drive-eraser                          ║
║  Target    : C:\pramaan-demo\test_drive.img                   ║
║  Method    : NIST Clear                                       ║
║  Real Mode : DISABLED (file target only)                      ║
╠═══════════════════════════════════════════════════════════════╣
║  AUDIT TRAIL : /dashboard/ledger → Verify Chain               ║
║  TASK QUEUE  : /dashboard/jobs                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## What Each Module Produces

| Module | Creates in DB | Certificate Type | PDF Title |
|---|---|---|---|
| Recovery Engine | `OperationRecord` (RECOVERY) + `LedgerEntry` | Recovery certificate | Forensic File Recovery Report |
| File/Folder Eraser | `OperationRecord` (FILE_ERASE) + `LedgerEntry` | Erasure certificate | Certificate of Secure File & Folder Erasure |
| Drive Eraser | `OperationRecord` (DRIVE_ERASE) + `LedgerEntry` | Drive certificate | Certificate of Secure Drive Erasure |

Every operation: SHA-256 signed → ECDSA sealed → Ledger chained → PDF + QR generated.

---

*PRAMAAN — SIH 2026 · Problem ID 26149*
