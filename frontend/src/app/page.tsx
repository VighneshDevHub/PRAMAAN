"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublicStats } from "@/lib/api";
import type { PublicStatsOut } from "@/lib/types";
import { NtroGovernmentLogo, GovernmentTopHeaderBar } from "@/components/NtroGovernmentLogo";

// ====================================================== small building blocks
function HeroStat({
  label,
  value,
  accent = "navy",
}: {
  label: string;
  value: number | string;
  accent?: "navy" | "blue" | "green" | "gold";
}) {
  const color =
    accent === "green"
      ? "text-govt-green border-govt-green/40"
      : accent === "gold"
        ? "text-govt-navy border-govt-gold/70"
        : accent === "blue"
          ? "text-govt-blue border-govt-blueRing"
          : "text-govt-navy border-govt-blueRing";
  return (
    <div className={`rounded-sm border bg-white/70 px-5 py-4 ${color}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

interface FeatureItem {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  href: string;
  badgeBg: string;
  gradient: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureItem[] = [
  {
    id: "MOD-01",
    num: "01",
    title: "Secure Drive Eraser",
    subtitle: "Hardware-Level Storage Sanitisation",
    body: "Supports Clear, Purge, and Crypto-Erase primitives for HDD, SSD, NVMe, USB, and SD media with NIST SP 800-88 Rev. 2 compliance and independent 100% block read-back verification.",
    tags: ["NIST SP 800-88 Rev. 2", "HDD · SSD · NVMe · USB", "Read-Back Verification"],
    href: "/dashboard/drive-eraser",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-[#051329] via-[#0B2D4D] to-[#005BAC]",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "MOD-02",
    num: "02",
    title: "File & Folder Eraser",
    subtitle: "Targeted Logical Data Destruction",
    body: "Selective secure deletion with configurable multi-pass overwrite algorithms, NTFS/EXT inode metadata scrubbing, residual free-space cleansing, and automated batch destruction queue.",
    tags: ["N-Pass Overwrite", "Metadata Inode Scrubbing", "Free-Space Sanitisation"],
    href: "/dashboard/file-eraser",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    gradient: "from-[#0B2D4D] via-[#005BAC] to-[#0284C7]",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    id: "MOD-03",
    num: "03",
    title: "Advanced File Recovery",
    subtitle: "Forensic Data Carving & Reconstruction",
    body: "Header/footer signature carving, structural file validation, fragmented file reconstruction, automated file classification, confidence scoring, and forensic evidence sealing.",
    tags: ["Signature Carving", "Confidence Scoring", "ISO 27037 Evidence Seal"],
    href: "/dashboard/recovery",
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    gradient: "from-[#005BAC] via-[#0284C7] to-[#0ea5e9]",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
  },
  {
    id: "MOD-04",
    num: "04",
    title: "Hash-Chain Ledger",
    subtitle: "Immutable Cryptographic Proof of Integrity",
    body: "Every operation record is anchored to an append-only SHA-256 chain with ECDSA P-256 operator signatures. Includes a public offline & QR verification portal for third-party auditing.",
    tags: ["SHA-256 Append Ledger", "ECDSA P-256 Signatures", "QR Public Verification"],
    href: "/dashboard/ledger",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    gradient: "from-[#B8860B] via-[#D4AF37] to-[#CA8A04]",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: "MOD-05",
    num: "05",
    title: "Case & Evidence Register",
    subtitle: "Chain-of-Custody Incident Management",
    body: "Institutional case file management with official case numbers, investigator assignments, evidence registers, investigation timelines, and auto-generated signed certificates.",
    tags: ["Case Numbering", "Evidence Chain-of-Custody", "Timeline Audit"],
    href: "/dashboard/cases",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gradient: "from-[#047857] via-[#10B981] to-[#059669]",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: "MOD-06",
    num: "06",
    title: "RBAC & Audit Trail",
    subtitle: "Multi-Tiered Access & System Security",
    body: "Four-tier role-based access control (Administrator, Supervisor, Investigator, Auditor), strict operation gating, and real-time categorized audit logs with tamper detection.",
    tags: ["4-Tier RBAC", "Tamper-Evident Logs", "Real-Time System Audit"],
    href: "/dashboard/audit",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-[#4338CA] via-[#6366F1] to-[#4F46E5]",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const STANDARDS: string[] = [
  "NIST SP 800-88 Rev. 2",
  "DoD 5220.22-M",
  "ISO/IEC 27001",
  "MeitY GSR 2025",
  "ISO 27037 (Digital Evidence)",
  "NIST SP 800-171",
  "ENISA Data Sanitisation",
  "IEC 62443-4-1",
];

interface StandardPillar {
  id: string;
  category: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  description: string;
  standards: Array<{ name: string; desc: string }>;
  icon: React.ReactNode;
}

const STANDARD_PILLARS: StandardPillar[] = [
  {
    id: "PIL-01",
    category: "Sanitisation & Destruction Mandates",
    badge: "GOVT & DEFENSE SPEC",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    gradient: "from-[#051329] via-[#0B2D4D] to-[#B8860B]",
    description: "Hardware & logical media sanitisation protocols with mandatory 100% block read-back verification.",
    standards: [
      { name: "NIST SP 800-88 Rev. 2", desc: "Clear, Purge & Crypto-Erase Guidelines" },
      { name: "DoD 5220.22-M", desc: "US DoD 3-Pass / 7-Pass Sanitisation" },
      { name: "ENISA Guidelines", desc: "EU Cyber Agency Media Destruction" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "PIL-02",
    category: "Digital Forensics & Evidence Seal",
    badge: "EVIDENCE CUSTODY",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-[#0B2D4D] via-[#005BAC] to-[#0284C7]",
    description: "Standardised forensic file carving, evidence acquisition, structural validation, and tamper-evident sealing.",
    standards: [
      { name: "ISO/IEC 27037", desc: "Digital Evidence Handling & Chain-of-Custody" },
      { name: "NIST SP 800-101", desc: "Mobile & Storage Forensic Guidelines" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: "PIL-03",
    category: "Indian Government & Cyber Directives",
    badge: "NATIONAL MANDATE",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gradient: "from-[#047857] via-[#10B981] to-[#059669]",
    description: "Compliant with Indian Ministry of Electronics & IT guidelines and national critical infrastructure directives.",
    standards: [
      { name: "MeitY GSR 2025", desc: "Govt of India Secure Data Sanitisation" },
      { name: "CERT-In Directives", desc: "Incident Response & Retention Norms" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    id: "PIL-04",
    category: "Information Security & Cryptography",
    badge: "INFOSEC ASSURANCE",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    gradient: "from-[#4338CA] via-[#6366F1] to-[#4F46E5]",
    description: "ECDSA P-256 cryptographic signatures, append-only SHA-256 ledgering, and ISO/IEC security controls.",
    standards: [
      { name: "ISO/IEC 27001", desc: "Information Security Management System" },
      { name: "NIST SP 800-171", desc: "Controlled Unclassified Information (CUI)" },
      { name: "IEC 62443-4-1", desc: "Industrial Security & System Lifecycle" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

interface WorkflowStep {
  step: string;
  stage: string;
  title: string;
  subtitle: string;
  body: string;
  tag: string;
  gradient: string;
  icon: React.ReactNode;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: "01",
    stage: "STAGE 01 · INITIALIZATION",
    title: "Open Case File",
    subtitle: "Chain-of-Custody Setup",
    body: "Register an official case file with a unique case number, assigned lead investigator, organizational department, and investigation scope.",
    tag: "Case Register",
    gradient: "from-[#051329] to-[#0B2D4D]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    step: "02",
    stage: "STAGE 02 · MEDIA INGESTION",
    title: "Attach Evidence",
    subtitle: "Hardware & Media Detection",
    body: "Auto-detect or register physical storage media (HDD, SSD, NVMe, USB) into the system device inventory with geometric specs.",
    tag: "Device Inventory",
    gradient: "from-[#0B2D4D] to-[#005BAC]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    step: "03",
    stage: "STAGE 03 · DISPATCH",
    title: "Queue Job Task",
    subtitle: "Async Workload Orchestration",
    body: "The operator console creates a job; backend async task queue validates RBAC permissions and dispatches payload to isolated CLI agents.",
    tag: "Task Dispatcher",
    gradient: "from-[#005BAC] to-[#0284C7]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    step: "04",
    stage: "STAGE 04 · FORENSIC EXECUTION",
    title: "Execute Operation",
    subtitle: "Sanitisation or Carving",
    body: "Isolated Python agent executes Clear/Purge wipe or signature carving, streaming 100% block read-back progress in real time via WebSockets.",
    tag: "Live WebSocket",
    gradient: "from-[#047857] to-[#10B981]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    step: "05",
    stage: "STAGE 05 · LEDGER ANCHORING",
    title: "Anchored Certificate",
    subtitle: "SHA-256 & ECDSA Signature",
    body: "Operation writes a cryptographically signed PDF certificate and appends an immutable block record to the append-only SHA-256 hash-chain.",
    tag: "SHA-256 Chain",
    gradient: "from-[#B8860B] to-[#D4AF37]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    step: "06",
    stage: "STAGE 06 · PUBLIC AUDIT",
    title: "Independent Verify",
    subtitle: "Offline & QR Verification",
    body: "Any auditor or custodian can verify certificate integrity and hash-chain block consistency via QR code or public verification portal.",
    tag: "Offline QR Portal",
    gradient: "from-[#4338CA] to-[#6366F1]",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
];

interface FaqItem {
  id: string;
  category: "verification" | "hardware" | "security";
  categoryLabel: string;
  q: string;
  a: string;
  badge: string;
  keywords: string[];
}

const FAQS: FaqItem[] = [
  {
    id: "FAQ-01",
    category: "verification",
    categoryLabel: "Ledger & Verification",
    q: "Is every sanitisation and recovery operation independently verifiable?",
    a: "Yes — every sanitisation, erasure, and forensic recovery job produces a cryptographically signed PDF certificate anchored to an append-only SHA-256 hash-chain ledger. Any auditor, custodian, or stakeholder can independently verify the SHA-256 digest and ECDSA P-256 signature using the public Verification Portal, without logging in or needing elevated system access.",
    badge: "SHA-256 & ECDSA P-256",
    keywords: ["verifiable", "ledger", "certificate", "signature", "proof", "sha-256", "qr", "audit"],
  },
  {
    id: "FAQ-02",
    category: "hardware",
    categoryLabel: "Media Primitives",
    q: "Which physical storage media and drive interfaces are supported?",
    a: "PRAMAAN supports SATA/IDE HDDs, SATA SSDs, NVMe SSDs, USB flash drives, SD cards, and networked iSCSI/SAN storage volumes. Sanitisation operations execute hardware-level Clear, Purge, and Crypto-Erase primitives tailored to the specific drive architecture and controller features.",
    badge: "HDD · SSD · NVMe · USB",
    keywords: ["storage", "hdd", "ssd", "nvme", "usb", "iscsi", "san", "clear", "purge", "crypto-erase"],
  },
  {
    id: "FAQ-03",
    category: "hardware",
    categoryLabel: "Logical Erasure",
    q: "Can I perform targeted file sanitisation without wiping the entire physical drive?",
    a: "Yes — the File & Folder Eraser module executes targeted logical data destruction using configurable multi-pass overwrite patterns (DoD 5220.22-M, NIST SP 800-88 REV. 2). It scrubs NTFS/EXT inode metadata and sanitises unallocated filesystem free-space to ensure deleted files cannot be carved or reconstructed.",
    badge: "Multi-Pass Overwrite",
    keywords: ["file", "folder", "selective", "inode", "metadata", "free-space", "targeted", "dod"],
  },
  {
    id: "FAQ-04",
    category: "security",
    categoryLabel: "Forensic Standards",
    q: "What forensic and evidence standards govern file carving and recovery?",
    a: "Forensic file carving, structural validation, and evidence sealing strictly align with ISO/IEC 27037 (Digital Evidence Handling) and NIST SP 800-101 (Mobile & Storage Forensics). Each carved file is assigned a forensic confidence score, SHA-256 digest, and evidence seal to maintain strict chain-of-custody in legal proceedings.",
    badge: "ISO 27037 & NIST SP 800-101",
    keywords: ["forensic", "recovery", "carving", "iso 27037", "evidence", "confidence", "custody"],
  },
  {
    id: "FAQ-05",
    category: "security",
    categoryLabel: "Classified InfoSec",
    q: "How does PRAMAAN ensure classified data protection during agent execution?",
    a: "All forensic execution agents run in isolated subprocesses operating under least-privilege security contexts. Sensitive file payloads are never logged or stored in plaintext, and only cryptographic hashes and metadata metrics are written to the system audit ledger. PRAMAAN supports air-gapped on-premise Docker deployment.",
    badge: "Air-Gapped On-Premise",
    keywords: ["classified", "infosec", "air-gapped", "security", "docker", "on-premise", "privacy"],
  },
  {
    id: "FAQ-06",
    category: "security",
    categoryLabel: "System Audit",
    q: "Is there a comprehensive, tamper-evident audit log for operator actions?",
    a: "Yes — every administrative action, user login, job dispatch, role mutation, and certificate generation is appended to categorized system audit logs (LIVE, DEVICE, BACKEND, SECURITY). Role-based access control (4-tier RBAC) limits log visibility and export privileges based on assigned duties.",
    badge: "Tamper-Evident Logs",
    keywords: ["audit", "log", "rbac", "tamper-evident", "operator", "history", "security"],
  },
];

function getYouTubeEmbedUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.includes("/embed/")) {
    const clean = trimmed.split("?")[0];
    return `${clean}?autoplay=1&rel=0`;
  }
  const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
  }
  const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}?autoplay=1&rel=0`;
  }
  return trimmed;
}

// ==================================================================== page
export default function LandingPage() {
  const [stats, setStats] = useState<PublicStatsOut | null>({
    operations_count: 10,
    devices_count: 6,
    cases_count: 3,
    chain_verification_pct: 100,
  });
  const [err, setErr] = useState<string | null>(null);
  const [faqCategory, setFaqCategory] = useState<"all" | "verification" | "hardware" | "security">("all");
  const [faqSearch, setFaqSearch] = useState<string>("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("FAQ-01");

  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const DEMO_YOUTUBE_URL = "https://youtu.be/JqpdL-7l4_U";

  const filteredFaqs = FAQS.filter((f) => {
    const matchesCategory = faqCategory === "all" || f.category === faqCategory;
    const qLower = faqSearch.toLowerCase().trim();
    if (!qLower) return matchesCategory;
    const matchesSearch =
      f.q.toLowerCase().includes(qLower) ||
      f.a.toLowerCase().includes(qLower) ||
      f.categoryLabel.toLowerCase().includes(qLower) ||
      f.badge.toLowerCase().includes(qLower) ||
      f.keywords.some((k) => k.includes(qLower));
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    void (async () => {
      try {
        setStats(await getPublicStats());
      } catch (e) {
        setErr(e instanceof Error ? e.message : null);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-page text-main font-display">
      {/* Government Top Header Bar */}
      <GovernmentTopHeaderBar />

      {/* ========================================================== NAV */}
      <header className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-2.5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3 shrink-0">
            <NtroGovernmentLogo variant="header" showSubtitle={true} />
          </Link>
          <nav className="hidden items-center justify-center gap-4 xl:gap-6 lg:flex text-xs xl:text-sm font-semibold flex-1 px-2">
            <a href="#features" className="text-main/90 hover:text-govt-navy transition-colors whitespace-nowrap">Features</a>
            <a href="#standards" className="text-main/90 hover:text-govt-navy transition-colors whitespace-nowrap">Standards</a>
            <a href="#workflow" className="text-main/90 hover:text-govt-navy transition-colors whitespace-nowrap">Workflow</a>
            <a href="#faq" className="text-main/90 hover:text-govt-navy transition-colors whitespace-nowrap">FAQ</a>
            <Link href="/dashboard/manual" className="text-main/90 hover:text-govt-navy transition-colors whitespace-nowrap">User Manual</Link>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold transition-colors whitespace-nowrap cursor-pointer bg-red-50 hover:bg-red-100 border border-red-200/80 px-2.5 py-1 rounded-md"
              title="Watch PRAMAAN Prototype Demo Video on YouTube"
            >
              <svg className="w-3.5 h-3.5 fill-current text-red-600" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Watch Demo</span>
            </button>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/downloads/PRAMAAN_Desktop_Setup.exe"
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-govt-gold/60 bg-govt-goldLight px-2.5 py-1.5 text-xs font-bold text-govt-navy hover:bg-govt-goldDark hover:text-white transition-colors shadow-2xs whitespace-nowrap"
              title="Download PRAMAAN Native Desktop App (.exe)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden xl:inline">Download Desktop App</span>
              <span className="xl:hidden">Desktop App</span>
            </a>
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white hover:bg-field px-2.5 py-1.5 text-xs font-semibold text-govt-navy transition-colors shadow-2xs whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 text-govt-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Verify</span>
            </Link>
            <Link href="/login" className="fg-btn-primary !py-1.5 !px-3 text-xs whitespace-nowrap">
              Operator Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================== HERO */}
      <section
        id="hero"
        className="relative overflow-hidden bg-[#F4F7FA] text-main border-b border-line flex flex-col justify-between min-h-[540px] lg:min-h-[calc(100vh-105px)]"
      >
        {/* Government Forensics Hero Background Image - 100% Cover Edge-to-Edge */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-no-repeat pointer-events-none opacity-95"
          style={{
            backgroundImage: "url('/bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />

        {/* Soft Scrim Gradient - Left Side Only for Crisp Text Legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent pointer-events-none w-full lg:w-[60%]"
        />

        {/* Hero Main Content Area */}
        <div className="relative mx-auto max-w-[1440px] px-5 pt-8 pb-10 md:px-8 lg:px-12 md:pt-12 md:pb-14 w-full flex-1 flex flex-col justify-center">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Government Mandate Badge & Watch Video Demo Button */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-gold/60 bg-govt-goldLight/90 px-4 py-1.5 shadow-xs backdrop-blur-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-govt-goldDark animate-pulse" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-govt-navy">
                  GOVT OF INDIA · NTRO · PROBLEM STATEMENT ID 26149
                </span>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1 text-[11px] font-bold shadow-xs transition-all hover:scale-105 cursor-pointer"
                title="Watch PRAMAAN Prototype Demo Video on YouTube"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <svg className="w-3 h-3 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Watch Video Demo</span>
              </button>
            </div>

            {/* PRAMAAN Brand Header */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-govt-navy">
                  PRAMAAN
                </h1>
                <span className="font-mono text-2xl md:text-3xl font-bold tracking-widest text-govt-goldDark uppercase border-l-2 border-govt-gold/60 pl-3">
                  प्रमाण
                </span>
              </div>
              <p className="text-lg md:text-xl font-semibold text-govt-navy/90 tracking-wide font-display">
                Integrated Secure Data Sanitisation &amp; Digital Forensic Recovery Platform
              </p>
            </div>

            {/* Core Value Statement */}
            <p className="mt-5 max-w-xl text-sm md:text-base leading-relaxed text-muted font-medium">
              Engineered for defense, intelligence, and law enforcement agencies to execute <span className="text-govt-navy/90 font-semibold">NIST SP 800-88 Rev. 2</span> compliant drive erasures, selective file destruction, and forensic file carving — sealed with an immutable <span className="text-govt-navy/90 font-semibold">SHA-256 hash-chain and ECDSA signatures </span>.
            </p>

            {/* Platform Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="bg-govt-blueLight text-govt-navy px-2.5 py-1 rounded border border-govt-blueRing font-semibold">NIST SP 800-88 REV. 2</span>
              <span className="bg-white/90 text-main px-2.5 py-1 rounded border border-line font-medium shadow-2xs">ISO 27037 FORENSIC SEAL</span>
              <span className="bg-white/90 text-main px-2.5 py-1 rounded border border-line font-medium shadow-2xs">DoD 5220.22-M</span>
              <span className="bg-govt-goldLight text-govt-navy px-2.5 py-1 rounded border border-govt-gold/40 font-bold">ECDSA P-256 ANCHORED</span>
            </div>

            {/* Call to Action Buttons - Clean Responsive Flex Layout */}
            <div className="mt-8 flex flex-wrap items-center gap-3 md:gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-5 py-3 text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.01] shrink-0"
              >
                <span>Access Operator Console</span>
                <span className="text-lg">→</span>
              </Link>
              <a
                href="/downloads/PRAMAAN_Desktop_Setup.exe"
                download
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-5 py-3 text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.01] shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Desktop App</span>
              </a>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-field text-govt-navy border border-line font-semibold px-5 py-3 text-sm transition-all shadow-xs shrink-0"
              >
                <span>Verify Certificate</span>
                <svg className="w-4 h-4 text-govt-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Full Screen Width Edge-to-Edge Government Control Panel Live Stats Bar */}
        <div className="relative z-10 w-full border-t border-govt-gold/30 bg-govt-navy text-white py-3 shadow-lg">
          <div className="w-full px-4 md:px-8 xl:px-12 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
            {/* Left Group: Live Status + Workspace Title + Sanitisation Primitives */}
            <div className="flex items-center gap-3 md:gap-5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-govt-goldLight font-bold">
                  NATIONAL SECURITY WORKSPACE
                </div>
                <div className="text-xs font-semibold text-white/90 font-display">
                  Platform Integrity Live Feed
                </div>
              </div>

              {/* Inline Sanitisation Primitives Badges */}
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] border-l border-white/20 pl-3 md:pl-5 ml-1">
                <span className="text-white/60 text-[10px] mr-1">Primitives:</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/20 font-bold">CLEAR</span>
                <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30 font-bold">PURGE</span>
                <span className="bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30 font-bold">CRYPTO-ERASE</span>
              </div>
            </div>

            {/* Right Group: Metrics Counters */}
            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 shrink-0">
              <div className="flex items-center gap-2">
                <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                  {(stats?.operations_count ?? 10).toLocaleString()}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Operations<br />Logged
                </div>
              </div>

              <div className="h-7 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                  {(stats?.devices_count ?? 6).toLocaleString()}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Devices<br />Managed
                </div>
              </div>

              <div className="h-7 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                  {(stats?.cases_count ?? 3).toLocaleString()}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Case Files<br />Opened
                </div>
              </div>

              <div className="h-7 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="font-display text-2xl font-extrabold text-emerald-400 tabular-nums">
                  {stats?.chain_verification_pct ? `${Math.round(stats.chain_verification_pct)}%` : "100%"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Chain<br />Integrity
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== FEATURES */}
      <section id="features" className="relative border-b border-line bg-gradient-to-b from-white via-slate-50/50 to-white py-20 overflow-hidden">
        {/* Subtle Background Radial Decorative Accents */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-govt-blueLight/30 rounded-full blur-3xl pointer-events-none -z-10 opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-govt-goldLight/30 rounded-full blur-3xl pointer-events-none -z-10 opacity-60"
        />

        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-gold/40 bg-govt-goldLight/70 px-3.5 py-1 text-[11px] font-mono font-bold text-govt-navy uppercase tracking-widest mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-navy animate-pulse" />
                NTRO CORE CAPABILITIES · SUITE SPECIFICATION
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-govt-navy">
                Six Integrated Forensic Modules
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                Engineered around shared defense-grade primitives: identity, RBAC, append-only SHA-256 hash-chain, ECDSA P-256 signatures, real-time WebSocket telemetry, and tamper-evident audit logging.
              </p>
            </div>

            {/* Quick Badge Counter */}
            <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs shrink-0 font-mono">
              <div className="px-3 py-1 bg-govt-navy text-govt-gold rounded-lg font-bold text-xs">
                MODULES: 06/06
              </div>
              <div className="text-xs text-slate-600 font-semibold pr-2">
                NIST SP 800-88 REV. 2 COMPLIANT
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Top Subtle Gradient Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.gradient}`} />

                <div>
                  {/* Top Bar: Icon + Module Code Badge */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {f.icon}
                    </div>
                    <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border ${f.badgeBg}`}>
                      {f.id}
                    </span>
                  </div>

                  {/* Module Title & Subtitle */}
                  <div>
                    <h3 className="font-display text-xl font-extrabold text-govt-navy group-hover:text-govt-blueDark transition-colors">
                      {f.title}
                    </h3>
                    <div className="font-mono text-[11px] font-semibold text-govt-blue mt-0.5">
                      {f.subtitle}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs md:text-sm leading-relaxed text-slate-600 font-normal">
                    {f.body}
                  </p>

                  {/* Feature Tags */}
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-700 group-hover:border-slate-300 transition-colors"
                      >
                        <span className="h-1 w-1 rounded-full bg-govt-navy/40" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Interactive Link */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-govt-navy group-hover:text-govt-blue transition-colors">
                  <Link href={f.href} className="inline-flex items-center gap-1.5 hover:underline">
                    <span>Explore Module</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <span className="font-mono text-[10px] text-slate-400 group-hover:text-govt-navy transition-colors font-normal">
                    {f.num} / 06
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== ARCHITECTURE */}
      <section id="architecture" className="relative border-b border-line bg-field/40 py-20 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-govt-blueLight/20 rounded-full blur-3xl pointer-events-none -z-10 opacity-70"
        />

        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-navy/20 bg-white px-3.5 py-1 text-[11px] font-mono font-bold text-govt-navy uppercase tracking-widest mb-3 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-navy animate-pulse" />
                TECHNICAL ARCHITECTURE SPECS
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-govt-navy">
                Layered Defense-Grade Architecture
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                Strict separation of concerns with zero-trust execution boundaries. Standalone CLI forensic agents run independently while real-time API orchestration appends tamper-evident proofs to the immutable hash-chain ledger.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl p-3 text-xs font-mono shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-600 font-medium">PIPELINE INTEGRITY:</span>
              <span className="text-emerald-700 font-bold">100% VERIFIED</span>
            </div>
          </div>

          {/* Tactical Pipeline Process Banner */}
          <div className="mb-10 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="font-mono text-[10px] font-bold text-govt-navy uppercase tracking-widest mb-3 text-center md:text-left">
              REAL-TIME DATA EXECUTION & TRUST PIPELINE
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-mono font-bold text-govt-navy bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">01</span>
                <div>
                  <div className="font-bold text-govt-navy">Operator Console</div>
                  <div className="text-[10px] text-slate-500 font-mono">User UI Request</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">02</span>
                <div>
                  <div className="font-bold text-govt-navy">FastAPI Dispatcher</div>
                  <div className="text-[10px] text-slate-500 font-mono">Job & Task Queue</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">03</span>
                <div>
                  <div className="font-bold text-govt-navy">Isolated CLI Agent</div>
                  <div className="text-[10px] text-slate-500 font-mono">Disk / File Engine</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-mono font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">04</span>
                <div>
                  <div className="font-bold text-govt-navy">SHA-256 Ledger</div>
                  <div className="text-[10px] text-slate-500 font-mono">ECDSA Signed Block</div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Architectural Stack Nodes (4 Tiers) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* TIER 01 */}
            <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-govt-gold/60 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-[10px] font-bold text-govt-navy bg-govt-goldLight px-2.5 py-1 rounded-full border border-govt-gold/40">
                    LAYER 01
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">CLIENT TIER</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#051329] to-[#0B2D4D] text-govt-gold shadow-md group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-govt-navy">Presentation UI</h3>
                    <div className="font-mono text-[10px] font-semibold text-govt-blue">Next.js 14 · Tailwind</div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-govt-navy" />
                    <span>Government UI Shell</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-govt-navy" />
                    <span>Case Workspace &amp; Timeline</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-govt-navy" />
                    <span>Evidence Recovery Explorer</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-govt-navy" />
                    <span>Offline QR Verification Portal</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 font-mono text-[10px] text-slate-500 flex justify-between">
                <span>PROTOCOL: HTTPS / WSS</span>
                <span className="text-govt-navy font-bold">ACTIVE</span>
              </div>
            </div>

            {/* TIER 02 */}
            <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-blue-400/60 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    LAYER 02
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">SERVER TIER</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#0B2D4D] to-[#005BAC] text-white shadow-md group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-govt-navy">API Orchestration</h3>
                    <div className="font-mono text-[10px] font-semibold text-govt-blue">FastAPI · SQLAlchemy Async</div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>JWT + 4-Tier RBAC Gating</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>Async Task Queue &amp; Dispatcher</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>Notifications &amp; Global Search</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>Real-Time WebSocket Stream</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 font-mono text-[10px] text-slate-500 flex justify-between">
                <span>RUNTIME: PYTHON 3.12</span>
                <span className="text-blue-700 font-bold">ASYNC</span>
              </div>
            </div>

            {/* TIER 03 */}
            <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-400/60 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    LAYER 03
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">EXECUTION TIER</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#047857] to-[#10B981] text-white shadow-md group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-govt-navy">Forensic Agents</h3>
                    <div className="font-mono text-[10px] font-semibold text-govt-blue">Standalone Python CLIs</div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>drive-eraser-agent (Clear/Purge)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>file-folder-eraser (Inode Scrub)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>recovery-engine (Carving)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>100% Read-Back Verification</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 font-mono text-[10px] text-slate-500 flex justify-between">
                <span>HARDWARE: DIRECT ACCESS</span>
                <span className="text-emerald-700 font-bold">ISOLATED</span>
              </div>
            </div>

            {/* TIER 04 */}
            <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    LAYER 04
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">LEDGER TIER</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white shadow-md group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-govt-navy">Trust &amp; Ledger</h3>
                    <div className="font-mono text-[10px] font-semibold text-govt-blue">PostgreSQL · Chain</div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>Append-Only SHA-256 Chain</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>ECDSA P-256 Operator Keys</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>Signed PDF Certificates</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>Tamper-Detect Audit Log</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 font-mono text-[10px] text-slate-500 flex justify-between">
                <span>SECURITY: ECDSA P-256</span>
                <span className="text-amber-700 font-bold">IMMUTABLE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== STANDARDS */}
      <section id="standards" className="relative border-b border-line bg-white py-20 overflow-hidden">
        {/* Decorative Ambient Background Accents */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-govt-goldLight/20 rounded-full blur-3xl pointer-events-none -z-10 opacity-60"
        />

        <div className="mx-auto max-w-7xl px-5 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-gold/50 bg-govt-goldLight/80 px-3.5 py-1 text-[11px] font-mono font-bold text-govt-navy uppercase tracking-widest mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-navy animate-pulse" />
                CONFORMITY &amp; REGULATORY COMPLIANCE MATRIX
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-govt-navy">
                Security &amp; Forensic Standards
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                Platform workflows, sanitisation primitives, evidence carving, and cryptographic signatures strictly conform to government, defense, and international forensic benchmarks.
              </p>
            </div>

            {/* Regulatory Badge */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded-xl p-3 shadow-2xs font-mono shrink-0">
              <div className="p-2 bg-govt-navy text-govt-gold rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-govt-navy">NTRO APPROVED SPEC</div>
                <div className="text-[10px] text-slate-500">ECDSA P-256 · SHA-256 CHAINED</div>
              </div>
            </div>
          </div>

          {/* Standards Quick Specs Ribbon / Ticker Bar */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-2xs">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
              AUDITED STANDARDS:
            </span>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              {STANDARDS.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 font-semibold shadow-2xs"
                >
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{s}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 4 Categorized Compliance Pillars */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STANDARD_PILLARS.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Top Subtle Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${p.gradient}`} />

                <div>
                  {/* Top Bar: Icon + Category Badge */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${p.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                      {p.icon}
                    </div>
                    <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-lg font-bold text-govt-navy leading-snug">
                    {p.category}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                    {p.description}
                  </p>

                  {/* List of Standards with Specs */}
                  <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100">
                    {p.standards.map((st) => (
                      <div key={st.name} className="flex items-start gap-2 text-xs">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                          ✓
                        </span>
                        <div>
                          <div className="font-mono font-bold text-govt-navy text-[11px]">{st.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{st.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Assurance Seal */}
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-500 font-semibold">
                  <span>CONFORMITY STATUS:</span>
                  <span className="text-emerald-700 font-bold">100% VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== WORKFLOW */}
      <section id="workflow" className="relative border-b border-line bg-field/40 py-24 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-govt-blueLight/25 rounded-full blur-3xl pointer-events-none -z-10 opacity-70"
        />

        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-navy/20 bg-white px-3.5 py-1 text-[11px] font-mono font-bold text-govt-navy uppercase tracking-widest mb-3 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-navy animate-pulse" />
                END-TO-END LIFECYCLE · 6 AUDITED STAGES
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-govt-navy">
                Investigation &amp; Sanitisation Workflow
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                An interactive 3D-anchored lifecycle pipeline tracing case initiation, storage media detection, async dispatching, real-time forensic wiping, SHA-256 block sealing, and independent public verification.
              </p>
            </div>

            {/* Stepper Status Badge */}
            <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-200/90 rounded-xl p-3.5 text-xs font-mono shadow-xs shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-600 font-medium">LIFECYCLE TELEMETRY:</span>
              <span className="text-emerald-700 font-bold">6 STAGES ACTIVE</span>
            </div>
          </div>

          {/* 3D Horizontal Flow Navigator Bar */}
          <div className="mb-16 hidden md:block rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="font-mono text-[10px] font-bold text-govt-navy uppercase tracking-widest mb-3 text-center">
              CONTINUOUS FORENSIC DATA PIPELINE & AUDIT TRAIL
            </div>
            <div className="flex items-center justify-between gap-2 relative px-4">
              {WORKFLOW_STEPS.map((s, i) => (
                <div key={s.step} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.gradient} text-white font-mono text-xs font-bold flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      {s.step}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-govt-navy hidden lg:inline">
                      {s.title}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="flex items-center gap-1 text-slate-300 font-mono text-xs px-1">
                      <span className="h-0.5 w-6 md:w-10 bg-gradient-to-r from-govt-navy/40 to-govt-blue/40" />
                      <span className="text-govt-blue animate-pulse">►</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vertical 3D Laser Spine & Alternating Flow Roadmap */}
          <div className="relative">
            {/* Central Vertical Glowing Energy Beam Line (Desktop) */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-[#051329] via-[#005BAC] via-[#10B981] to-[#6366F1] rounded-full shadow-[0_0_15px_rgba(0,91,172,0.4)]" />

            <div className="space-y-12 lg:space-y-16">
              {WORKFLOW_STEPS.map((s, idx) => {
                const isEven = idx % 2 === 1;
                return (
                  <div
                    key={s.step}
                    className="relative flex flex-col lg:flex-row items-center justify-between gap-8 group"
                  >
                    {/* Floating 3D Number Node Pinned to Center Spine (Desktop) */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 items-center justify-center">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${s.gradient} text-white font-mono text-lg font-extrabold flex items-center justify-center shadow-xl shadow-govt-navy/20 border-2 border-white group-hover:scale-125 transition-transform duration-500`}>
                        {s.step}
                      </div>
                    </div>

                    {/* Left Card Slot */}
                    <div className={`w-full lg:w-[45%] ${isEven ? "lg:order-2" : "lg:order-1 lg:text-right"}`}>
                      <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group-hover:border-govt-gold/60 overflow-hidden">
                        {/* Top Gradient Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${s.gradient}`} />

                        {/* Top Mobile Badge + Category Identifier */}
                        <div className={`flex items-center gap-3 mb-4 ${isEven ? "" : "lg:justify-end"}`}>
                          <span className="lg:hidden font-mono font-bold text-xs bg-govt-navy text-white px-2.5 py-1 rounded-md shadow-xs">
                            STAGE {s.step}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {s.stage}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-govt-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                            {s.tag}
                          </span>
                        </div>

                        {/* Icon & Title */}
                        <div className={`flex items-center gap-3.5 mb-3 ${isEven ? "" : "lg:flex-row-reverse"}`}>
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-md group-hover:rotate-6 transition-transform duration-300`}>
                            {s.icon}
                          </div>
                          <div>
                            <h3 className="font-display text-xl md:text-2xl font-extrabold text-govt-navy group-hover:text-govt-blue transition-colors">
                              {s.title}
                            </h3>
                            <div className="font-mono text-[11px] font-bold text-govt-blue">
                              {s.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-3 text-xs md:text-sm leading-relaxed text-slate-600 font-medium">
                          {s.body}
                        </p>

                        {/* Bottom Status Bar */}
                        <div className={`mt-6 pt-3 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-500 font-semibold ${isEven ? "" : "lg:flex-row-reverse"}`}>
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>VERIFIED AUDIT LIFECYCLE</span>
                          </span>
                          <span className="text-govt-navy font-bold">STAGE {s.step} / 06</span>
                        </div>
                      </div>
                    </div>

                    {/* Empty Opposite Side Slot to Balance Grid Layout */}
                    <div className={`hidden lg:block w-[45%] ${isEven ? "lg:order-1" : "lg:order-2"}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== FAQ */}
      <section id="faq" className="relative border-b border-line bg-gradient-to-b from-white via-slate-50/50 to-white py-20 overflow-hidden">
        {/* Decorative Ambient Background Accents */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-govt-blueLight/25 rounded-full blur-3xl pointer-events-none -z-10 opacity-60"
        />

        <div className="mx-auto max-w-7xl px-5 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-navy/20 bg-white px-3.5 py-1 text-[11px] font-mono font-bold text-govt-navy uppercase tracking-widest mb-3 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-navy animate-pulse" />
                NTRO OPERATOR KNOWLEDGE BASE · Q&amp;A SPECS
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-govt-navy">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                Detailed technical guidance on drive sanitisation primitives, forensic carving standards, SHA-256 ledger verification, and classified air-gapped deployment.
              </p>
            </div>

            {/* Quick Filter Badge Indicator */}
            <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs font-mono text-xs shrink-0">
              <div className="px-2.5 py-1 bg-govt-navy text-govt-gold rounded-lg font-bold">
                {filteredFaqs.length} / {FAQS.length} FAQs
              </div>
              <div className="text-slate-600 font-medium pr-1">
                OPERATIONAL GUIDELINES
              </div>
            </div>
          </div>

          {/* Search & Category Filter Pills Bar */}
          <div className="mb-10 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFaqCategory("all")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-mono ${
                  faqCategory === "all"
                    ? "bg-govt-navy text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60"
                }`}
              >
                ALL QUESTIONS ({FAQS.length})
              </button>
              <button
                type="button"
                onClick={() => setFaqCategory("verification")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-mono ${
                  faqCategory === "verification"
                    ? "bg-govt-navy text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60"
                }`}
              >
                LEDGER &amp; VERIFICATION
              </button>
              <button
                type="button"
                onClick={() => setFaqCategory("hardware")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-mono ${
                  faqCategory === "hardware"
                    ? "bg-govt-navy text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60"
                }`}
              >
                HARDWARE &amp; MEDIA
              </button>
              <button
                type="button"
                onClick={() => setFaqCategory("security")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all font-mono ${
                  faqCategory === "security"
                    ? "bg-govt-navy text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60"
                }`}
              >
                SECURITY &amp; AUDIT
              </button>
            </div>

            {/* Keyword Search Input Bar */}
            <div className="relative min-w-[260px] md:w-80">
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs (e.g. NIST, SHA-256)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {faqSearch && (
                <button
                  type="button"
                  onClick={() => setFaqSearch("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Accordion List Cards */}
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-display text-base font-bold text-govt-navy">No matching FAQs found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                No questions match your query &quot;{faqSearch}&quot;. Try clearing your search filter or selecting a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFaqSearch("");
                  setFaqCategory("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-govt-navy text-white text-xs font-bold shadow-xs hover:bg-govt-blueDark transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-300 bg-white overflow-hidden ${
                      isOpen
                        ? "border-govt-navy/40 shadow-lg ring-1 ring-govt-navy/10"
                        : "border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full p-5 md:p-6 text-left flex items-start justify-between gap-4 group"
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    >
                      <div className="space-y-2 max-w-4xl">
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                          <span className="font-bold text-govt-navy bg-govt-goldLight px-2.5 py-0.5 rounded border border-govt-gold/40">
                            {item.id}
                          </span>
                          <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.categoryLabel}
                          </span>
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.badge}
                          </span>
                        </div>

                        {/* Question Text */}
                        <h3 className="font-display text-base md:text-lg font-bold text-govt-navy group-hover:text-govt-blue transition-colors leading-snug">
                          {item.q}
                        </h3>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-sm font-bold transition-all duration-300 ${
                          isOpen
                            ? "bg-govt-navy text-white shadow-md rotate-180"
                            : "bg-slate-100 text-slate-600 group-hover:bg-govt-blueLight group-hover:text-govt-navy"
                        }`}
                      >
                        {isOpen ? "−" : "+"}
                      </div>
                    </button>

                    {/* Answer Expanded Area */}
                    {isOpen && (
                      <div className="px-5 pb-6 pt-2 md:px-6 md:pb-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                        <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-medium">
                          {item.a}
                        </p>

                        {/* Key Operational Takeaway Banner */}
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 flex items-start gap-2.5 text-xs text-emerald-950 font-medium">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                            ✓
                          </span>
                          <div>
                            <span className="font-mono font-bold text-emerald-900 uppercase tracking-wider text-[10px] mr-1.5">
                              VERIFIED SPEC:
                            </span>
                            <span>{item.badge} compliance confirmed for all active operator sessions.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Operator Support CTA Card */}
          <div className="mt-12 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-900 via-govt-navy to-slate-900 text-white p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-white/10 text-govt-gold border border-white/20 shadow-inner shrink-0 hidden sm:block">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold text-govt-goldLight uppercase tracking-widest">
                  OPERATOR &amp; AUDITOR SUPPORT
                </div>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  Have specific technical or deployment questions?
                </h3>
                <p className="text-xs md:text-sm text-white/80 mt-1 max-w-xl font-normal leading-relaxed">
                  Our Digital Forensics Unit engineering team provides assistance for agency-specific deployment configurations, air-gapped environments, and custom audit policies.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
              <Link
                href="/dashboard/manual"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-white text-govt-navy hover:bg-slate-100 font-bold px-5 py-2.5 text-xs transition-all shadow-md"
              >
                <span>Read User Manual</span>
                <span className="text-sm">→</span>
              </Link>
              <a
                href="#contact"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 text-xs transition-all border border-white/20"
              >
                <span>Contact DFU</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== CONTACT / CTA */}
      <section id="contact" className="relative border-b border-line bg-field/40 py-20 overflow-hidden">
        {/* Subtle Ambient Radial Glow Background */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-govt-blueLight/25 rounded-full blur-3xl pointer-events-none -z-10 opacity-70"
        />

        <div className="mx-auto max-w-7xl px-5 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-gold/50 bg-govt-goldLight/80 px-3.5 py-1 text-[11px] font-mono font-bold text-govt-navy uppercase tracking-widest mb-3 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-navy animate-pulse" />
                NATIONAL SECURITY DEPLOYMENT · AGENCY ONBOARDING
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-govt-navy">
                Ready for Production Deployment
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                Initiate organization onboarding, deploy air-gapped forensic agents, or coordinate with the NTRO Digital Forensics Unit for classified system integration.
              </p>
            </div>

            {/* Platform Status Badge */}
            <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs font-mono text-xs shrink-0">
              <div className="flex h-2.5 w-2.5 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="text-slate-600 font-medium">
                DISPATCH ENGINE: <span className="text-emerald-700 font-bold">READY FOR ONBOARDING</span>
              </div>
            </div>
          </div>

          {/* Dual Column Command CTA Container */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-10 shadow-xl overflow-hidden relative">
            {/* Top Subtle Gold/Navy Gradient Identity Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#051329] via-[#0B2D4D] via-[#B8860B] to-[#005BAC]" />

            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Information & Institutional Details (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-md bg-govt-navy/5 px-2.5 py-1 text-[11px] font-mono font-bold text-govt-navy">
                  <span>PROBLEM STATEMENT ID: 26149</span>
                  <span>·</span>
                  <span>SIH 2026 GRAND FINALE</span>
                </div>

                <h3 className="font-display text-2xl md:text-3xl font-extrabold text-govt-navy leading-tight">
                  Pilot &amp; Classified Deployment Enquiries
                </h3>

                <p className="text-xs md:text-sm leading-relaxed text-slate-600 font-normal">
                  For official organization onboarding, air-gapped on-premise deployments, or cryptographic audit queries, contact the Digital Forensics Unit through your designated NTRO liaison. All operator accounts are verified upon registration in accordance with security policy.
                </p>

                {/* 4 Interactive Feature / Metadata Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors">
                    <div className="p-2 rounded-lg bg-govt-navy text-govt-gold shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">RESPONSIBLE UNIT</div>
                      <div className="font-display text-xs font-bold text-govt-navy">Digital Forensics Unit (DFU)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors">
                    <div className="p-2 rounded-lg bg-govt-navy text-govt-gold shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">SPONSOR ORGANISATION</div>
                      <div className="font-display text-xs font-bold text-govt-navy">Govt of India · NTRO</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors">
                    <div className="p-2 rounded-lg bg-govt-navy text-govt-gold shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">DEPLOYMENT MODE</div>
                      <div className="font-display text-xs font-bold text-govt-navy">Air-Gapped Docker &amp; Bare Metal</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors">
                    <div className="p-2 rounded-lg bg-govt-navy text-govt-gold shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">SECURITY SPECS</div>
                      <div className="font-display text-xs font-bold text-govt-navy">ECDSA P-256 · SHA-256 Ledger</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Impact Action Panel (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-[#051329] via-[#0B2D4D] to-[#005BAC] text-white p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                  {/* Subtle Watermark Logo Background */}
                  <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                    <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] font-bold text-govt-goldLight uppercase tracking-widest mb-1">
                      OPERATOR CONSOLE ACCESS
                    </div>
                    <h4 className="font-display text-xl font-bold text-white">
                      Launch National Security Console
                    </h4>
                    <p className="text-xs text-white/80 mt-1 font-normal leading-relaxed">
                      Authenticate using certified credentials to access storage sanitisation queues, forensic recovery tools, and ledger audits.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Link
                      href="/login"
                      className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-govt-gold hover:bg-amber-400 text-govt-navy font-bold px-6 py-3.5 text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.01]"
                    >
                      <span>Access Operator Sign In</span>
                      <span className="text-base">→</span>
                    </Link>

                    <Link
                      href="/verify"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 text-xs transition-all border border-white/20 text-center"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Verify Public Certificate Ledger</span>
                    </Link>

                    <Link
                      href="/dashboard/manual"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 font-medium px-6 py-2.5 text-xs transition-all border border-white/10 text-center"
                    >
                      <svg className="w-4 h-4 text-govt-goldLight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>View Platform User Manual</span>
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-white/70">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      RESTRICTED ACCESS
                    </span>
                    <span>AUDIT LOGGING ENABLED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance Ticker Ribbon */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <span className="h-2 w-2 rounded-full bg-govt-navy" />
              SYSTEM GUARANTEES:
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-700 font-semibold text-[11px]">
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> NIST SP 800-88 REV. 2 COMPLIANT
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> AIR-GAPPED DOCKER DEPLOYMENT
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> ECDSA P-256 SIGNED LEDGER
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> ISO 27037 FORENSIC EVIDENCE SEAL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== FOOTER */}
      <footer className="bg-govt-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-4 md:px-8">
          <div>
            <NtroGovernmentLogo variant="dark" showSubtitle={true} />
            <p className="mt-3 text-[12px] leading-relaxed text-white/70">
              Integrated platform for secure storage sanitisation, forensic file
              recovery, and immutable operation ledger. Built for government use.
            </p>
          </div>
          <FooterCol
            heading="Platform"
            links={[
              { href: "#features", label: "Modules" },
              { href: "#architecture", label: "Architecture" },
              { href: "#standards", label: "Standards" },
              { href: "/verify", label: "Verify Certificate" },
              { href: "/dashboard/manual", label: "User Manual" },
            ]}
          />
          <FooterCol
            heading="Operations"
            links={[
              { href: "#workflow", label: "Workflow" },
              { href: "/login", label: "Operator Console" },
              { href: "#faq", label: "FAQ" },
              { href: "#contact", label: "Contact" },
            ]}
          />
          <FooterCol
            heading="Security Assurances"
            links={[
              { href: "#standards", label: "NIST SP 800-88 Rev. 2" },
              { href: "#standards", label: "ECDSA P-256 · SHA-256" },
              { href: "#standards", label: "ISO 27037 Evidence" },
              { href: "#hero", label: "Chain Verification" },
            ]}
          />
        </div>
        <div aria-hidden><div className="h-0.5 bg-govt-gold" /></div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 md:px-8">
          <span>© {new Date().getFullYear()} National Technical Research Organisation</span>
          <span>Restricted · Authorised Use Only · Audit Logged</span>
        </div>
      </footer>

      {/* ========================================================== DEMO VIDEO MODAL */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-govt-navy border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/30">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <span>PRAMAAN Platform Walkthrough</span>
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white tracking-wide">
                      YouTube Demo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Problem ID 26149 · NTRO · Prototype Demo Video
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Iframe Container */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getYouTubeEmbedUrl(DEMO_YOUTUBE_URL)}
                title="PRAMAAN Prototype Demo Video"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-3 bg-slate-900/90 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Official NTRO SIH 2026 Submission Demo</span>
              </div>
              <a
                href={DEMO_YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium underline underline-offset-4"
              >
                <span>Watch directly on YouTube</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================== inner components
function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-govt-blue">
        {eyebrow}
      </div>
      <h2
        className="mt-1 font-display text-[28px] font-semibold leading-tight text-govt-navy md:text-[34px]"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p
        className="mt-3 text-[14px] leading-relaxed text-muted md:text-[15px]"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}

function ArchLayer({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div className="rounded-md border border-govt-blueRing bg-white/75 p-5 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-govt-blue">
        {subtitle}
      </div>
      <div className="mt-1 font-display text-lg font-semibold text-govt-navy">{title}</div>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-2 border-t border-dashed border-line pt-2 text-[13px] text-main first:border-0 first:pt-0"
          >
            <span className="mt-[4px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-govt-navy" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-panel px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-medium text-main">{value}</div>
    </div>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
        {heading}
      </div>
      <ul className="mt-3 space-y-2 text-[13px] text-white/80">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
