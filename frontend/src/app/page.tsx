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

const FEATURES: Array<{ num: string; title: string; body: string; tags: string[] }> = [
  {
    num: "01",
    title: "Secure Drive Eraser",
    body: "Supports Clear, Purge, and Crypto-Erase sanitisation for HDD, SSD, NVMe, USB, and SD media with NIST SP 800-88 Rev. 1 compliance and independent read-back verification.",
    tags: ["Clear · Purge · Crypto-Erase", "Read-back Verify", "HDD · SSD · NVMe · USB"],
  },
  {
    num: "02",
    title: "File &amp; Folder Eraser",
    body: "Selective secure deletion with configurable overwrite passes, filesystem metadata scrubbing, residual free-space cleansing, and batch-workflow execution.",
    tags: ["N-pass Overwrite", "Metadata Scrub", "Free-space Wipe"],
  },
  {
    num: "03",
    title: "Advanced File Recovery",
    body: "Signature-based carving, structural validation, fragmented file reconstruction, automatic file classification, confidence scoring, and evidence integrity chain preservation.",
    tags: ["Signature Carving", "Confidence Scoring", "Evidence Seal"],
  },
  {
    num: "04",
    title: "Hash-Chain Ledger",
    body: "Every operation record is anchored to an append-only SHA-256 chain with ECDSA P-256 operator signatures. 3rd-party QR verification portal — no credentials required.",
    tags: ["SHA-256 Chain", "ECDSA P-256", "QR Verify Portal"],
  },
  {
    num: "05",
    title: "Case &amp; Evidence Management",
    body: "Government-style case files with case numbers, investigator assignment, evidence register, investigation timeline, and linked certificates.",
    tags: ["Case Numbering", "Evidence Register", "Timeline"],
  },
  {
    num: "06",
    title: "RBAC &amp; Auditing",
    body: "Four-tier role model (Administrator / Supervisor / Investigator / Auditor), operator-wide role gating, and immutable audit logs with tamper detection.",
    tags: ["RBAC · 4 Tiers", "Immutable Audit", "Tamper Detect"],
  },
];

const STANDARDS: string[] = [
  "NIST SP 800-88 Rev. 1",
  "DoD 5220.22-M",
  "ISO/IEC 27001",
  "MeitY GSR 2025",
  "ISO 27037 (Digital Evidence)",
  "NIST SP 800-171",
  "ENISA Data Sanitisation",
  "IEC 62443-4-1",
];

const WORKFLOW: Array<{ title: string; body: string }> = [
  { title: "Open Case", body: "Register a case file with case number, investigators, and scope." },
  { title: "Attach Device / Evidence", body: "Auto-detect or register storage media in the device inventory." },
  { title: "Queue Job", body: "Dashboard creates a job; backend task queue dispatches to the correct agent." },
  { title: "Execute Operation", body: "Agent performs sanitisation or recovery and streams real-time progress." },
  { title: "Anchored Certificate", body: "Operation writes a signed PDF certificate and appends a chain block." },
  { title: "Independent Verify", body: "Any auditor can verify the certificate offline or via the public portal." },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Is every operation independently verifiable?",
    a: "Yes — every sanitisation and recovery job produces a cryptographically signed PDF certificate that is appended to the SHA-256 hash-chain ledger. Any stakeholder can verify the chain with the public Verification Portal, without logging in.",
  },
  {
    q: "Which storage technologies are supported?",
    a: "HDD, SATA SSD, NVMe SSD, USB flash drives, SD cards, and (via the network module) iSCSI and SAN volumes. Each media type uses sanitisation primitives appropriate to its geometry.",
  },
  {
    q: "Can I perform selective file sanitisation without wiping the whole drive?",
    a: "Yes — the File & Folder Eraser module performs N-pass overwrite, scrubs NTFS/EXT inode metadata, and overwrites filesystem free-space so the deleted content cannot be carved back.",
  },
  {
    q: "What forensic standards does recovery conform to?",
    a: "Signature-based carving, structural validation, and integrity sealing align to ISO 27037 and NIST SP 800-101 principles. Every recovered file carries its SHA-256 digest and a forensic confidence score.",
  },
  {
    q: "How is classified data handled?",
    a: "All agents operate under the principle of least privilege, never plaintext logged; the chain ledger stores only digests. The platform ships with a Docker deployment reference and hardened configuration guide.",
  },
  {
    q: "Is there an audit trail of operator actions?",
    a: "Yes — every page write, role change, job, and login is appended to a categorized system log (LIVE, DEVICE, BACKEND, SECURITY). ADMINISTRATOR and AUDITOR accounts can review filtered views.",
  },
];

