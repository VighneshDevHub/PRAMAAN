"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

interface StepGuide {
  step: string;
  title: string;
  badge: string;
  summary: string;
  standards: string[];
  prerequisites: string[];
  detailedInstructions: string[];
  expectedOutputs: string[];
  proTips: string[];
  warning?: string;
}

const STEP_GUIDES: StepGuide[] = [
  {
    step: "01",
    title: "System Onboarding & Role-Based Access Control (RBAC)",
    badge: "Identity & Governance",
    summary: "Establish operator credentials, authenticate via JWT token, and verify assigned operational permissions.",
    standards: ["ISO/IEC 27001", "NIST SP 800-171", "RBAC 4-Tier Model"],
    prerequisites: [
      "Authorized Government email account registered by an Administrator.",
      "Access to PRAMAAN Web Console or internal agency network.",
    ],
    detailedInstructions: [
      "Navigate to the Login Portal at /login and enter your official government credentials.",
      "Upon successful authentication, a cryptographically signed JWT access token is stored in your secure session.",
      "Review your assigned designation in the top right user pill: Administrator (Red), Supervisor (Gold), Investigator (Navy), or Auditor (Green).",
      "Administrators can navigate to Operator Management (/dashboard/users) to grant, modify, or revoke user roles.",
    ],
    expectedOutputs: [
      "Active operator session token valid for agency policy duration.",
      "Role-tailored navigation menu displaying permitted operational modules.",
    ],
    proTips: [
      "Auditor accounts have read-only access to inspect case files, hash chains, and reports without risk of mutating data.",
    ],
  },
  {
    step: "02",
    title: "Case Management & Forensic Chain of Custody",
    badge: "Evidence Preservation",
    summary: "Register formal investigation cases, assign lead investigators, and maintain an immutable timeline of custody hand-offs.",
    standards: ["ISO 27037 (Digital Evidence)", "MeitY GSR 2025"],
    prerequisites: [
      "Investigator, Supervisor, or Administrator role.",
      "Official case reference number or agency mandate.",
    ],
    detailedInstructions: [
      "Open Case Management (/dashboard/cases) and click '+ Open New Case'.",
      "Enter the Case Title, official Case Number (e.g. CASE-2026-0819), Lead Investigator, and scope description.",
      "Inside the Case Workspace, click 'Attach Evidence' to link seized storage media, physical devices, or forensic images.",
      "Use the Investigation Timeline rail to append official custody notes. Every note records the actor's email, timestamp, and metadata.",
    ],
    expectedOutputs: [
      "Registered Case File with unique UUID and tracking case number.",
      "Linked evidence registry with SHA-256 digests and audit log entries.",
    ],
    warning: "Once an operation certificate is linked to a case, the connection is cryptographically sealed in the hash chain and cannot be unlinked.",
    proTips: [
      "Export the case summary PDF for court presentation or inter-agency transfer.",
    ],
  },
  {
    step: "03",
    title: "Host Storage Device Enumeration & Inventory",
    badge: "Asset Management",
    summary: "Monitor connected physical storage media (USB, SATA, NVMe, SD) in real time and prepare devices for sanitisation or carving.",
    standards: ["ATA/ATAPI-8", "NVMe Command Set 1.4", "USB Mass Storage Spec"],
    prerequisites: [
      "Storage media physically connected to the host server/workstation.",
      "Device detection background service running.",
    ],
    detailedInstructions: [
      "Navigate to Device Inventory (/dashboard/devices).",
      "The automatic host monitor polls connected hardware every 5 seconds and updates serial numbers, media type, and connection interface.",
      "To manually sync new devices, click 'Detect Host Devices'.",
      "Inspect the device health status: Excellent, Good, Fair, Poor, or Critical.",
      "Click on any registered device card to quickly launch a Recovery, File Erase, or Drive Wipe operation.",
    ],
    expectedOutputs: [
      "Real-time inventory listing device serial number, capacity in GB/TB, media type (SSD/HDD/NVMe), and current state.",
    ],
    proTips: [
      "Quarantined devices with bad sectors should be processed via low-level sector carving rather than full-media wipe.",
    ],
  },
  {
    step: "04",
    title: "Module 01: Forensic Evidence Recovery Engine",
    badge: "Deep File Carving",
    summary: "Scan target media, carve fragmented deleted files by header/footer signatures, validate file structures, and seal evidence.",
    standards: ["ISO 27037", "NIST SP 800-101 (Mobile & Disk Forensics)"],
    prerequisites: [
      "Seized storage device connected or forensic disk image (.img/.raw/.dd).",
      "Open case file for linking evidence.",
    ],
    detailedInstructions: [
      "Navigate to Recovery Engine (/dashboard/recovery).",
      "Select the target storage device or specify an image file path.",
      "Choose scan depth: 'Quick Scan' (MFT/FAT/Inode directory parsing) or 'Deep Sector Carve' (raw byte header/footer signature matching).",
      "Configure target file signatures: Images (JPEG/PNG), Documents (PDF/DOCX), Archives (ZIP/RAR), Databases (SQLite), Video (MP4).",
      "Initiate the recovery job. Monitor real-time progress, carved file count, and byte processing rate via WebSocket telemetry.",
      "Browse recovered files in the Evidence Explorer (/dashboard/cases). Filter by confidence score, file type, or hash value.",
    ],
    expectedOutputs: [
      "Carved and structurally validated files saved to evidence directory.",
      "Cryptographic Recovery Report with individual file SHA-256 digests and average confidence score.",
    ],
    proTips: [
      "Each recovered file is assigned a confidence score (0.0 to 1.0) based on header/footer integrity and interior entropy.",
    ],
  },
  {
    step: "05",
    title: "Module 02: Selective File & Folder Sanitisation",
    badge: "Targeted Erasure",
    summary: "Perform permanent overwrite of specific sensitive files, scrub filesystem metadata, and sanitize residual free space.",
    standards: ["NIST SP 800-88 Rev. 1 (Clear)", "DoD 5220.22-M (3-Pass / 7-Pass)"],
    prerequisites: [
      "Path to target files or directories.",
      "Operator authority to erase selected files.",
    ],
    detailedInstructions: [
      "Navigate to File / Folder Eraser (/dashboard/file-eraser).",
      "Select target files or directories using the browser selector or manual path input.",
      "Select sanitisation method: 'Single-Pass Zero Fill', 'DoD 5220.22-M 3-Pass Overwrite', or 'Custom N-Pass Random Pattern'.",
      "Enable 'Metadata Scrubbing' to wipe NTFS MFT record dates/names or EXT4 inode metadata.",
      "Enable 'Free-Space Cleansing' if residual file fragments exist in unallocated disk clusters.",
      "Execute the erase job and inspect the real-time progress stream.",
    ],
    expectedOutputs: [
      "Content bytes completely overwritten with verified zero/random patterns.",
      "Signed Certificate of Secure File Erasure specifying file count and total bytes sanitized.",
    ],
    warning: "File erasure is irreversible. Ensure you have selected the correct file path before initiating the job.",
    proTips: [
      "Set default overwrite passes in Settings (/dashboard/settings) to standardize agency sanitisation policy.",
    ],
  },
  {
    step: "06",
    title: "Module 03: Full Media & Drive Eraser",
    badge: "Storage Sanitisation",
    summary: "Execute full-disk sanitisation across HDDs, SSDs, and NVMe media with device-aware primitives and read-back verification.",
    standards: ["NIST SP 800-88 Rev. 1 (Clear, Purge, Crypto-Erase)", "IEEE 2883-2022"],
    prerequisites: [
      "Target storage drive connected and unmounted.",
      "Confirm target drive serial number to prevent accidental wipe of OS drives.",
    ],
    detailedInstructions: [
      "Navigate to Drive Eraser (/dashboard/drive-eraser).",
      "Select the target drive serial number from the verified device dropdown.",
      "Select sanitisation primitive: 'Clear' (Logical overwrite across all addressable sectors), 'Purge' (Block erase / ATA Secure Erase / NVMe Format), or 'Crypto-Erase' (Sanitize cryptographic key store).",
      "Set verification policy: '100% Full Sector Sampling' or 'Random 10% Block Verification'.",
      "Click 'Start Drive Wipe' and confirm the dual-factor confirmation prompt.",
      "Track pass execution, elapsed time, estimated completion, and read-back verification status.",
    ],
    expectedOutputs: [
      "Complete media sanitisation with zero recoverable sectors remaining.",
      "Signed Certificate of Secure Drive Erasure with complete drive geometry details.",
    ],
    warning: "Drive erasure overwrites every sector on the device. All existing partitions and data will be destroyed.",
    proTips: [
      "For NVMe SSDs, Crypto-Erase executes in seconds by purging the internal AES encryption keys while maintaining media health.",
    ],
  },
  {
    step: "07",
    title: "Cryptographic Ledger & Public Verification",
    badge: "Trust & Immutability",
    summary: "Inspect append-only SHA-256 hash chains, verify ECDSA P-256 operator signatures, and validate certificates via the public portal.",
    standards: ["FIPS 180-4 (SHA-256)", "FIPS 186-4 (ECDSA P-256)", "RFC 6979"],
    prerequisites: [
      "Certificate ID or QR code from a generated PDF report.",
    ],
    detailedInstructions: [
      "Navigate to Hash Chain Ledger (/dashboard/ledger) to view all chained operation blocks in sequence.",
      "Each ledger block contains: Sequence #, Report Hash, Previous Block Hash, Entry Hash, and Timestamp.",
      "Click 'Verify Chain Integrity' to re-calculate the entire hash chain from Block #1 to the latest tip.",
      "For external stakeholders, open the Public Verification Portal (/verify) — no login required.",
      "Paste any Certificate ID to view the live verification stamp, cryptographic signature status, and download the official PDF.",
    ],
    expectedOutputs: [
      "Zero-tamper verification status confirming unbroken chain integrity.",
      "Public verification seal displaying 'AUTHENTIC & UNTAMPERED CERTIFICATE'.",
    ],
    proTips: [
      "Every generated PDF report contains a QR code that directly links back to the live verification portal for court proof.",
    ],
  },
];

