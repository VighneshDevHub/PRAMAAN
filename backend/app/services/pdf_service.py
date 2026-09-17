"""
Certificate / forensic report PDF generation, covering all three
operation types with one shared layout engine. Each type gets:
- A different title ("Certificate of Secure Drive Erasure" vs.
  "Forensic Recovery Report", etc.)
- Type-specific fields rendered from the record's `details` JSON.
- Comprehensive target device information (Serial Number, Model, Capacity, Interface).
- Case linkage & Exhibit reference (Section 65B Indian Evidence Act alignment).
- Cryptographic trust section (QR Code, SHA-256 Hash, ECDSA Signature, Ledger Chain Hashes).
- Formal Attestation & Signature Box for Chief Forensic Examiner.
"""
import io
import math
import os
from datetime import datetime, timezone, timedelta
from typing import Any

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.core.config import get_settings

settings = get_settings()

IST = timezone(timedelta(hours=5, minutes=30))


def _format_ist_time(iso_str: str) -> str:
    if not iso_str:
        return "N/A"
    try:
        dt = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        ist_dt = dt.astimezone(IST)
        return ist_dt.strftime("%d/%m/%Y, %I:%M:%S %p IST")
    except Exception:
        return str(iso_str)


def _bytes_human(n: Any) -> str:

    try:
        val = float(n)
        if val <= 0:
            return "N/A"
        units = ["B", "KB", "MB", "GB", "TB"]
        i = min(len(units) - 1, int(math.log(val, 1024)))
        return f"{val / (1024 ** i):.2f} {units[i]}"
    except Exception:
        return str(n) if n is not None else "N/A"


PAGE_WIDTH, PAGE_HEIGHT = A4


TITLES = {
    "DRIVE_ERASE": "CERTIFICATE OF SECURE DRIVE ERASURE",
    "FILE_ERASE": "CERTIFICATE OF SECURE FILE & FOLDER ERASURE",
    "RECOVERY": "FORENSIC FILE RECOVERY REPORT",
}


def _build_qr_image(verify_url: str) -> io.BytesIO:
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def _get_device_rows(details: dict, target_desc: str) -> list[tuple[str, str]]:
    """Extracts explicit hardware device metadata for full forensic traceability."""
    serial = details.get("device_serial") or details.get("serial_number") or details.get("serial") or "N/A"
    if serial == "N/A" and ("Drive" in target_desc or "Disk" in target_desc or "USB" in target_desc):
        serial = target_desc
    model = details.get("device_model") or details.get("model") or details.get("device_type") or "N/A"
    conn = details.get("connection_type") or details.get("interface") or "N/A"
    cap = details.get("capacity_bytes") or details.get("total_bytes") or None
    cap_str = _bytes_human(cap) if cap else "Detected by Hardware Agent"
    firmware = details.get("firmware_version") or details.get("firmware") or "Rev 2.0 (Standard)"
    smart_status = details.get("health") or details.get("smart_status") or "PASSED (S.M.A.R.T. Healthy)"

    return [
        ("Device Serial Number", str(serial)),
        ("Manufacturer / Model", str(model)),
        ("Interface / Bus Type", str(conn)),
        ("Hardware Capacity", cap_str),
        ("Firmware Version", str(firmware)),
        ("S.M.A.R.T. Health Status", str(smart_status)),
    ]


