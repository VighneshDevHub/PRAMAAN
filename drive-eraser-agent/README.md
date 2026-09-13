<div align="center">

# PRAMAAN — Drive Eraser Agent

**Python 3.12 · NIST SP 800-88 Rev.1 · Multi-platform · ECDSA-signed Certificates**

*Secure drive sanitisation CLI agent for the PRAMAAN digital forensics platform.*

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
8. [Wipe Methods](#8-wipe-methods)
9. [Verification](#9-verification)
10. [Operation Report Format](#10-operation-report-format)
11. [How It Connects to the Backend](#11-how-it-connects-to-the-backend)
12. [Running Tests](#12-running-tests)
13. [Safety & Security Notes](#13-safety--security-notes)
14. [Demo Screenshots](#14-demo-screenshots)
15. [Roadmap](#15-roadmap)

---

## 1. Overview

The Drive Eraser Agent sanitises physical drives and file targets according to **NIST SP 800-88 Rev.1** — the US government standard for media sanitisation. After wiping, it submits a signed operation report to the PRAMAAN backend, which issues a tamper-evident digital certificate.

### Supported targets

| Target Type | Platform | How Specified |
|---|---|---|
| Physical disk (Windows) | Windows 10/11 | DeviceId (e.g. `1`) from `Get-PhysicalDisk` |
| Block device (Linux) | Linux | Device path (e.g. `/dev/sdb`) |
| File target | Any OS | File path (e.g. `test_volume.img`) — **safe demo mode** |

### Standards implemented

| Method | Standard | Media |
|---|---|---|
| **NIST Clear** | NIST SP 800-88 §2.4 | All types (HDD, SSD, NVMe, USB) |
| **NIST Purge** | NIST SP 800-88 §2.5 | SSD/NVMe (ATA Secure Erase command) |
| **Crypto Erase** | NIST SP 800-88 §2.6 | Self-encrypting drives (SED) |

### Two execution modes

| Mode | Trigger | Description |
|---|---|---|
| **Dashboard job** | Browser → POST /api/v1/jobs | Backend imports engine in-process. No CLI needed. |
| **CLI agent** | Terminal command | Runs standalone, authenticates with backend, submits report. |

---

## 2. Directory Structure

```
drive-eraser-agent/
├── src/
│   ├── main.py                       CLI entry point + orchestrator
│   ├── method_selector.py            Auto-select wipe method from device capabilities
│   ├── verifier.py                   Pre/post-wipe random sampling + verification
│   ├── report_builder.py             Build operation report dict for backend
│   ├── api_client.py                 PRAMAAN backend HTTP client (login + submit)
│   │
│   ├── detectors/
│   │   ├── base.py                   DetectedDevice dataclass
│   │   ├── file_target.py            Safe demo mode — treats a file as a virtual device
│   │   ├── windows_block_device.py   Windows Get-PhysicalDisk via WMI/PowerShell
│   │   └── linux_block_device.py     Linux /dev/sdX detection via /proc/partitions
│   │
│   └── wipers/
│       ├── base.py                   WipeResult dataclass + BaseWiper ABC
│       ├── clear.py                  NIST Clear — 3-pass byte overwrite
│       ├── purge.py                  NIST Purge — ATA Secure Erase command
│       └── crypto_erase.py           Crypto Erase — encryption key destruction
│
├── tests/
│   ├── test_detectors.py             file_target + device detection
│   ├── test_wipers.py                wipe logic on file targets
│   ├── test_verifier.py              pre/post sampling verification
│   ├── test_report_builder.py        report dict structure
│   ├── test_windows_block_device.py  Windows WMI parsing
│   └── test_main_windows_path.py     Windows physical drive path formatting
│
└── requirements.txt
```

---

## 3. Installation

```bash
# From the repo root with the shared virtual environment active:
pip install -r drive-eraser-agent/requirements.txt
```

Dependencies:

```
httpx>=0.27    ← HTTP client for backend API calls
pytest>=8.3   ← test runner
```

---

## 4. Quick Start

### Safe Demo Mode (no real hardware — recommended for testing)

Creates and wipes a virtual file device. Safe on any OS.

```bash
# Create a test target file first
python -c "
with open('test_volume.img', 'wb') as f:
    f.write(b'SENSITIVE_DATA_' * 1000)
print('Created test_volume.img')
"

# Windows PowerShell
python -m drive-eraser-agent.src.main `
  --target test_volume.img `
  --email investigator@pramaan.gov.in `
  --password YourPassword

# macOS / Linux
python -m drive-eraser-agent.src.main \
  --target test_volume.img \
  --email investigator@pramaan.gov.in \
  --password YourPassword
```

### Dry Run (detect only — never wipes)

Always dry-run first before wiping any real device.

```bash
python -m drive-eraser-agent.src.main \
  --target test_volume.img \
  --email investigator@pramaan.gov.in \
  --password YourPassword \
  --dry-run
```

Output shows device metadata only. Nothing is written.

### Expected output (demo mode)

```
[eraser] Detecting device: test_volume.img
[eraser] Device type: HDD (file target)
[eraser] Serial: test_volume.img
[eraser] Size: 15,000 bytes
[eraser] Supports encryption: No
[eraser] Selected wipe method: NIST Clear (3-pass overwrite)
[eraser] Capturing pre-wipe samples (10 random offsets)...
[eraser] Starting wipe — Pass 1/3 (0x00 fill)...
[eraser] Starting wipe — Pass 2/3 (0xFF fill)...
[eraser] Starting wipe — Pass 3/3 (random bytes)...
[eraser] Wipe complete: 15,000 bytes processed in 3 passes
[eraser] Verifying wipe (reading 10 sample offsets)...
[eraser] Verification passed: 10/10 samples overwritten ✓
[eraser] Submitting report to backend...
[eraser] Certificate issued: CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[eraser] Ledger sequence number: 5
[eraser] Verify at: http://localhost:3000/verify/CERT-xxx
[eraser] Download PDF: http://localhost:8000/api/v1/operations/CERT-xxx/pdf
```

---

## 5. CLI Reference

```
python -m drive-eraser-agent.src.main [OPTIONS]
```

| Argument | Required | Type | Description |
|---|---|---|---|
| `--target` | **Yes** | string | File path, Linux `/dev/sdX`, or Windows DeviceId |
| `--email` | **Yes** | string | PRAMAAN operator email for JWT authentication |
| `--password` | **Yes** | string | PRAMAAN operator password |
| `--api-url` | No | URL | Backend URL (default: `http://localhost:8000`) |
| `--real-device` | No | flag | Treat `--target` as a real hardware device |
| `--dry-run` | No | flag | Detect and print info only — **never writes** |

### Real Device — Windows

```powershell
# Step 1: Find the DeviceId
Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, SerialNumber, MediaType, BusType, Size

# Step 2: ALWAYS dry-run first
python -m drive-eraser-agent.src.main `
  --target 1 `
  --email investigator@pramaan.gov.in `
  --password YourPassword `
  --real-device `
  --dry-run

# Step 3: Real wipe (IRREVERSIBLE)
python -m drive-eraser-agent.src.main `
  --target 1 `
  --email investigator@pramaan.gov.in `
  --password YourPassword `
  --real-device
```

> ⚠️ `--target` on Windows is the **DeviceId number** (e.g. `1`), NOT a drive letter like `D:`.

### Real Device — Linux

```bash
# Step 1: Identify the disk
lsblk
# or: fdisk -l | grep "^/dev"

# Step 2: ALWAYS dry-run first
python -m drive-eraser-agent.src.main \
  --target /dev/sdb \
  --email investigator@pramaan.gov.in \
  --password YourPassword \
  --real-device \
  --dry-run

# Step 3: Real wipe (IRREVERSIBLE — requires root)
sudo python -m drive-eraser-agent.src.main \
  --target /dev/sdb \
  --email investigator@pramaan.gov.in \
  --password YourPassword \
  --real-device
```

> ⚠️ Never target your OS boot disk (`/dev/sda` on most Linux systems). Double-check with `lsblk` first.

---

## 6. Internal Pipeline

```
main.py
   │
   ├─ 1. Select detector based on flags + platform
   │        ├── --real-device + Windows   → WindowsBlockDeviceDetector
   │        ├── --real-device + Linux     → LinuxBlockDeviceDetector
   │        └── (default / file target)   → FileTargetDetector
   │
   ├─ 2. detector.detect(target)
   │        └── Returns: DetectedDevice {
   │                device_type,          "HDD" | "SSD" | "NVMe" | "USB" | "Unknown"
   │                serial_number,        from WMI / /sys / stat()
   │                model,                from WMI / /sys / filename
   │                size_bytes,           total capacity
   │                supports_encryption,  True if self-encrypting drive
   │                firmware              firmware revision if available
   │              }
   │
   ├─ 3. method_selector.select_wiper(device_type, supports_encryption)
   │        └── Returns appropriate BaseWiper subclass:
   │                supports_encryption=True  → CryptoEraseWiper
   │                device_type == "SSD"      → PurgeWiper  (or ClearWiper as fallback)
   │                device_type == "NVMe"     → PurgeWiper  (or ClearWiper as fallback)
   │                all others                → ClearWiper
   │
   ├─ 4. verifier.capture_pre_wipe_samples(target, size_bytes)
   │        └── Selects N random byte offsets
   │        └── Reads actual bytes at each offset
   │        └── Returns: list[(offset, bytes)]
   │
   ├─ 5. [--dry-run check: if set, print info and exit here]
   │
   ├─ 6. wiper.wipe(target, size_bytes)
   │        └── Returns: WipeResult {
   │                method_name,
   │                passes,
   │                bytes_processed,
   │                duration_seconds,
   │              }
   │
   ├─ 7. verifier.verify_wipe(target, pre_wipe_samples)
   │        └── Reads the same N offsets again
   │        └── Compares: original bytes != new bytes?
   │        └── Returns: VerificationResult {
   │                passed,              True if all samples changed
   │                samples_checked,     N (e.g. 10)
   │                samples_changed,     number that differ from pre-wipe
   │              }
   │
   ├─ 8. report_builder.build_report(device, wipe_result, started_at, completed_at,
   │                                  verification.passed, operator)
   │
   └─ 9. api_client.py — submit to backend
            └── POST /api/v1/auth/login  → JWT token
            └── POST /api/v1/operations  → signed record + ledger entry
            └── returns certificate_id, ledger_sequence_number
```

---

## 7. Module Reference

### `detectors/base.py` — DetectedDevice

```python
@dataclass
class DetectedDevice:
    device_type: str          # "HDD" | "SSD" | "NVMe" | "USB" | "Unknown"
    serial_number: str        # unique hardware identifier
    model: str                # manufacturer + model string
    size_bytes: int           # total capacity in bytes
    supports_encryption: bool # True = self-encrypting drive (SED)
    firmware: str             # firmware revision (if readable)
    connection_type: str      # "SATA" | "NVMe" | "USB" | "Unknown"
```

---

### `detectors/file_target.py` — FileTargetDetector

Safe demo mode. Treats any regular file as a virtual device. Uses `os.stat()` for size, filename as serial number. **No hardware access.**

---

### `detectors/windows_block_device.py` — WindowsBlockDeviceDetector

```python
# Calls PowerShell:
# Get-PhysicalDisk | Select-Object DeviceId, SerialNumber, MediaType, BusType, Size
# Then: (Get-Disk -Number {DeviceId}).FirmwareVersion
```

Requires Windows. The `--target` must be the integer `DeviceId` shown by `Get-PhysicalDisk`.

---

### `detectors/linux_block_device.py` — LinuxBlockDeviceDetector

```python
# Reads: /proc/partitions, /sys/block/{dev}/size
# hdparm -I /dev/{dev} for serial/model/firmware (requires hdparm, root)
```

Requires Linux. The `--target` must be a full block device path like `/dev/sdb`.

---

### `method_selector.py` — select_wiper()

```python
def select_wiper(device_type: str, supports_encryption: bool) -> BaseWiper:
    if supports_encryption:
        return CryptoEraseWiper()
    if device_type in ("SSD", "NVMe"):
        return PurgeWiper()   # falls back to ClearWiper if ATA command unsupported
    return ClearWiper()
```

---

### `wipers/base.py` — BaseWiper

```python
@dataclass
class WipeResult:
    method_name: str
    passes: int
    bytes_processed: int
    duration_seconds: float

class BaseWiper(ABC):
    @abstractmethod
    def wipe(self, target: str, size_bytes: int) -> WipeResult: ...
```

---

### `verifier.py` — capture_pre_wipe_samples() / verify_wipe()

```python
def capture_pre_wipe_samples(target: str, size_bytes: int, n: int = 10) -> list[tuple[int, bytes]]:
    """Read bytes at N random offsets. Returns [(offset, raw_bytes), ...]"""

def verify_wipe(target: str, pre_samples: list[tuple[int, bytes]]) -> VerificationResult:
    """Re-read same offsets. Compare against pre-wipe bytes."""

@dataclass
class VerificationResult:
    passed: bool            # True if all samples differ from pre-wipe
    samples_checked: int
    samples_changed: int
```

---

## 8. Wipe Methods

### NIST Clear — `wipers/clear.py`

Multi-pass overwrite. Compliant with NIST SP 800-88 Rev.1 §2.4.

```
Pass 1: write 0x00 × size_bytes  → flush (all zeros)
Pass 2: write 0xFF × size_bytes  → flush (all ones)
Pass 3: write urandom × size_bytes → flush (cryptographic random)
```

Suitable for all media types. Works on any OS without special kernel access.

---

### NIST Purge — `wipers/purge.py`

Issues the **ATA Secure Erase** command directly to the drive controller firmware. The drive's own microcontroller erases all NAND cells including:

- Wear-levelled sectors inaccessible to the OS
- Host Protected Area (HPA)
- Over-provisioned reserve space

More thorough than software overwrite for SSDs because the firmware can reach cells that OS-level writes cannot.

```
Requires:
  Linux: hdparm -I /dev/{dev}  to confirm Secure Erase support
         hdparm --security-erase  to execute
  Windows: requires vendor tools or kernel driver access

Fallback: ClearWiper used if ATA Secure Erase is not supported
```

Compliant with NIST SP 800-88 Rev.1 §2.5 (Purge).

---

### Crypto Erase — `wipers/crypto_erase.py`

For **Self-Encrypting Drives (SED)**. The drive maintains an internal Media Encryption Key (MEK). Crypto Erase replaces the MEK with a new random key — all existing data becomes cryptographically inaccessible instantly.

```
REVERT_SP command (TCG Opal) → replaces MEK
  or
ATA Security Disable + Re-enable (non-TCG SEDs)

Result: all data encrypted with discarded key → permanently unrecoverable
Duration: near-instantaneous (no data written, just key replaced)
```

Compliant with NIST SP 800-88 Rev.1 §2.6 (Cryptographic Erase).

### Method Selection Logic

```
Device capabilities
        │
        ├── supports_encryption == True
        │       └── → Crypto Erase  (fastest, most thorough for SEDs)
        │
        ├── device_type in ("SSD", "NVMe")
        │       └── → NIST Purge  (ATA Secure Erase)
        │               └── if unsupported → fallback to NIST Clear
        │
        └── everything else (HDD, USB, Unknown, file target)
                └── → NIST Clear  (3-pass overwrite)
```

---

## 9. Verification

After wiping, `verifier.py` checks that the wipe actually worked:

```
Before wipe:
  samples = [(offset_1, bytes_at_1), (offset_2, bytes_at_2), ..., (offset_N, bytes_at_N)]
  [10 random offsets by default]

After wipe:
  new_bytes_1 = read(target, offset_1)
  ...

Verification:
  for each (offset, original_bytes):
      if read_bytes == original_bytes: FAILURE — data was not overwritten
      else: PASS

Result:
  passed = (samples_changed == samples_checked)
  samples_changed / samples_checked included in certificate
```

The verification result is included in the operation report and the issued PDF certificate. This proves the wipe was not just recorded but actually executed.

---

## 10. Operation Report Format

```json
{
  "operation_type": "DRIVE_ERASE",
  "target_description": "SSD DeviceId=1 | Samsung 870 EVO | S/N: 0025_3869",
  "started_at": "2026-09-13T10:00:00Z",
  "completed_at": "2026-09-13T10:12:33Z",
  "success": true,
  "details": {
    "method": "NIST Clear",
    "passes": 3,
    "bytes_processed": 256060514304,
    "duration_seconds": 753.2,
    "device_serial": "0025_3869",
    "device_model": "Samsung 870 EVO",
    "device_type": "SSD",
    "connection_type": "SATA",
    "capacity_bytes": 256060514304,
    "firmware": "SVT01B6Q",
    "verification_passed": true,
    "samples_checked": 10,
    "samples_changed": 10
  }
}
```

---

## 11. How It Connects to the Backend

### Option A — Dashboard Job (no CLI required)

```
Browser submits job via dashboard
    └── POST /api/v1/jobs {
          operation_type: "DRIVE_ERASE",
          payload: {
            target: "test_volume.img",
            real_device: false
          }
        }
    └── Backend: asyncio.create_task(execute_drive_erase_job(job_id, operator_email))
    └── job_execution_service.py:
            sys.path.insert(0, drive_eraser_root)
            modules = importlib.import_module("src.main"), "src.method_selector", ...
            report = await asyncio.to_thread(_run_drive_erase, payload)
    └── Backend signs report → appends to ledger → issues certificate
    └── WebSocket push → browser updates in real time
```

### Option B — CLI Agent

```
python -m drive-eraser-agent.src.main --target test_volume.img ...
    └── api_client.py: POST /api/v1/auth/login   → JWT
    └── [wipe runs locally]
    └── api_client.py: POST /api/v1/operations   → backend signs + ledger
    └── Certificate ID printed to terminal
```

In both modes, the signing private key never leaves the backend server.

---

## 12. Running Tests

```bash
cd drive-eraser-agent

# All tests
pytest tests/ -v

# Individual modules
pytest tests/test_detectors.py -v
pytest tests/test_wipers.py -v
pytest tests/test_verifier.py -v
pytest tests/test_report_builder.py -v

# Quiet
pytest --tb=short -q
```

All tests use **file-based targets only** — no real hardware required. Temporary files are created and cleaned up by each test. Cross-platform (Windows, Linux, macOS).

---

## 13. Safety & Security Notes

```
⚠️  ALWAYS use --dry-run first on any real device.
⚠️  Never target your OS boot disk.
⚠️  Wiping is IRREVERSIBLE — there is no undo.
⚠️  On Windows, --target is the DeviceId NUMBER (e.g. 1), NOT a drive letter.
⚠️  Linux Purge mode requires root/sudo and hdparm.
```

- **`operator` field** — always set to the authenticated JWT email by the backend. The agent cannot impersonate another operator.
- **Private key** — the signing keypair is never transmitted to or stored by the agent. All signing happens server-side.
- **File target safety** — `FileTargetDetector` will never try to open a block device path when `--real-device` is not set.
- **Windows DeviceId validation** — the backend rejects `--real-device` jobs on Windows where `--target` is not a numeric string, preventing accidental filename-based wipes.

---

## 14. Demo Screenshots

### Drive Erase Job — Dashboard
```
[ Screenshot — Job detail showing WIPING stage for DRIVE_ERASE
  with progress bar and "NIST Clear Pass 2/3" message ]
  Path: ../docs/screenshots/drive-erase-job.png
```

### Drive Erase PDF Certificate
```
[ Screenshot — Certificate of Secure Drive Erasure PDF with
  NTRO header, device serial, NIST method, verification result,
  ECDSA signature, ledger sequence number, QR code,
  formal attestation and signature box ]
  Path: ../docs/screenshots/drive-erase-certificate.png
```

### Dry Run Output (Terminal)
```
[ Screenshot — terminal showing --dry-run output with
  device metadata: type=SSD, serial, model, size, method selected ]
  Path: ../docs/screenshots/drive-erase-dryrun.png
```

---

## 15. Roadmap

- [ ] `--method` flag — override auto-selected wipe method (Clear / Purge / Crypto Erase)
- [ ] `--job-id` flag — claim and complete a dashboard job autonomously
- [ ] DoD 5220.22-M (7-pass) as an additional wipe option
- [ ] HPA (Host Protected Area) detection + erasure on Linux via hdparm
- [ ] DCO (Device Configuration Overlay) removal on supported drives
- [ ] Offline PDF certificate generation when backend is unreachable
- [ ] Progress reporting via callback (per-pass % complete) for WebSocket updates
- [ ] NVMe-specific sanitise command (`nvme sanitize`) via `nvme-cli`
- [ ] macOS support via `diskutil secureErase`

---

*Part of the PRAMAAN platform — see [root README](../README.md) for full system documentation.*
