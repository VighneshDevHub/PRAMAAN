<div align="center">

# PRAMAAN — File & Folder Eraser Agent

**Python 3.12 · Multi-pass Overwrite · Metadata Scrubbing · ECDSA-signed Certificates**

*Selective secure file and folder deletion CLI agent for the PRAMAAN digital forensics platform.*

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
8. [Erasure Techniques](#8-erasure-techniques)
9. [Operation Report Format](#9-operation-report-format)
10. [How It Connects to the Backend](#10-how-it-connects-to-the-backend)
11. [Running Tests](#11-running-tests)
12. [Security Notes](#12-security-notes)
13. [Demo Screenshots](#13-demo-screenshots)
14. [Roadmap](#14-roadmap)

---

## 1. Overview

The File & Folder Eraser Agent securely deletes specific files and directory trees from a target system. Unlike drive-level erasure, this agent targets individual files or nested folders and ensures:

- **Content obliteration** — file bytes overwritten 3 times before deletion (defeats `undelete` and carving tools)
- **Metadata scrubbing** — timestamps zeroed, filenames randomised before unlink (confounds journal recovery)
- **Slack space overwrite** — free space filled with random bytes post-deletion (overwrites sector remnants)
- **Certified** — submits a signed report to the PRAMAAN backend, receives a tamper-evident PDF certificate

### Use cases

| Use Case | Description |
|---|---|
| Seized device return | Remove sensitive files before returning a device to its owner |
| Case closure | Sanitise evidence working copies after case closure |
| Forensic hygiene | Secure deletion of temporary forensic work products |
| Data subject requests | Compliant deletion under data protection obligations |

### Two execution modes

| Mode | Trigger | Description |
|---|---|---|
| **Dashboard job** | Browser → POST /api/v1/jobs | Backend imports engine in-process, runs in background thread. No CLI needed. |
| **CLI agent** | Terminal command | Runs standalone, authenticates with backend, submits report. |

---

## 2. Directory Structure

```
file-folder-eraser/
├── src/
│   ├── main.py                   CLI entry point
│   ├── batch_runner.py           Orchestrates multi-file/folder erasure
│   │                               Builds file list + calls deleter + scrubber
│   ├── selective_deleter.py      3-pass content overwrite + os.unlink per file
│   ├── metadata_scrubber.py      Zero timestamps + rename before delete
│   ├── freespace_overwriter.py   Fill free/slack space with random bytes
│   ├── report_builder.py         Build operation report dict for backend
│   └── api_client.py             PRAMAAN backend HTTP client (login + submit)
│
├── tests/
│   ├── test_batch_runner.py      batch erasure across file + folder targets
│   ├── test_selective_deleter.py per-file overwrite + unlink verification
│   ├── test_metadata_scrubber.py timestamp zeroing + rename behaviour
│   ├── test_freespace_overwriter.py fill + delete cycle validation
│   └── test_report_builder.py    report dict structure check
│
└── requirements.txt
```

---

## 3. Installation

```bash
# From the repo root with the shared virtual environment active:
pip install -r file-folder-eraser/requirements.txt
```

Dependencies:

```
httpx>=0.27    ← HTTP client for backend API calls
pytest>=8.3   ← test runner
```

---

## 4. Quick Start

### Erase a single file

```bash
# Windows PowerShell
python -m file-folder-eraser.src.main `
  --target C:\Evidence\sensitive_document.docx `
  --email investigator@pramaan.gov.in `
  --password YourPassword

# macOS / Linux
python -m file-folder-eraser.src.main \
  --target /evidence/sensitive_document.docx \
  --email investigator@pramaan.gov.in \
  --password YourPassword
```

### Erase an entire folder (recursive)

```bash
python -m file-folder-eraser.src.main \
  --target /evidence/case-2026-001/working-copies \
  --email investigator@pramaan.gov.in \
  --password YourPassword
```

All files in the folder and all subfolders are erased recursively.

### Expected output

```
[eraser] Target: /evidence/case-2026-001/working-copies
[eraser] Building file list...
[eraser] Found 47 files (total: 8.4 MB)
[eraser] Erasing file  1/47: report_draft_v1.docx  (12 KB) — 3-pass overwrite...
[eraser] Erasing file  2/47: suspect_photo_01.jpg  (384 KB) — 3-pass overwrite...
...
[eraser] Erasing file 47/47: case_notes.txt  (2 KB) — 3-pass overwrite...
[eraser] Metadata scrubbing complete (47 files)
[eraser] Free space overwrite: writing 4.1 GB fill file...
[eraser] Free space overwrite complete
[eraser] Submitting report to backend...
[eraser] Certificate issued: CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[eraser] Ledger sequence number: 9
[eraser] Verify at: http://localhost:3000/verify/CERT-xxx
[eraser] Download PDF: http://localhost:8000/api/v1/operations/CERT-xxx/pdf
```

---

## 5. CLI Reference

```
python -m file-folder-eraser.src.main [OPTIONS]
```

| Argument | Required | Type | Description |
|---|---|---|---|
| `--target` | **Yes** | path | File or directory to erase (recursive for directories) |
| `--email` | **Yes** | string | PRAMAAN operator email for JWT authentication |
| `--password` | **Yes** | string | PRAMAAN operator password |
| `--api-url` | No | URL | Backend URL (default: `http://localhost:8000`) |

### Examples

```bash
# Multiple targets (run multiple invocations, each gets its own certificate)
python -m file-folder-eraser.src.main \
  --target /tmp/case_export.zip \
  --email forensics@ntro.gov.in \
  --password Secret@456

# Remote backend
python -m file-folder-eraser.src.main \
  --target /evidence/working \
  --email forensics@ntro.gov.in \
  --password Secret@456 \
  --api-url https://api.pramaan.yourdomain.gov.in
```

---

## 6. Internal Pipeline

```
main.py
   │
   ├─ 1. batch_runner.py — build file list
   │        └── if target is file:       file_list = [target]
   │        └── if target is directory:  os.walk(target) → all files recursively
   │
   ├─ 2. For each file in file_list:
   │
   │     ├─ metadata_scrubber.scrub(file_path)    ← called BEFORE content overwrite
   │     │        └── os.utime(file_path, (0, 0))   zero atime + mtime
   │     │        └── Remove extended attributes    (xattr on Linux, ADS on Windows)
   │     │        └── Rename to random temp name    confounds journal recovery
   │     │                                          e.g. sensitive.docx → tmpX7k9Zr
   │     │
   │     └─ selective_deleter.secure_delete(renamed_path)
   │              └── open(path, "r+b")
   │              └── Pass 1: write 0x00 × file_size → flush → fsync
   │              └── Pass 2: write 0xFF × file_size → flush → fsync
   │              └── Pass 3: write os.urandom(file_size) → flush → fsync
   │              └── os.unlink(path)
   │
   ├─ 3. freespace_overwriter.overwrite_slack(target_directory)
   │        └── fill_path = target_dir / "freespace_fill_<random>.bin"
   │        └── write random bytes in chunks until 95% free space filled
   │        └── flush + fsync fill_path
   │        └── os.unlink(fill_path)
   │        └── overwrites any sector fragments left by deleted files
   │
   ├─ 4. report_builder.build_report(result, started_at, completed_at, email)
   │        └── operation_type = "FILE_ERASE"
   │        └── includes per-file success/failure breakdown
   │
   └─ 5. api_client.py — submit to backend
            └── POST /api/v1/auth/login  → JWT token
            └── POST /api/v1/operations  → signed record + ledger entry
            └── returns certificate_id, ledger_sequence_number
```

---

## 7. Module Reference

### `batch_runner.py` — run_batch()

```python
@dataclass
class PerFileResult:
    original_path: str
    success: bool
    bytes_overwritten: int
    error: str | None

@dataclass
class BatchResult:
    targets_requested: int
    files_deleted: int
    files_failed: int
    total_bytes_overwritten: int
    metadata_scrubbed: bool
    freespace_bytes_overwritten: int
    per_file_results: list[PerFileResult]

def run_batch(
    targets: list[str],
    free_space_overwrite: bool = False,
    freespace_max_bytes: int | None = None,
) -> BatchResult:
    """
    Erase all files under each target path.
    Returns a BatchResult summarising the operation.
    """
```

---

### `selective_deleter.py` — secure_delete()

```python
def secure_delete(file_path: str) -> int:
    """
    3-pass overwrite + fsync + unlink.
    Returns number of bytes overwritten.
    Raises FileNotFoundError if path does not exist.
    """
```

Pass sequence:

```
Pass 1: b'\x00' × file_size  → write → flush → fsync
Pass 2: b'\xFF' × file_size  → write → flush → fsync
Pass 3: os.urandom(file_size) → write → flush → fsync
os.unlink(file_path)
```

`fsync()` is called after each pass to force OS to flush write buffers to storage medium — not just the OS page cache.

---

### `metadata_scrubber.py` — scrub()

```python
def scrub(file_path: str) -> str:
    """
    Zero filesystem metadata and rename before deletion.
    Returns the new (randomised) path.
    """
```

| Metadata | Action | Method |
|---|---|---|
| atime (last access time) | Zeroed to epoch | `os.utime(path, (0, 0))` |
| mtime (last modified time) | Zeroed to epoch | `os.utime(path, (0, 0))` |
| ctime (change time) | Zeroed where permitted | Platform-specific |
| Filename | Renamed to random string | `os.rename(path, parent/tmpXXXXXX)` |
| Extended attributes | Removed | `xattr.removexattr()` (Linux), ADS strip (Windows) |

Renaming before `unlink` ensures the original filename does not persist in the filesystem journal (NTFS `$LogFile`, ext4 journal) even after deletion.

---

### `freespace_overwriter.py` — overwrite_slack()

```python
def overwrite_slack(
    directory: str,
    max_bytes: int | None = None,
) -> int:
    """
    Fill free space in directory's filesystem with random bytes.
    Returns number of bytes written.
    """
```

Process:

```
1. Calculate available free space: shutil.disk_usage(directory).free
2. fill_size = min(free_space × 0.95, max_bytes)    ← 95% fill, leaves headroom
3. Write fill file in 64KB chunks of os.urandom bytes
4. flush + fsync after every chunk
5. os.unlink(fill_file)

Result: overwrites any sector where a deleted file's bytes may still reside
```

> **SSD note:** Wear-levelling and over-provisioning mean some data may survive in inaccessible sectors on SSDs. For definitive SSD sanitisation, use the Drive Eraser Agent (NIST Purge or Crypto Erase) instead.

---

### `report_builder.py` — build_report()

```python
def build_report(
    result: BatchResult,
    started_at: datetime,
    completed_at: datetime,
    operator: str,
) -> dict:
    """
    Builds OperationReportIn-compatible dict.
    operation_type is always "FILE_ERASE".
    """
```

---

## 8. Erasure Techniques

### 3-Pass Overwrite Pattern

```
File: sensitive.docx (12,043 bytes)

Pass 1: b'\x00' × 12,043  → flush → fsync
        [00 00 00 00 00 00 00 00 ...]

Pass 2: b'\xFF' × 12,043  → flush → fsync
        [FF FF FF FF FF FF FF FF ...]

Pass 3: urandom(12,043)   → flush → fsync
        [A3 7F 12 E9 45 BB 03 91 ...]  (cryptographic random)

Rename: sensitive.docx → tmp_7K9zR
Unlink: tmp_7K9zR
```

Why 3 passes?
- Pass 1 (zeros) — overwrites all data bits
- Pass 2 (ones) — overrides any magnetic remnance bias toward 0
- Pass 3 (random) — makes any partial read indistinguishable from noise

### Comparison with Drive Eraser

| Feature | File/Folder Eraser | Drive Eraser |
|---|---|---|
| Granularity | Individual files/folders | Entire drive/partition |
| Speed | Fast (proportional to file sizes) | Slow (entire drive capacity) |
| Metadata scrubbing | Yes (timestamps, rename) | N/A (entire drive wiped) |
| Slack space overwrite | Yes (fill + delete) | N/A (entire surface wiped) |
| SSD effectiveness | Partial (wear levelling limits) | Full (Purge/Crypto Erase) |
| Best for | Targeted file removal | Full drive handover/disposal |

---

## 9. Operation Report Format

```json
{
  "operation_type": "FILE_ERASE",
  "target_description": "47 file(s) across 1 target(s)",
  "started_at": "2026-09-13T10:00:00Z",
  "completed_at": "2026-09-13T10:00:12Z",
  "success": true,
  "details": {
    "targets_requested": 1,
    "files_deleted": 47,
    "files_failed": 0,
    "total_bytes_overwritten": 8832043,
    "metadata_scrubbed": true,
    "freespace_bytes_overwritten": 4398046511,
    "passes": 3,
    "failures": []
  }
}
```

If any files fail, the `failures` array includes per-file errors:

```json
"failures": [
  { "path": "/evidence/locked_file.log", "error": "PermissionError: [Errno 13]" }
]
```

---

## 10. How It Connects to the Backend

### Option A — Dashboard Job (no CLI required)

```
Browser submits job via dashboard
    └── POST /api/v1/jobs {
          operation_type: "FILE_ERASE",
          payload: {
            targets: ["/path/to/file_or_folder"],
            free_space_overwrite: true,
            freespace_max_bytes: null
          }
        }
    └── Backend: asyncio.create_task(execute_file_erase_job(job_id, operator_email))
    └── job_execution_service.py:
            sys.path.insert(0, file_eraser_root)
            run_batch = importlib.import_module("src.batch_runner").run_batch
            result = await asyncio.to_thread(run_batch, targets, free_space_overwrite, ...)
    └── Backend signs report → appends to ledger → issues certificate
    └── WebSocket push → browser updates in real time
```

### Option B — CLI Agent

```
python -m file-folder-eraser.src.main --target /evidence/working ...
    └── api_client.py: POST /api/v1/auth/login   → JWT
    └── [erasure runs locally]
    └── api_client.py: POST /api/v1/operations   → backend signs + ledger
    └── Certificate ID printed to terminal
```

---

## 11. Running Tests

```bash
cd file-folder-eraser

# All tests
pytest tests/ -v

# Individual modules
pytest tests/test_selective_deleter.py -v
pytest tests/test_metadata_scrubber.py -v
pytest tests/test_freespace_overwriter.py -v
pytest tests/test_batch_runner.py -v

# Quiet
pytest --tb=short -q
```

All tests use **temporary directories and files** created by `tempfile.mkdtemp()`. No real data is touched. Cross-platform (Windows, Linux, macOS).

---

## 12. Security Notes

- **`operator` field** — always overridden by the authenticated JWT email on the backend. The client cannot impersonate another operator.
- **`fsync()` after each pass** — guarantees writes reach the storage medium, not just the OS write-back cache.
- **Rename-before-delete** — the original filename is removed from the directory entry before `unlink`. Filesystem journal recovery tools (e.g. `extundelete`, `photorec`) will find only the random temp name, not the original.
- **SSD limitation** — wear levelling means some data may persist in over-provisioned sectors inaccessible to the OS. For SSDs that must be completely sanitised, use the **Drive Eraser Agent** with NIST Purge or Crypto Erase.
- **Windows Volume Shadow Copy (VSS)** — VSS snapshots may retain copies of erased files. VSS detection and clearing is a planned improvement.

---

## 13. Demo Screenshots

### File Erase Job — Dashboard
```
[ Screenshot — Job detail showing OVERWRITING stage for FILE_ERASE
  with progress bar and "Securely overwriting selected files" message ]
  Path: ../docs/screenshots/file-erase-job.png
```

### File Erase PDF Certificate
```
[ Screenshot — Certificate of Secure File & Folder Erasure PDF
  with file count, total bytes, metadata scrubbed, ECDSA signature, QR code ]
  Path: ../docs/screenshots/file-erase-certificate.png
```

---

## 14. Roadmap

- [ ] `--passes N` flag — control overwrite pass count (default 3)
- [ ] `--algorithm` flag — select DoD 5220.22-M (7-pass), Gutmann (35-pass), or custom
- [ ] `--dry-run` mode — list files that would be erased without touching anything
- [ ] `--job-id` flag — claim and complete a dashboard job autonomously
- [ ] SSD vs HDD auto-detection — warn if freespace overwrite is insufficient for SSD
- [ ] Windows VSS detection and warning
- [ ] Resume support for large batch erasures via checkpoint file
- [ ] Parallel erasure using `concurrent.futures.ThreadPoolExecutor`
- [ ] Per-file SHA-256 of overwritten content in report

---

*Part of the PRAMAAN platform — see [root README](../README.md) for full system documentation.*