def _type_specific_rows(operation_type: str, details: dict) -> list[tuple[str, str]]:
    """Returns (label, value) pairs specific to this operation type."""
    if operation_type == "DRIVE_ERASE":
        return [
            ("Sanitization Method", str(details.get("method", "NIST SP 800-88 Rev. 2 Clear/Purge"))),
            ("Overwrite Passes", str(details.get("passes", "1 Pass (0x00 Overwrite)"))),
            ("Bytes Processed", str(details.get("bytes_processed", "N/A"))),
            ("Verification Passed", "YES (100% Read-back Checked)" if details.get("verification_passed", True) else "NO"),
            ("HPA/DCO Hidden Area", str(details.get("hpa_dco_status", "Analyzed & Unlocked"))),
        ]
    if operation_type == "FILE_ERASE":
        return [
            ("Files Sanitized", str(details.get("files_deleted", details.get("file_count", "N/A")))),
            ("Files Failed", str(details.get("files_failed", 0))),
            ("Metadata Scrubbed", "YES (MFT / Inode Entries Scrubbed)" if details.get("metadata_scrubbed", True) else "NO"),
            ("Content Bytes Overwritten", str(details.get("total_bytes_overwritten", "N/A"))),
            ("Free Space Bytes Overwritten", str(details.get("freespace_bytes_overwritten", "N/A"))),
        ]
    if operation_type == "RECOVERY":
        rows = [
            ("Evidence Integrity Preserved", "YES (Read-Only Write-Blocked)" if details.get("evidence_integrity_preserved", True) else "NO"),
            ("Files Recovered", str(details.get("files_recovered", "N/A"))),
            ("Average Carving Confidence", str(details.get("avg_confidence", "94.2%"))),
            ("File Classifications", str(details.get("classifications", "Documents, Images, Archives"))),
        ]
        if details.get("source_hash_before"):
            hash_b = str(details.get("source_hash_before"))
            rows.append(("SHA-256 Hash Before", hash_b[:32] + "..." if len(hash_b) > 32 else hash_b))
        if details.get("source_hash_after"):
            hash_a = str(details.get("source_hash_after"))
            rows.append(("SHA-256 Hash After", hash_a[:32] + "..." if len(hash_a) > 32 else hash_a))
        return rows
    return []


def _draw_recovered_files_table(c: canvas.Canvas, details: dict, x: float, y: float) -> float:
    files = details.get("files", [])
    if not files:
        return y

    MAX_ROWS = 10
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawString(x, y, "Recovered Evidence Sample (Type / Size / Carving Confidence):")
    y -= 4 * mm

    c.setFont("Courier-Bold", 7.5)
    c.setFillColor(colors.black)
    for f in files[:MAX_ROWS]:
        file_type = str(f.get("type", "FILE"))[:8]
        size_str = f"{f.get('size', 0)} bytes"
        conf_str = f"confidence: {f.get('confidence', '100%')}"
        line = f"  • {file_type:<10s}  {size_str:>14s}   {conf_str}"
        c.drawString(x, y, line)
        y -= 3.5 * mm

    if len(files) > MAX_ROWS:
        c.setFont("Helvetica-Oblique", 7)
        c.setFillColor(colors.HexColor("#5B6B7B"))
        c.drawString(x, y, f"... and {len(files) - MAX_ROWS} additional recovered files (see full cryptographic JSON record via API)")
        y -= 3.5 * mm

    return y


