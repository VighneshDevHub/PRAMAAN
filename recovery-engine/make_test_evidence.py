# import os, io, zipfile
# from PIL import Image

# img = Image.new('RGB', (64, 64), color=(200, 30, 30))
# jpeg_buf = io.BytesIO()
# img.save(jpeg_buf, format='JPEG')

# zip_buf = io.BytesIO()
# with zipfile.ZipFile(zip_buf, 'w') as zf:
#     zf.writestr('case_notes.txt', 'Suspect confessed at 10:32 PM near warehouse district.')

# pdf_bytes = b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'

# blob = os.urandom(500000) + jpeg_buf.getvalue() + os.urandom(8000000) + zip_buf.getvalue() + os.urandom(3000000) + pdf_bytes + os.urandom(200000)

# with open('seized_drive.dd', 'wb') as f:
#     f.write(blob)

# print(f'Created seized_drive.dd ({len(blob)} bytes) with 1 JPEG, 1 ZIP, 1 PDF embedded')


import os
import io
import zipfile
from PIL import Image, ImageDraw

OUTPUT_FILE = "evidence.dd"

# ==========================================
# CONFIGURATION
# ==========================================

RANDOM_BEFORE = 5 * 1024 * 1024       # 5 MB
RANDOM_BETWEEN = 5 * 1024 * 1024      # 5 MB
RANDOM_AFTER = 5 * 1024 * 1024        # 5 MB


# ==========================================
# TEXT FILE CONTENT
# ==========================================

TEXT_FILES = {
    "case_notes.txt": """
PRAMAAN FORENSIC CASE NOTES
============================

Case ID: PRM-2026-0916-001
Evidence ID: EV-001
Classification: CONFIDENTIAL

Date: 16 September 2026
Time: 22:32
Location: Warehouse District

Investigators documented suspicious activity near the
warehouse entrance.

A CCTV camera was identified approximately 30 metres
from the main entrance.

Several digital artifacts were recovered from the
storage media for forensic examination.

This document is synthetic test evidence created
for validating the PRAMAAN file recovery system.
""",

    "incident_report.txt": """
DIGITAL FORENSIC INCIDENT REPORT
=================================

Incident ID: INC-2026-0916

Date: 16 September 2026
Time: 22:41

Summary:
An electronic storage device was seized during a
simulated forensic investigation.

The device was processed using a forensic recovery
workflow.

Initial filesystem metadata was assumed to be
unavailable.

Recovery Method:
Signature-based file carving

Observed file signatures:
- JPEG
- ZIP
- PDF
- TXT

No original source files were modified during
the recovery operation.
""",

    "witness_statement.txt": """
WITNESS STATEMENT
=================

Statement ID: WS-004

Date: 16 September 2026
Time: 23:05

The witness reported observing a vehicle near the
warehouse entrance shortly before 10:30 PM.

The vehicle remained in the area for several minutes
before leaving the location.

This statement is synthetic evidence generated for
PRAMAAN prototype testing.
""",

    "evidence_log.txt": """
EVIDENCE COLLECTION LOG
=======================

Case ID: PRM-2026-0916-001

Evidence Item: EV-004
Type: Digital Storage Media

Collection Time: 23:18
Collection Location: Secure Evidence Room

Condition:
Device received for forensic examination.

Processing:
1. Evidence image created.
2. Source hash calculated.
3. File carving initiated.
4. Recovered artifacts validated.
5. SHA-256 hashes generated.

Integrity status: VERIFIED
"""
}


# ==========================================
# CREATE JPEG WITH CONTENT
# ==========================================

def create_image(index, title):
    img = Image.new(
        "RGB",
        (1280, 720),
        color=(225, 225, 225)
    )

    draw = ImageDraw.Draw(img)

    draw.rectangle(
        (40, 40, 1240, 680),
        outline=(40, 40, 40),
        width=4
    )

    draw.text(
        (80, 80),
        "PRAMAAN DIGITAL EVIDENCE",
        fill=(20, 20, 20)
    )

    draw.text(
        (80, 140),
        f"Evidence Image {index:02d}",
        fill=(20, 20, 20)
    )

    draw.text(
        (80, 190),
        f"Location: Warehouse District",
        fill=(20, 20, 20)
    )

    draw.text(
        (80, 240),
        f"Case: PRM-2026-0916-001",
        fill=(20, 20, 20)
    )

    draw.text(
        (80, 290),
        f"Timestamp: 22:{30 + index:02d}",
        fill=(20, 20, 20)
    )

    draw.text(
        (80, 350),
        title,
        fill=(20, 20, 20)
    )

    draw.text(
        (80, 420),
        "Synthetic forensic evidence",
        fill=(20, 20, 20)
    )

    buffer = io.BytesIO()

    img.save(
        buffer,
        format="JPEG",
        quality=90
    )

    return buffer.getvalue()