// ==================================================================== page
export default function LandingPage() {
  const [stats, setStats] = useState<PublicStatsOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <NtroGovernmentLogo variant="header" showSubtitle={true} />
          </Link>
          <nav className="hidden flex-wrap items-center gap-5 md:flex text-sm">
            <a href="#features" className="text-main hover:text-govt-navy">Features</a>
            <a href="#architecture" className="text-main hover:text-govt-navy">Architecture</a>
            <a href="#standards" className="text-main hover:text-govt-navy">Standards</a>
            <a href="#workflow" className="text-main hover:text-govt-navy">Workflow</a>
            <a href="#faq" className="text-main hover:text-govt-navy">FAQ</a>
            <a href="/verify" className="text-main hover:text-govt-navy">Verify Certificate</a>
            <Link href="/dashboard/manual" className="text-main hover:text-govt-navy">User Manual</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/verify" className="fg-btn !py-1.5 !px-3 text-xs hidden sm:inline-flex">
              Verify
            </Link>
            <Link href="/login" className="fg-btn-primary !py-1.5 !px-3 text-xs">
              Operator Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================== HERO */}
      <section
        id="hero"
        className="relative overflow-hidden bg-[#F4F7FA] text-main border-b border-line min-h-[580px] flex flex-col justify-between"
      >
        {/* Government Forensics Hero Background Image */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-right-top bg-no-repeat opacity-95 pointer-events-none"
          style={{
            backgroundImage: "url('/bg.png')",
          }}
        />

        {/* Soft Scrim Gradient - Left Side Only for Crisp Text Legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent pointer-events-none w-full md:w-2/3 lg:w-[55%]"
        />

        {/* Hero Main Content Area */}
        <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-16 md:px-8 md:pt-16 md:pb-20 w-full">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Government Mandate Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-govt-gold/60 bg-govt-goldLight/90 px-4 py-1.5 shadow-xs backdrop-blur-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-govt-goldDark animate-pulse" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-govt-navy">
                GOVT OF INDIA · NTRO · PROBLEM STATEMENT ID 26149
              </span>
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
              Engineered for defense, intelligence, and law enforcement agencies to execute NIST SP 800-88 Rev. 1 compliant drive erasures, selective file destruction, and forensic file carving — sealed with an immutable SHA-256 hash-chain and ECDSA signatures.
            </p>

            {/* Platform Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="bg-govt-blueLight text-govt-navy px-2.5 py-1 rounded border border-govt-blueRing font-semibold">NIST SP 800-88 REV. 1</span>
              <span className="bg-white/90 text-main px-2.5 py-1 rounded border border-line font-medium shadow-2xs">ISO 27037 FORENSIC SEAL</span>
              <span className="bg-white/90 text-main px-2.5 py-1 rounded border border-line font-medium shadow-2xs">DoD 5220.22-M</span>
              <span className="bg-govt-goldLight text-govt-navy px-2.5 py-1 rounded border border-govt-gold/40 font-bold">ECDSA P-256 ANCHORED</span>
            </div>

            {/* Call to Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.01]"
              >
                <span>Access Operator Console</span>
                <span className="text-lg">→</span>
              </Link>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-lg bg-white hover:bg-field text-govt-navy border border-line font-semibold px-6 py-3 text-sm transition-all shadow-xs"
              >
                <span>Verify Certificate</span>
                <span className="text-xs">🛡️</span>
              </Link>
              <Link
                href="/dashboard/manual"
                className="inline-flex items-center gap-2 rounded-lg bg-white/70 hover:bg-white text-muted hover:text-govt-navy font-medium px-4 py-3 text-sm transition-all border border-line/50"
              >
                <span>User Manual</span>
                <span className="text-xs">📖</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Full-Width Government Control Panel Live Stats Bar */}
        <div className="relative z-10 border-t border-govt-gold/30 bg-govt-navy text-white py-3.5 shadow-lg">
          <div className="mx-auto max-w-7xl px-5 md:px-8 flex flex-wrap items-center justify-between gap-4">
            {/* Left Group: Live Status + Workspace Title + Sanitisation Primitives */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
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
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] border-l border-white/20 pl-3 md:pl-4 ml-1">
                <span className="text-white/60 text-[10px] mr-1">Primitives:</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/20 font-bold">CLEAR</span>
                <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30 font-bold">PURGE</span>
                <span className="bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30 font-bold">CRYPTO-ERASE</span>
              </div>
            </div>

            {/* Right Group: Metrics Counters */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 md:gap-8">
              <div className="flex items-center gap-2.5">
                <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                  {stats ? stats.operations_count.toLocaleString() : "—"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Operations<br />Logged
                </div>
              </div>

              <div className="h-7 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                  {stats ? stats.devices_count.toLocaleString() : "—"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Devices<br />Managed
                </div>
              </div>

              <div className="h-7 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                  {stats ? stats.cases_count.toLocaleString() : "—"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/70 leading-tight">
                  Case Files<br />Opened
                </div>
              </div>

              <div className="h-7 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="font-display text-2xl font-extrabold text-emerald-400 tabular-nums">
                  {stats ? `${Math.round(stats.chain_verification_pct)}%` : "100%"}
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
      <section id="features" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <SectionHeading eyebrow="Core Capabilities" title="Six Integrated Modules" body="Every module operates on shared platform primitives: identity, RBAC, hash-chain, signing, notification, search, audit, and reporting." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.num} className="rounded-md border border-line bg-panel p-5 shadow-card hover:border-govt-blueRing transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-govt-blueRing bg-govt-blueLight font-mono text-[13px] font-semibold text-govt-navy">
                    {f.num}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    {f.tags.map((t) => (
                      <span key={t} className="fg-badge !py-0 !text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>
                <h3
                  className="mt-4 font-display text-lg font-semibold text-govt-navy"
                  dangerouslySetInnerHTML={{ __html: f.title }}
                />
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== ARCHITECTURE */}
      <section id="architecture" className="border-b border-line bg-field/40">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <SectionHeading
            eyebrow="Technical Reference"
            title="Layered Platform Architecture"
            body="Clean separation of responsibilities with strict module boundaries. Existing CLI agents are preserved; new orchestration is additive only."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <ArchLayer
              title="Presentation"
              subtitle="Next.js · TypeScript · Tailwind"
              items={[
                "Government UI Shell",
                "Case Workspace",
                "Recovery Evidence Explorer",
                "Verification Portal",
              ]}
            />
            <ArchLayer
              title="API &amp; Orchestration"
              subtitle="FastAPI · SQLAlchemy Async"
              items={[
                "JWT + ECDSA identity",
                "Task Queue · Jobs",
                "Notifications · Search",
                "Real-time WebSockets",
              ]}
            />
            <ArchLayer
              title="Forensic Agents"
              subtitle="Standalone Python CLIs"
              items={[
                "drive-eraser-agent",
                "file-folder-eraser",
                "recovery-engine",
                "WS-backed progress",
              ]}
            />
            <ArchLayer
              title="Trust &amp; Storage"
              subtitle="PostgreSQL · Ledger"
              items={[
                "Append-only SHA-256 Chain",
                "ECDSA P-256 Signatures",
                "Signed PDF Certificates",
                "Tamper-detect Audit",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ========================================================== STANDARDS */}
      <section id="standards" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <SectionHeading
            eyebrow="Conformity Matrix"
            title="Security &amp; Forensic Standards"
            body="Platform design and output formats follow the published government, international, and industry standards referenced below."
          />
          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {STANDARDS.map((s) => (
              <div
                key={s}
                className="flex items-center gap-3 rounded-sm border border-line bg-panel px-4 py-3"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-govt-blueLight text-govt-navy">
                  ✓
                </span>
                <span className="font-mono text-[12px] text-main">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================== WORKFLOW */}
      <section id="workflow" className="border-b border-line bg-field/40">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <SectionHeading
            eyebrow="End-to-end Lifecycle"
            title="Investigation &amp; Sanitisation Workflow"
            body="Six consistent stages from case registration through independent verification, every stage audit logged and chain anchored."
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {WORKFLOW.map((step, i) => (
              <li key={step.title} className="relative rounded-md border border-line bg-panel p-5">
                <span className="absolute -top-3 left-4 inline-flex h-7 w-7 items-center justify-center rounded-sm border border-govt-blueRing bg-gradient-to-br from-govt-blue to-govt-navy font-mono text-[12px] font-semibold text-white shadow-card">
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold text-govt-navy">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========================================================== FAQ */}
      <section id="faq" className="border-b border-line">
        <div className="mx-auto max-w-5xl px-5 py-16 md:px-8">
          <SectionHeading
            eyebrow="Q&amp;A"
            title="Frequently Asked Questions"
            body="Common questions from operators, auditors, and custodians regarding platform scope, deployment, and assurance."
          />
          <div className="mt-10 divide-y divide-line rounded-md border border-line bg-panel">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={item.q}
                  type="button"
                  className="block w-full px-5 py-4 text-left"
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-display text-[15px] font-semibold text-govt-navy">
                      {item.q}
                    </span>
                    <span className={"shrink-0 text-govt-blue transition-transform " + (open ? "rotate-180" : "")}>
                      ▾
                    </span>
                  </div>
                  {open && <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================== CONTACT / CTA */}
      <section id="contact" className="border-b border-line bg-field/40">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="rounded-md border border-govt-blueRing bg-gradient-to-br from-white via-white/80 to-govt-blueLight/40 p-8 shadow-card-md">
            <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-govt-blue">
                  Contact
                </div>
                <h2 className="mt-1 font-display text-2xl font-semibold text-govt-navy md:text-3xl">
                  Pilot &amp; Deployment Enquiries
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  For organisation onboarding, classified deployments, or audit queries,
                  contact the Digital Forensics Unit through your official NTRO liaison.
                  All operator accounts are verified at registration; self-service registration
                  may be restricted by an Administrator based on policy.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InfoTile label="Unit" value="Digital Forensics Unit · DFU" />
                  <InfoTile label="Sponsor" value="National Technical Research Organisation (NTRO)" />
                  <InfoTile label="Category" value="Software · SIH 2026 Grand Finale" />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Link href="/login" className="fg-btn-primary !py-3 !px-6 text-sm text-center">
                  Operator Sign In
                </Link>
                <Link href="/verify" className="fg-btn !py-3 !px-6 text-sm text-center">
                  Public Verification Portal
                </Link>
              </div>
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
              { href: "#standards", label: "NIST SP 800-88 Rev. 1" },
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