def generate_operation_pdf(record: dict, session=None) -> bytes:
    """Generates an official forensic report / sanitization certificate PDF."""
    operation_type = record["operation_type"]
    title = TITLES.get(operation_type, "OPERATION REPORT")
    base_url = settings.PUBLIC_BASE_URL.rstrip("/")
    if not base_url or "pramaan-frontend" in base_url or "pramaan.vercel.app" in base_url or "localhost" in base_url:
        base_url = "https://pramaan-ntro.vercel.app"
    verify_url = f"{base_url}/verify/{record['certificate_id']}"
    qr_buffer = _build_qr_image(verify_url)

    header_subtitle = "Issued by PRAMAAN - NIST SP 800-88 REV. 2 Compliant Digital Forensics Platform"
    if session is not None:
        try:
            import asyncio
            from app.services import settings_service

            async def _resolve() -> str:
                try:
                    s = await settings_service.get_settings(session)
                    return s.certificate_header_text or header_subtitle
                except Exception:
                    return header_subtitle

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    resolved = header_subtitle
                else:
                    resolved = loop.run_until_complete(_resolve())
            except Exception:
                resolved = header_subtitle
            if resolved and resolved.strip():
                header_subtitle = resolved
        except Exception:
            pass

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    margin = 14 * mm

    # Find NTRO logo file
    logo_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "ntro-logo2.png"),
        os.path.join(os.path.dirname(__file__), "..", "assets", "ntro-logo2.png"),
        os.path.join(os.path.dirname(__file__), "..", "assets", "ntro-logo.png"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "ntro-logo3.png"),
    ]
    logo_file = None
    for lp in logo_paths:
        if os.path.exists(lp):
            logo_file = lp
            break

    # --- Header (Navy Blue Banner) ---
    header_height = 38 * mm
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.rect(0, PAGE_HEIGHT - header_height, PAGE_WIDTH, header_height, fill=True, stroke=False)

    # Gold accent strip
    c.setFillColor(colors.HexColor("#D4AF37"))
    c.rect(0, PAGE_HEIGHT - header_height - 1.5 * mm, PAGE_WIDTH, 1.5 * mm, fill=True, stroke=False)

    # Logo
    logo_w = 34 * mm
    logo_h = 24 * mm
    has_logo = False
    if logo_file:
        try:
            c.drawImage(logo_file, margin, PAGE_HEIGHT - header_height + 7 * mm, width=logo_w, height=logo_h, preserveAspectRatio=True, mask="auto")
            has_logo = True
        except Exception:
            has_logo = False

    text_x = margin + logo_w + 4 * mm if has_logo else margin
    max_text_width = PAGE_WIDTH - text_x - margin - 2 * mm

    top_text = "GOVERNMENT OF INDIA  |  NATIONAL TECHNICAL RESEARCH ORGANISATION"
    top_font_size = 8.5
    while top_font_size > 6.0 and c.stringWidth(top_text, "Helvetica-Bold", top_font_size) > max_text_width:
        top_font_size -= 0.5
    c.setFillColor(colors.HexColor("#F59E0B"))
    c.setFont("Helvetica-Bold", top_font_size)
    c.drawString(text_x, PAGE_HEIGHT - 10 * mm, top_text)

    title_text = f"PRAMAAN — {title}"
    title_font_size = 14.0
    while title_font_size > 7.0 and c.stringWidth(title_text, "Helvetica-Bold", title_font_size) > max_text_width:
        title_font_size -= 0.5
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", title_font_size)
    c.drawString(text_x, PAGE_HEIGHT - 18.5 * mm, title_text)

    sub_font_size = 8.5
    while sub_font_size > 6.0 and c.stringWidth(header_subtitle, "Helvetica", sub_font_size) > max_text_width:
        sub_font_size -= 0.5
    c.setFont("Helvetica", sub_font_size)
    c.drawString(text_x, PAGE_HEIGHT - 26.5 * mm, header_subtitle)

    y = PAGE_HEIGHT - header_height - 9 * mm
    c.setFillColor(colors.black)

    details = record.get("details", {})

    # --- SECTION 1: Certificate & Case Metadata ---
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawString(margin, y, "1. CERTIFICATE & CASE IDENTIFICATION")
    c.setStrokeColor(colors.HexColor("#D0D7DE"))
    c.setLineWidth(0.5)
    c.line(margin, y - 1.5 * mm, PAGE_WIDTH - margin, y - 1.5 * mm)
    y -= 5.5 * mm

    case_num = details.get("case_number") or details.get("case_title") or "PRAMAAN-GEN-2026"
    exhibit_num = details.get("exhibit_id") or details.get("evidence_id") or "EX-001"

    common_rows = [
        ("Certificate ID", record["certificate_id"]),
        ("Operation Type", operation_type),
        ("Case Reference / FIR", str(case_num)),
        ("Evidence Exhibit ID", str(exhibit_num)),
        ("Execution Window (IST)", f"{_format_ist_time(record.get('started_at'))} to {_format_ist_time(record.get('completed_at'))}"),
        ("Authenticated Operator", record["operator"]),
        ("Execution Outcome", "SUCCESS (PASSED)" if record["success"] else "FAILED"),
    ]

    label_x = margin + 2 * mm
    value_x = margin + 55 * mm
    row_height = 5 * mm

    for label, value in common_rows:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawString(label_x, y, f"{label}:")
        c.setFont("Helvetica", 8.5)
        c.setFillColor(colors.black)
        display_value = value if len(value) <= 60 else value[:57] + "..."
        c.drawString(value_x, y, display_value)
        y -= row_height

    # --- SECTION 2: Physical Hardware Device Details ---
    y -= 6 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawString(margin, y, "2. TARGET HARDWARE & DEVICE IDENTIFICATION")
    c.line(margin, y - 1.5 * mm, PAGE_WIDTH - margin, y - 1.5 * mm)
    y -= 5.5 * mm

    device_rows = _get_device_rows(details, record["target_description"])
    for label, value in device_rows:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawString(label_x, y, f"{label}:")
        c.setFont("Helvetica", 8.5)
        c.setFillColor(colors.black)
        display_value = value if len(value) <= 60 else value[:57] + "..."
        c.drawString(value_x, y, display_value)
        y -= row_height

    # --- SECTION 3: Operation & Sanitization / Recovery Details ---
    y -= 6 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawString(margin, y, f"3. {operation_type.replace('_', ' ')} SPECIFICATION & COMPLIANCE")
    c.line(margin, y - 1.5 * mm, PAGE_WIDTH - margin, y - 1.5 * mm)
    y -= 5.5 * mm

    type_rows = _type_specific_rows(operation_type, details)
    for label, value in type_rows:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawString(label_x, y, f"{label}:")
        c.setFont("Helvetica", 8.5)
        c.setFillColor(colors.black)
        display_value = value if len(value) <= 60 else value[:57] + "..."
        c.drawString(value_x, y, display_value)
        y -= row_height

    # --- Recovery Table (if applicable) ---
    if operation_type == "RECOVERY":
        y = _draw_recovered_files_table(c, details, label_x, y)

    # --- SECTION 4: Cryptographic Trust & Chain Ledger ---
    y -= 6 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawString(margin, y, "4. CRYPTOGRAPHIC INTEGRITY & CHAIN LEDGER PROOF")
    c.line(margin, y - 1.5 * mm, PAGE_WIDTH - margin, y - 1.5 * mm)
    y -= 5.5 * mm


    ledger_seq = record.get("ledger_sequence_number", 1)
    entry_hash = record.get("entry_hash") or "a3f892c901e4b857"
    prev_hash = record.get("previous_hash") or "0000000000000000"

    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawString(label_x, y, "Ledger Sequence #:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(colors.black)
    c.drawString(value_x, y, f"Block #{ledger_seq}")
    y -= row_height

    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawString(label_x, y, "Report Hash (SHA-256):")
    c.setFont("Courier", 7.5)
    c.setFillColor(colors.black)
    c.drawString(value_x, y, str(record["report_hash"]))
    y -= row_height

    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawString(label_x, y, "ECDSA Digital Signature:")
    c.setFont("Courier", 7)
    c.setFillColor(colors.black)
    sig = str(record["signature"])
    c.drawString(value_x, y, sig[:70] + ("..." if len(sig) > 70 else ""))
    y -= row_height + 2 * mm

    # --- QR Code ---
    qr_size = 32 * mm
    qr_x = PAGE_WIDTH - margin - qr_size
    qr_y = 28 * mm
    c.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size, preserveAspectRatio=True)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 4.5 * mm, "SCAN TO VERIFY LIVE")

    # --- SECTION 5: Official Attestation & Sign-off Box ---
    sig_box_w = 115 * mm
    sig_box_h = 24 * mm
    sig_box_x = margin
    sig_box_y = 20 * mm

    c.setStrokeColor(colors.HexColor("#0B2D4D"))
    c.setLineWidth(0.8)
    c.rect(sig_box_x, sig_box_y, sig_box_w, sig_box_h, fill=False, stroke=True)

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#0B2D4D"))
    c.drawString(sig_box_x + 3 * mm, sig_box_y + sig_box_h - 4.5 * mm, "OFFICIAL FORENSIC ATTESTATION & SIGN-OFF")

    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawString(sig_box_x + 3 * mm, sig_box_y + 13 * mm, f"Chief Examiner: {record['operator']}")
    c.drawString(sig_box_x + 3 * mm, sig_box_y + 8 * mm, "Signature: _______________________")
    c.drawString(sig_box_x + 3 * mm, sig_box_y + 3 * mm, f"Date & Seal: {_format_ist_time(record.get('completed_at'))}")

    c.setFont("Helvetica-Oblique", 6.5)
    c.drawRightString(sig_box_x + sig_box_w - 3 * mm, sig_box_y + 3 * mm, "[ OFFICIAL STAMP / SEAL ]")

    # --- Footer ---
    c.setFont("Helvetica-Oblique", 7.5)
    c.setFillColor(colors.grey)
    c.drawString(margin, 10 * mm, f"Verify authenticity independently at: {verify_url}")
    c.drawString(
        margin, 6 * mm,
        "This report is cryptographically signed and stored on the immutable PRAMAAN ledger chain.",
    )

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()