# ==========================================
# CREATE ZIP WITH REAL CONTENT
# ==========================================

def create_zip(index):

    buffer = io.BytesIO()

    with zipfile.ZipFile(
        buffer,
        "w",
        zipfile.ZIP_DEFLATED
    ) as zf:

        zf.writestr(
            f"investigation_notes_{index}.txt",
            f"""
PRAMAAN RECOVERED ARCHIVE

Archive ID: ARC-{index:03d}

This archive contains synthetic forensic
investigation material.

Case:
PRM-2026-0916-001

Recovery status:
Successfully carved from disk image.

Archive item:
investigation_notes_{index}.txt

Integrity:
SHA-256 verification pending.
"""
        )

        zf.writestr(
            f"evidence_summary_{index}.txt",
            f"""
Evidence Summary {index}

Recovered artifact generated for testing
the PRAMAAN recovery engine.

Artifact type: ZIP
Validation: Structural validation
Case: PRM-2026-0916-001
"""
        )

    return buffer.getvalue()


# ==========================================
# CREATE PDF CONTENT
# ==========================================

def create_pdf(index):

    text = f"""
PRAMAAN FORENSIC RECOVERY REPORT

Case ID: PRM-2026-0916-001
Evidence ID: PDF-{index:03d}

Recovered Artifact

This is synthetic forensic evidence created
for demonstration of the PRAMAAN advanced
file carving engine.

Recovery Method:
Signature-based carving

Artifact:
document_{index:02d}.pdf

Validation:
Structural validation completed.

Integrity:
SHA-256 verification completed.

Status:
RECOVERED
"""

    # Minimal valid PDF structure
    content = text.replace("\n", "\\n")

    pdf = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] >>
endobj

4 0 obj
<< /Length {len(content)} >>
stream
BT
/F1 10 Tf
50 750 Td
({content}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
trailer
<< /Root 1 0 R /Size 5 >>
startxref
0
%%EOF
"""

    return pdf.encode()


# ==========================================
# BUILD FILE LIST
# ==========================================

embedded_files = []


# 4 text files
for filename, content in TEXT_FILES.items():
    embedded_files.append(
        (filename, content.strip().encode())
    )


# 5 images
image_titles = [
    "Warehouse Entrance",
    "Storage Area",
    "Vehicle Parking Area",
    "Evidence Room",
    "North Side Entrance"
]

for i, title in enumerate(image_titles, start=1):

    embedded_files.append(
        (
            f"evidence_image_{i:02d}.jpg",
            create_image(i, title)
        )
    )


# 3 ZIP archives
for i in range(1, 4):

    embedded_files.append(
        (
            f"case_archive_{i:02d}.zip",
            create_zip(i)
        )
    )


# 3 PDFs
for i in range(1, 4):

    embedded_files.append(
        (
            f"forensic_report_{i:02d}.pdf",
            create_pdf(i)
        )
    )


# ==========================================
# CREATE DISK IMAGE
# ==========================================

total_size = 0

with open(OUTPUT_FILE, "wb") as f:

    # Random data before first artifact
    data = os.urandom(RANDOM_BEFORE)

    f.write(data)
    total_size += len(data)

    # Embed files
    for index, (filename, file_data) in enumerate(
        embedded_files
    ):

        print(
            f"[{index + 1:02d}/{len(embedded_files)}] "
            f"Embedding {filename} "
            f"({len(file_data):,} bytes)"
        )

        # Random space between artifacts
        if index > 0:

            padding = os.urandom(
                RANDOM_BETWEEN
            )

            f.write(padding)
            total_size += len(padding)

        # Write actual file
        f.write(file_data)

        total_size += len(file_data)

    # Random data after last artifact
    data = os.urandom(RANDOM_AFTER)

    f.write(data)
    total_size += len(data)


# ==========================================
# SUMMARY
# ==========================================

print("\n======================================")
print("PRAMAAN TEST EVIDENCE CREATED")
print("======================================")

print(f"Disk image : {OUTPUT_FILE}")
print(f"Files      : {len(embedded_files)}")
print(
    f"Size       : "
    f"{total_size / (1024 * 1024):.2f} MB"
)

print("\nEmbedded files:")

for filename, data in embedded_files:
    print(
        f"  {filename:<30} "
        f"{len(data):>10,} bytes"
    )

print("======================================")