export default function UserManualPage() {
  const [activeStep, setActiveStep] = useState<string>("01");
  const [expandedSection, setExpandedSection] = useState<string | null>("01");

  const currentGuide = STEP_GUIDES.find((g) => g.step === activeStep) ?? STEP_GUIDES[0];

  return (
    <AppShell
      eyebrow="Official Documentation"
      title="PRAMAAN Operational User Manual"
      subtitle="Comprehensive step-by-step procedural guide for digital forensic investigation, data recovery, storage sanitisation, and cryptographic verification."
      actions={
        <Link href="/dashboard" className="fg-btn-primary !py-1.5 !px-3 text-xs">
          Return to Dashboard →
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Banner */}
        <section className="fg-hero-band overflow-hidden rounded-md border border-govt-navy p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-sm border border-govt-gold/70 bg-govt-goldLight px-3 py-1 font-mono text-[10px] uppercase tracking-[0.26em] text-govt-navy mb-2">
                National Technical Research Organisation · Standard Operating Procedures
              </div>
              <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
                Digital Forensics & Sanitisation Manual
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                This manual provides official step-by-step procedures for operating the PRAMAAN platform. Follow these guidelines to maintain legal chain of custody, comply with NIST SP 800-88 & ISO 27037 standards, and ensure cryptographic auditability.
              </p>
            </div>
            <div className="border-l border-white/20 pl-5 text-xs text-white/80 space-y-1 font-mono">
              <div className="font-mono text-[10px] uppercase tracking-wider text-govt-goldLight font-bold">Platform Specs</div>
              <div>• NIST SP 800-88 Rev. 1</div>
              <div>• ISO 27037 Digital Evidence</div>
              <div>• ECDSA P-256 Signatures</div>
              <div>• SHA-256 Hash Chain</div>
            </div>
          </div>
        </section>

        {/* Interactive Step-by-Step Navigation Tabs */}
        <section className="fg-panel p-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {STEP_GUIDES.map((guide) => {
              const active = activeStep === guide.step;
              return (
                <button
                  key={guide.step}
                  type="button"
                  onClick={() => {
                    setActiveStep(guide.step);
                    setExpandedSection(guide.step);
                  }}
                  className={`px-3 py-2 text-xs rounded transition-all flex items-center gap-2 font-mono ${
                    active
                      ? "bg-govt-navy text-white font-semibold shadow-sm"
                      : "bg-field border border-line text-muted hover:text-main"
                  }`}
                >
                  <span className={`h-5 w-5 rounded-xs flex items-center justify-center text-[10px] font-bold ${
                    active ? "bg-govt-gold text-govt-navy" : "bg-govt-blueLight text-govt-navy"
                  }`}>
                    {guide.step}
                  </span>
                  <span>{guide.badge}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Detailed Guide Active View */}
        <section className="fg-panel overflow-hidden">
          <div className="bg-govt-navy text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-govt-gold/30">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded bg-govt-gold text-govt-navy font-mono text-sm font-bold flex items-center justify-center">
                {currentGuide.step}
              </span>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-govt-goldLight block">
                  Step {currentGuide.step} of 07 · {currentGuide.badge}
                </span>
                <h2 className="font-display text-xl font-bold text-white">
                  {currentGuide.title}
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentGuide.standards.map((std) => (
                <span key={std} className="px-2 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[10px]">
                  {std}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Summary */}
            <div className="rounded bg-field border border-line p-4 text-sm leading-relaxed text-main">
              <span className="font-semibold text-govt-navy">Objective: </span>
              {currentGuide.summary}
            </div>

            {/* Warning if any */}
            {currentGuide.warning && (
              <div className="rounded border border-govt-red/40 bg-govt-redLight/40 p-4 text-xs text-govt-red flex items-start gap-3">
                <span className="font-bold text-sm">⚠️ WARNING:</span>
                <div>{currentGuide.warning}</div>
              </div>
            )}

            {/* Prerequisites */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-2 font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-govt-blue" />
                Operational Prerequisites
              </h3>
              <ul className="space-y-1.5 text-xs text-main bg-panel border border-line rounded p-3">
                {currentGuide.prerequisites.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono text-muted">[{i + 1}]</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Instructions */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-3 font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-govt-green" />
                Step-by-Step Procedure
              </h3>
              <div className="space-y-3">
                {currentGuide.detailedInstructions.map((inst, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded border border-line bg-panel hover:bg-field/40 transition-colors">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-govt-navy text-white font-mono text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-main mt-0.5">
                      {inst}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Outputs */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-2 font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-govt-goldDark" />
                Expected Operational Deliverables
              </h3>
              <ul className="space-y-1 text-xs text-main bg-field border border-line rounded p-3">
                {currentGuide.expectedOutputs.map((out, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-govt-green font-bold">✓</span>
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tips */}
            {currentGuide.proTips.length > 0 && (
              <div className="rounded border border-govt-blueRing bg-govt-blueLight/40 p-4 text-xs text-main">
                <div className="font-mono font-bold text-govt-navy mb-1 uppercase tracking-wider text-[10px]">
                  💡 Forensic Operator Tip:
                </div>
                {currentGuide.proTips.map((tip, i) => (
                  <p key={i}>{tip}</p>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Roles Permission Matrix Table */}
        <section className="fg-panel overflow-hidden">
          <div className="fg-panel-header">
            <div>
              <div className="fg-panel-title">Role-Based Access Control (RBAC) Governance Matrix</div>
              <p className="mt-1 text-xs text-muted">Enforced by FastAPI backend policy dependencies across all API routes.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="fg-table min-w-[720px] text-xs">
              <thead>
                <tr>
                  <th>Role Designation</th>
                  <th>Cases & Evidence</th>
                  <th>Task Queue Jobs</th>
                  <th>Forensic Modules</th>
                  <th>Ledger & Reports</th>
                  <th>Operator Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-govt-red">Administrator</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                </tr>
                <tr>
                  <td className="font-bold text-govt-goldDark">Supervisor</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-muted">Read-Only</td>
                </tr>
                <tr>
                  <td className="font-bold text-govt-navy">Investigator</td>
                  <td className="text-govt-green font-semibold">Full Access</td>
                  <td className="text-govt-green font-semibold">Create & Run</td>
                  <td className="text-govt-green font-semibold">Execute Ops</td>
                  <td className="text-govt-green font-semibold">Generate Reports</td>
                  <td className="text-muted">No Access</td>
                </tr>
                <tr>
                  <td className="font-bold text-govt-green">Auditor</td>
                  <td className="text-muted">Read-Only</td>
                  <td className="text-muted">Read-Only</td>
                  <td className="text-muted">Read-Only</td>
                  <td className="text-govt-green font-semibold">Verify Chain</td>
                  <td className="text-muted">No Access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
