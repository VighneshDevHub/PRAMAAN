<div align="center">

# PRAMAAN — Recovery Engine

**Python 3.12 · Signature-based File Carving · Confidence Scoring · Read-only Forensic Imaging**

*Deleted file recovery CLI agent for the PRAMAAN digital forensics platform.*

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [Installation](#3-installation)
4. [Quick Start](#4-quick-start)
5. [CLI Reference](#5-cli-reference)
6. [Internal Pipeline](#6-internal-pipeline)
7. [Module Reference](#7-module-reference)
8. [File Signatures Supported](#8-file-signatures-supported)
9. [Confidence Scoring](#9-confidence-scoring)
10. [Evidence Integrity Guarantee](#10-evidence-integrity-guarantee)
11. [Operation Report Format](#11-operation-report-format)
12. [How It Connects to the Backend](#12-how-it-connects-to-the-backend)
13. [Running Tests](#13-running-tests)
14. [Forensic Compliance](#14-forensic-compliance)
15. [Demo Screenshots](#15-demo-screenshots)
16. [Roadmap](#16-roadmap)

---

## 1. Overview

The Recovery Engine recovers deleted files from seized disk images using **signature-based file carving**. It is forensically sound by design:

- **Read-only** — the source evidence image is opened with `open(path, 'rb')` and is never modified
- **Integrity-verified** — SHA-256 hash of the source is computed before and after recovery; any change is a critical failure
- **Confidence-scored** — every recovered file gets a 0.0–1.0 score based on completeness and structural validity
- **AI-classified** — files are structurally validated using Pillow (images) and stdlib `zipfile` (archives)
- **Certified** — submits a signed operation report to the PRAMAAN backend, receives a tamper-evident PDF certificate

### Two execution modes

| Mode | Trigger | Description |
|---|---|---|
| **Dashboard job** | Browser → POST /api/v1/jobs | Backend imports engine in-process, runs in background thread. No CLI needed. |
| **CLI agent** | Terminal command | Runs standalone, authenticates with backend, submits report, receives certificate. |

---

## 2. Directory Structure

```
recovery-engine/
├── src/
│   ├── main.py                   CLI entry point and top-level orchestrator
│   ├── recovery_engine.py        Pipeline: read → carve → classify → score → write
│   ├── image_reader.py           Read-only evidence image access + SHA-256
│   ├── carver.py                 Signature-based byte-level file carving
│   ├── signatures.py             Header/footer byte pattern database (12+ types)
│   ├── classifier.py             Structural file validation (Pillow + zipfile)
│   ├── confidence_scorer.py      Per-file recovery confidence 0.0–1.0
│   ├── report_builder.py         Build operation report dict for backend submission
│   └── api_client.py             PRAMAAN backend HTTP client (login + submit)
│
├── tests/
│   ├── conftest.py               pytest fixtures — synthetic test images
│   ├── test_carver.py            carving logic on known byte patterns
│   ├── test_classifier.py        classification against synthetic file bytes
│   ├── test_confidence_scorer.py scoring across confidence scenarios
│   ├── test_recovery_engine.py   full pipeline integration test
│   └── test_report_builder.py    report dict structure validation
│
├── make_test_evidence.py         Script to generate a synthetic test disk image
├── recovered/                    Default output directory (auto-created at runtime)
└── requirements.txt
```

---

## 3. Installation

```bash
# From the repo root with the shared virtual environment active:
pip install -r recovery-engine/requirements.txt
```

Dependencies:

```
httpx>=0.27      ← HTTP client for backend API calls
Pillow>=10.4     ← structural JPEG/PNG/GIF validation
pytest>=8.3      ← test runner
```

---

## 4. Quick Start

### Generate a synthetic test evidence image

```bash
cd recovery-engine
python make_test_evidence.py
# Creates: seized_drive.dd  (synthetic image with embedded JPEG, PDF, ZIP)
```

### Run recovery

```bash
# Windows PowerShell
python -m recovery-engine.src.main `
  --image recovery-engine/seized_drive.dd `
  --output-dir recovery-engine/recovered `
  --email investigator@pramaan.gov.in `
  --password YourPassword

# macOS / Linux
python -m recovery-engine.src.main \
  --image recovery-engine/seized_drive.dd \
  --output-dir recovery-engine/recovered \
  --email investigator@pramaan.gov.in \
  --password YourPassword
```

### Expected output

```
[recovery] Opening evidence image: seized_drive.dd (read-only)
[recovery] Source SHA-256 (before): a3f2c1d9e7...
[recovery] Scanning 2097152 bytes for file signatures...
[recovery] Found 3 candidates: 2 JPEG, 1 PDF
[recovery] Classifying and scoring...
[recovery]   recovered_0000_jpeg.jpg  — confidence: 0.92  (footer found, validated)
[recovery]   recovered_0001_jpeg.jpg  — confidence: 0.71  (footer found, no validation)
[recovery]   recovered_0002_pdf.pdf   — confidence: 0.85  (footer found, validated)
[recovery] Source SHA-256 (after):  a3f2c1d9e7...  ✓ MATCH — evidence integrity preserved
[recovery] Submitting report to backend...
[recovery] Certificate issued: CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[recovery] Ledger sequence number: 4
[recovery] Verify at: http://localhost:3000/verify/CERT-xxx
[recovery] Download PDF: http://localhost:8000/api/v1/operations/CERT-xxx/pdf
```

---

## 5. CLI Reference

```
python -m recovery-engine.src.main [OPTIONS]
```

| Argument | Required | Type | Description |
|---|---|---|---|
| `--image` | **Yes** | path | Path to the evidence disk image (opened read-only) |
| `--output-dir` | **Yes** | path | Directory to write recovered files to (auto-created) |
| `--email` | **Yes** | string | PRAMAAN operator email for JWT authentication |
| `--password` | **Yes** | string | PRAMAAN operator password |
| `--api-url` | No | URL | Backend URL (default: `http://localhost:8000`) |

### Usage examples

```bash
# Real seized drive image
python -m recovery-engine.src.main \
  --image /evidence/case-2026-001/disk.dd \
  --output-dir /recovered/case-2026-001 \
  --email forensics@ntro.gov.in \
  --password Secret@456

# Point to a remote backend
python -m recovery-engine.src.main \
  --image disk.dd \
  --output-dir ./recovered \
  --email forensics@ntro.gov.in \
  --password Secret@456 \
  --api-url https://api.pramaan.yourdomain.gov.in
```

---

## 6. Internal Pipeline

```
main.py
   │
   ├─ 1. image_reader.py — open evidence image
   │        └── open(image_path, "rb")    ← READ-ONLY, no write permissions ever
   │        └── SHA-256(entire image)     ← source_hash_before
   │
   ├─ 2. carver.py — signature-based carving
   │        └── buffer = reader.read_all_bytes()
   │        └── for each signature in signatures.py:
   │                scan buffer for header bytes
   │                  └── if found: scan forward for footer bytes
   │                        └── extract bytes[header_offset : footer_offset]
   │                              → CarvingResult { offset, size, raw_bytes, type }
   │
   ├─ 3. classifier.py — structural validation
   │        └── for each CarvingResult:
   │                JPEG / PNG / GIF → Pillow.Image.open(BytesIO(raw_bytes))
   │                ZIP / DOCX / XLSX → zipfile.is_zipfile(BytesIO(raw_bytes))
   │                others           → structurally_validated = None
   │
   ├─ 4. confidence_scorer.py — score 0.0–1.0
   │        └── base_score:  0.85 if footer_found else 0.35
   │        └── +0.15 if structurally_validated == True
   │        └── -0.25 if structurally_validated == False
   │
   ├─ 5. write recovered files
   │        └── output_dir/recovered_{seq:04d}_{type}{ext}
   │        └── source image is NEVER written to
   │
   ├─ 6. SHA-256(entire image) again → source_hash_after
   │        └── assert source_hash_before == source_hash_after
   │        └── CRITICAL FAILURE if hashes differ
   │
   ├─ 7. report_builder.py — build report dict
   │
   └─ 8. api_client.py — submit to backend
            └── POST /api/v1/auth/login     → JWT token
            └── POST /api/v1/operations     → signed record + certificate
            └── returns certificate_id, ledger_sequence_number
```

---

## 7. Module Reference

### `image_reader.py` — ImageReader

```python
class ImageReader:
    def __init__(self, path: str): ...
    def sha256(self) -> str:           # Compute SHA-256 of entire file
    def read_all_bytes(self) -> bytes: # Read complete image into memory
```

Opens file with `open(path, 'rb')` — strictly read-only. Any attempt to write to the image path is a bug.

---

### `signatures.py` — FileSignature

```python
@dataclass
class FileSignature:
    name: str               # "JPEG", "PDF", "ZIP", etc.
    extension: str          # ".jpg", ".pdf", ".zip", etc.
    header: bytes           # magic bytes to search for
    footer: bytes | None    # closing bytes (None = size-based)
    max_size: int           # maximum plausible file size in bytes

SIGNATURES: list[FileSignature] = [ ... ]   # 12+ entries
```

New file types can be added to `SIGNATURES` without modifying any other file.

---

### `carver.py` — carve()

```python
def carve(buffer: bytes) -> list[CarvingResult]:
    """
    Scan buffer for all known file signatures.
    Returns a list of CarvingResult objects, one per found candidate.
    """

@dataclass
class CarvingResult:
    signature_name: str
    extension: str
    offset: int          # byte offset of header in original image
    size: int            # extracted file size in bytes
    data: bytes          # extracted raw bytes
    footer_found: bool   # True if closing footer bytes were located
```

---

### `classifier.py` — classify()

```python
def classify(result: CarvingResult) -> ClassifiedResult:
    """
    Attempt structural validation of the carved bytes.
    Uses Pillow for images, zipfile for archives.
    Returns ClassifiedResult with structurally_validated: bool | None
    """

@dataclass
class ClassifiedResult(CarvingResult):
    structurally_validated: bool | None
    # True  = opened successfully by Pillow/zipfile
    # False = Pillow/zipfile rejected the bytes
    # None  = no structural validator available for this type
```

---

### `confidence_scorer.py` — score()

```python
def score(result: ClassifiedResult) -> float:
    """Returns a confidence score 0.0–1.0"""
    base = 0.85 if result.footer_found else 0.35
    if result.structurally_validated is True:
        base += 0.15
    elif result.structurally_validated is False:
        base -= 0.25
    return round(min(max(base, 0.0), 1.0), 2)
```

---

### `report_builder.py` — build_report()

```python
def build_report(
    summary: RecoverySummary,
    started_at: datetime,
    completed_at: datetime,
    operator: str,
) -> dict:
    """
    Builds the OperationReportIn-compatible dict for POST /api/v1/operations.
    operation_type is always "RECOVERY".
    """
```

---

## 8. File Signatures Supported

| File Type | Header (hex) | Footer (hex) | Notes |
|---|---|---|---|
| JPEG | `FF D8 FF` | `FF D9` | Most common image format |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `AE 42 60 82` | Lossless image |
| PDF | `25 50 44 46` (`%PDF`) | `25 25 45 4F 46` (`%%EOF`) | Document |
| ZIP | `50 4B 03 04` | `50 4B 05 06` | Archive + DOCX/XLSX container |
| GIF | `47 49 46 38` (`GIF8`) | `00 3B` | Animated/static image |
| BMP | `42 4D` | _(size-based)_ | Windows bitmap |
| MP4 | `66 74 79 70` at offset 4 | _(size-based)_ | Video |
| AVI | `52 49 46 46` (`RIFF`) | _(size-based)_ | Video |
| MP3 | `FF FB` or `49 44 33` (`ID3`) | _(size-based)_ | Audio |
| DOCX | _(ZIP container)_ | — | Microsoft Word |
| XLSX | _(ZIP container)_ | — | Microsoft Excel |
| SQLite | `53 51 4C 69 74 65` (`SQLite`) | _(size-based)_ | SQLite database |

> Adding a new signature: add one `FileSignature(...)` entry to `signatures.py`. No other changes needed.

---

## 9. Confidence Scoring

```
Score 0.90 – 1.00 │ High confidence   — complete file, passes structural check
Score 0.70 – 0.89 │ Good confidence   — probably usable, footer found
Score 0.50 – 0.69 │ Fair confidence   — may be truncated or partially overwritten
Score 0.00 – 0.49 │ Low confidence    — fragment only, likely unusable

Scoring formula:
  base = 0.85  (footer found = complete file)
  base = 0.35  (no footer = truncated/fragment)

  if structurally_validated == True:   base += 0.15
  if structurally_validated == False:  base -= 0.25
  if structurally_validated == None:   base unchanged

  final = clamp(base, 0.0, 1.0)
```

---

## 10. Evidence Integrity Guarantee

The recovery engine computes SHA-256 of the evidence image at two checkpoints:

```
Before recovery:
  source_hash_before = SHA-256( open(image_path, 'rb').read() )

... carving runs (read-only operations only) ...

After recovery:
  source_hash_after  = SHA-256( open(image_path, 'rb').read() )

Assert: source_hash_before == source_hash_after
  ✓  Match   → integrity preserved, both hashes included in certificate
  ✗  Mismatch → CRITICAL error raised, recovery aborted, not reported
```

Both hashes are embedded in the operation report and the issued PDF certificate. This proves to a court that the forensic investigation did not alter the original evidence — satisfying **ISO/IEC 27037** read-only acquisition requirements.

---

## 11. Operation Report Format

```json
{
  "operation_type": "RECOVERY",
  "target_description": "seized_drive.dd",
  "started_at": "2026-09-13T10:00:00Z",
  "completed_at": "2026-09-13T10:01:47Z",
  "success": true,
  "details": {
    "files_recovered": 8,
    "avg_confidence": 0.81,
    "classifications": {
      "JPEG": 4,
      "PDF": 2,
      "ZIP": 1,
      "unknown": 1
    },
    "source_hash_before": "a3f2c1d9e7b8...",
    "source_hash_after":  "a3f2c1d9e7b8...",
    "integrity_preserved": true,
    "recovered_files": [
      {
        "file_type": "JPEG",
        "offset": 512,
        "size": 24576,
        "confidence": 0.92,
        "footer_found": true,
        "structurally_validated": true,
        "output_path": "/recovered/case-001/recovered_0000_jpeg.jpg"
      }
    ]
  }
}
```

---

## 12. How It Connects to the Backend

### Option A — Dashboard Job (no CLI required)

```
Browser submits job via dashboard
    └── POST /api/v1/jobs { operation_type: "RECOVERY", payload: { image_path, output_dir } }
    └── Backend: asyncio.create_task(execute_recovery_job(job_id, operator_email))
    └── job_execution_service.py:
            sys.path.insert(0, recovery_engine_root)
            run_recovery = importlib.import_module("src.recovery_engine").run_recovery
            report = await asyncio.to_thread(_run_recovery, payload)
    └── Backend signs report → appends to ledger → issues certificate
    └── WebSocket push → browser updates in real time
```

### Option B — CLI Agent (direct submission)

```
python -m recovery-engine.src.main --image disk.dd ...
    └── api_client.py: POST /api/v1/auth/login   → JWT
    └── [recovery runs locally]
    └── api_client.py: POST /api/v1/operations   → backend signs + ledger
    └── Certificate ID printed to terminal
```

In both modes, the signing key never leaves the backend. The certificate is always issued server-side.

---

## 13. Running Tests

```bash
cd recovery-engine

# All tests
pytest tests/ -v

# Individual modules
pytest tests/test_carver.py -v
pytest tests/test_classifier.py -v
pytest tests/test_confidence_scorer.py -v
pytest tests/test_recovery_engine.py -v

# Quiet
pytest --tb=short -q
```

All tests use **synthetic in-memory images** generated by `conftest.py`. No real disk images required. Cross-platform (Windows, Linux, macOS).

---

## 14. Forensic Compliance

| Standard | Requirement | Implementation |
|---|---|---|
| ISO/IEC 27037:2012 | Read-only acquisition | `open(path, 'rb')` only; no write operations ever |
| ISO/IEC 27037:2012 | Integrity preservation | SHA-256 before and after, both in certificate |
| SWGDE Best Practices | Non-alteration principle | Recovered files written to separate output dir |
| Indian Evidence Act 2023 §63 | Electronic record admissibility | ECDSA-signed certificate + ledger chain |
| IT (Amendment) Act 2008 | Admissibility requirements | Tamper-evident PDF with court-format attestation box |

---

## 15. Demo Screenshots

### Recovery Job Running (Dashboard)
```
[ Screenshot — Job detail showing SCANNING stage at 45% with
  "Scanning for JPEG signatures..." message via WebSocket ]
  Path: ../docs/screenshots/recovery-job-running.png
```

### Recovered Files — Evidence Explorer
```
[ Screenshot — Case detail Evidence Explorer tab showing
  recovered JPEG/PDF/ZIP files with confidence badges ]
  Path: ../docs/screenshots/evidence-explorer.png
```

### Recovery PDF Certificate
```
[ Screenshot — Forensic File Recovery Report PDF with
  NTRO header, file count, avg confidence, source hashes,
  ECDSA signature, QR code ]
  Path: ../docs/screenshots/recovery-certificate.png
```

---

## 16. Roadmap

- [ ] `--min-confidence FLOAT` flag — filter out low-confidence recoveries
- [ ] `--types JPEG,PDF` flag — carve specific file types only
- [ ] `--job-id` flag — claim and complete a dashboard job autonomously
- [ ] NTFS MFT (`$MFT`) parsing for metadata-assisted recovery (higher accuracy)
- [ ] EXT4 journal parsing for Linux disk images
- [ ] E01/EWF forensic image format support via `libewf`
- [ ] Per-file MD5 + SHA-256 hashes in report
- [ ] Parallel carving using `multiprocessing` for large images
- [ ] AI image content classification (ResNet/MobileNet) — weapons, documents, currency
- [ ] `--resume` flag with checkpoint file for interrupted large recoveries

---

*Part of the PRAMAAN platform — see [root README](../README.md) for full system documentation.*
