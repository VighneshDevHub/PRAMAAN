"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getLedgerChain,
  UnauthorizedError,
  verifyLedgerSeq,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  LedgerBlock,
  LedgerVerifyOut,
  OperationType,
} from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { OperationTypeTag, StatusStamp } from "@/components/OperationBadges";
import { formatIndianDateTime } from "@/lib/formatters";

function fmt(ts: string): string {
  return formatIndianDateTime(ts);
}

function shortHash(h: string | null | undefined): string {
  if (!h || h.length < 16) return h ?? "-";
  return `${h.slice(0, 10)}…${h.slice(-10)}`;
}

// Copy to clipboard helper component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy hash to clipboard"
      className="inline-flex items-center gap-1 rounded border border-line bg-field px-1.5 py-0.5 text-[10px] font-mono text-muted transition hover:bg-panel hover:text-main hover:border-govt-blue"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3 text-govt-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-govt-green font-semibold">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// Hash Flow Diagram visualization inside expanded block
function HashFlowDiagram({
  prevHash,
  entryHash,
  certId,
  seq,
}: {
  prevHash: string;
  entryHash: string;
  certId?: string | null;
  seq: number;
}) {
  return (
    <div className="mb-4 rounded-lg border border-line bg-panel p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between text-xs font-mono">
        <span className="font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-govt-blue animate-pulse" />
          Cryptographic Chain Link Diagram
        </span>
        <span className="text-[10px] text-muted">Block #{seq} SHA-256 Proof</span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Step 1: Previous Hash */}
        <div className="w-full md:w-1/3 rounded-md border border-line bg-field p-2.5 transition hover:border-govt-blue/40">
          <div className="text-[9px] uppercase tracking-wider text-muted font-mono font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted" />
            Previous Chained Hash
          </div>
          <div className="mt-1 font-mono text-[11px] truncate text-main font-medium" title={prevHash}>
            {prevHash ? shortHash(prevHash) : "0000000000… (GENESIS)"}
          </div>
        </div>

        {/* Link Arrow 1 */}
        <div className="flex shrink-0 items-center justify-center text-govt-blue md:rotate-0 rotate-90 my-1 md:my-0">
          <div className="flex items-center gap-1 font-mono text-[9px] text-govt-blue font-bold px-2 py-1 rounded-md bg-govt-blueLight border border-govt-blue/20">
            <span>SHA-256</span>
            <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Step 2: Entry Hash */}
        <div className="w-full md:w-1/3 rounded-md border border-govt-blue/40 bg-govt-blueLight/30 p-2.5 transition hover:border-govt-blue">
          <div className="text-[9px] uppercase tracking-wider text-govt-blue font-mono font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-govt-blue animate-pulse" />
            Block Entry Hash
          </div>
          <div className="mt-1 font-mono text-[11px] truncate text-govt-navy font-bold" title={entryHash}>
            {entryHash ? shortHash(entryHash) : "—"}
          </div>
        </div>

        {/* Link Arrow 2 */}
        <div className="flex shrink-0 items-center justify-center text-govt-green md:rotate-0 rotate-90 my-1 md:my-0">
          <div className="flex items-center gap-1 font-mono text-[9px] text-govt-green font-bold px-2 py-1 rounded-md bg-govt-greenLight border border-govt-green/20">
            <span>SEALED</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Step 3: Certificate / Proof Stamp */}
        <div className="w-full md:w-1/3 rounded-md border border-govt-green/30 bg-govt-greenLight/30 p-2.5 transition hover:border-govt-green">
          <div className="text-[9px] uppercase tracking-wider text-govt-green font-mono font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-govt-green" />
            Signed Certificate
          </div>
          <div className="mt-1 font-mono text-[11px] truncate text-govt-green font-bold" title={certId ?? undefined}>
            {certId ? shortHash(certId) : "GENESIS_ANCHOR"}
          </div>
        </div>
      </div>
    </div>
  );
}

type StatCardDef = {
  label: string;
  value: number;
  accent: "navy" | "blue" | "green" | "red";
  icon: React.ReactNode;
  hint?: string;
};

const ACCENT_STYLES: Record<StatCardDef["accent"], { border: string; iconBg: string; text: string }> = {
  navy: { border: "border-govt-navy/20", iconBg: "bg-govt-navy/10 text-govt-navy", text: "text-govt-navy" },
  blue: { border: "border-govt-blue/20", iconBg: "bg-govt-blueLight text-govt-blue", text: "text-govt-blue" },
  green: { border: "border-govt-green/20", iconBg: "bg-govt-greenLight text-govt-green", text: "text-govt-green" },
  red: { border: "border-govt-red/20", iconBg: "bg-govt-redLight text-govt-red", text: "text-govt-red" },
};

function StatCard({ label, value, accent, icon, hint }: StatCardDef) {
  const style = ACCENT_STYLES[accent];
  return (
    <div className={`fg-panel overflow-hidden transition-all hover:shadow-card-md border ${style.border} bg-panel`}>
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted font-semibold">
            {label}
          </div>
          <div className={`mt-2 font-display text-3xl font-bold tracking-tight ${style.text} tabular-nums`}>
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-muted flex items-center gap-1 font-mono">
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{hint}</span>
            </div>
          )}
        </div>
        <div className={`shrink-0 p-3 rounded-lg ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function LedgerChainPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<LedgerBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fromSeq, setFromSeq] = useState<string>("");
  const [toSeq, setToSeq] = useState<string>("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [verifySeq, setVerifySeq] = useState<number | null>(null);
  const [verifyResult, setVerifyResult] = useState<LedgerVerifyOut | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const fs = fromSeq ? Number(fromSeq) : undefined;
      const ts = toSeq ? Number(toSeq) : undefined;
      const chain = await getLedgerChain({
        from_seq: Number.isFinite(fs) ? fs : undefined,
        to_seq: Number.isFinite(ts) ? ts : undefined,
      });
      setBlocks(chain);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load ledger chain");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function runVerify(seq: number) {
    setVerifySeq(seq);
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const v = await verifyLedgerSeq(seq);
      setVerifyResult(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  }

  const summary = useMemo(() => {
    if (!blocks) return { count: 0, ops: 0, valid: 0, fails: 0 };
    const opBlocks = blocks.filter((b) => b.success !== null);
    return {
      count: blocks.length,
      ops: opBlocks.length,
      valid: opBlocks.filter((b) => b.success).length,
      fails: opBlocks.filter((b) => b.success === false).length,
    };
  }, [blocks]);

  const integrityPct = useMemo(() => {
    if (!summary.ops) return 100;
    return Math.round((summary.valid / summary.ops) * 100);
  }, [summary]);

  return (
    <AppShell
      eyebrow="Integrity Subsystem"
      title="SHA-256 Hash Chain Ledger"
      subtitle="Interactive visualization of the immutable, append-only operation ledger. Each block carries its entry hash and chains to the previous hash; every signed certificate records a ledger sequence number for independent verification."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => reload()} className="fg-btn !py-1.5 !px-3 text-xs">
            <svg className={`w-3.5 h-3.5 text-muted ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload Chain
          </button>
          <button
            type="button"
            onClick={() => {
              if (blocks && blocks.length) runVerify(blocks[blocks.length - 1].sequence_number);
            }}
            className="fg-btn-primary !py-1.5 !px-3 text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verify Tip
          </button>
        </div>
      }
    >

      {error && (
        <div className="mb-6 rounded-md border border-govt-red/25 bg-govt-redLight px-4 py-3 text-sm text-govt-red flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* ================= STATS ================ */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Blocks Loaded"
          value={summary.count}
          accent="navy"
          hint="Chain sequence length"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Operations Logged"
          value={summary.ops}
          accent="blue"
          hint="Recorded actions"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <StatCard
          label="Verified Success"
          value={summary.valid}
          accent="green"
          hint={`${integrityPct}% integrity rating`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Failed / Invalid"
          value={summary.fails}
          accent="red"
          hint="Attention required"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* ================= FILTERS ================ */}
      <div className="fg-panel mb-6 overflow-hidden">
        <div className="fg-panel-header">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-govt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="fg-panel-title">Chain Window Filter</div>
          </div>
          <p className="hidden sm:block text-xs text-muted font-mono">
            Narrow hash chain by sequence range
          </p>
        </div>
        <form
          className="grid gap-4 p-5 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void reload();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="fg-label">From Sequence # (inclusive)</span>
            <input
              type="number"
              min={1}
              className="fg-input font-mono"
              value={fromSeq}
              onChange={(e) => setFromSeq(e.target.value)}
              placeholder="e.g. 1"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="fg-label">To Sequence # (inclusive)</span>
            <input
              type="number"
              min={1}
              className="fg-input font-mono"
              value={toSeq}
              onChange={(e) => setToSeq(e.target.value)}
              placeholder="e.g. 1000"
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="fg-btn-primary flex-1" disabled={loading}>
              Apply Window
            </button>
            <button
              type="button"
              onClick={() => {
                setFromSeq("");
                setToSeq("");
                void reload();
              }}
              className="fg-btn flex-1"
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* ================= VERIFY PANEL ================ */}
      {(verifyLoading || verifyResult) && (
        <div className="fg-panel mb-6 overflow-hidden">
          <div className="fg-panel-header">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-govt-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="fg-panel-title">
                Block Verification {verifySeq !== null && `· Sequence #${verifySeq}`}
              </div>
            </div>
            {verifyResult && (
              <StatusStamp success={verifyResult.valid} />
            )}
          </div>
          <div className="space-y-4 p-5">
            {verifyLoading && (
              <div className="flex items-center gap-2 text-xs text-muted font-mono">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-govt-blue border-t-transparent" />
                <span>Running SHA-256 cryptographic verification…</span>
              </div>
            )}
            {verifyResult && (
              <>
                {verifyResult.broken_at_sequence !== undefined &&
                  verifyResult.broken_at_sequence !== null && (
                    <div className="rounded-md border border-govt-red/30 bg-govt-redLight p-4 text-sm text-govt-red flex items-center gap-3">
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="font-bold uppercase font-mono tracking-wider">Hash Chain Broken</span>
                        <p className="mt-0.5 text-xs">Chain integrity validation failed at Sequence #{verifyResult.broken_at_sequence}. Subsequent entries should be investigated.</p>
                      </div>
                    </div>
                  )}

                <dl className="grid gap-3 sm:grid-cols-2">
                  <Row label="Stored Entry Hash" value={verifyResult.stored_entry_hash} mono />
                  <Row label="Recomputed Hash" value={verifyResult.computed_entry_hash} mono />
                  <Row label="Previous Hash" value={verifyResult.previous_hash} mono />
                  <Row label="Report Hash" value={verifyResult.report_hash} mono />
                </dl>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= CHAIN VISUALIZATION ================ */}
      <div className="fg-panel overflow-hidden">
        {/* ── Panel header ── */}
        <div className="fg-panel-header">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-govt-blueLight text-govt-blue">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 10L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M4.5 11.5a2.121 2.121 0 1 1-3-3L4 6l3 3-2.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M11.5 4.5a2.121 2.121 0 1 1 3 3L12 10 9 7l2.5-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </span>
            <div>
              <div className="fg-panel-title flex items-center gap-2">
                Chain Block Visualization
                <span className="inline-flex items-center gap-1 rounded-full bg-govt-blueLight px-2 py-0.5 text-[10px] font-mono text-govt-navy font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-govt-blue animate-ping" />
                  LIVE HASH CHAIN
                </span>
              </div>
              <div className="text-[11px] text-muted font-mono">
                Immutable SHA-256 linked ledger · {blocks?.length ?? 0} blocks loaded
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Visual Health Indicator */}
            {blocks && blocks.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono border-r border-line pr-3">
                <span className="text-muted">Integrity:</span>
                <span className="font-bold text-govt-green">{integrityPct}%</span>
                <div className="fg-progress-track h-1.5 w-16">
                  <div className="fg-progress-fill bg-govt-green" style={{ width: `${integrityPct}%` }} />
                </div>
              </div>
            )}
            <code className="hidden sm:inline-block rounded-md border border-line bg-field px-2.5 py-1 font-mono text-[10px] text-muted">
              GET /api/v1/ledger/chain
            </code>
          </div>
        </div>

        {/* ── Loading state ── */}
        {loading && !blocks && (
          <div className="flex flex-col items-center gap-3 py-16">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-govt-blue border-t-transparent" />
            <p className="text-xs font-mono text-muted">Loading hash chain blocks…</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && blocks && blocks.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-2xl opacity-40">⛓</span>
            <p className="text-sm font-semibold text-main">No ledger blocks in this window.</p>
            <p className="text-xs text-muted">Execute an operation to generate the initial SHA-256 block.</p>
          </div>
        )}

        {/* ── Chain list ── */}
        {blocks && blocks.length > 0 && (
          <div className="relative p-4 sm:p-6">
            {/* Animated SVG Data Flow Spine Line */}
            <svg
              className="absolute left-[33px] sm:left-[41px] top-8 bottom-8 h-[calc(100%-4rem)] w-1 overflow-visible pointer-events-none"
              aria-hidden="true"
            >
              {/* Base Line */}
              <line x1="0" y1="0" x2="0" y2="100%" stroke="rgb(var(--fg-line))" strokeWidth="2" />
              {/* Animated Glowing Cryptographic Data Stream Line */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                stroke="#005BAC"
                strokeWidth="2"
                strokeDasharray="6 10"
                className="animate-flow-dash opacity-70"
              />
            </svg>

            <ol className="relative space-y-4">
              {blocks.map((b, idx) => {
                const isOpen = expanded === b.sequence_number;
                const verifying = verifySeq === b.sequence_number && verifyLoading;
                const isFirst = idx === 0;
                const isLast = idx === blocks.length - 1;

                /* Per-type left accent border */
                const accentClass =
                  b.operation_type === "DRIVE_ERASE"
                    ? "border-l-govt-blue"
                    : b.operation_type === "FILE_ERASE"
                      ? "border-l-govt-gold"
                      : b.operation_type === "RECOVERY"
                        ? "border-l-typeviolet"
                        : "border-l-slate-400";

                return (
                  <li key={b.sequence_number} className="relative flex gap-3 sm:gap-4">
                    {/* ── Sequence Node ── */}
                    <div className="relative z-10 shrink-0 flex flex-col items-center">
                      <span className={`
                        flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg font-mono text-xs font-bold transition-transform duration-150 hover:scale-105
                        ${isLast
                          ? "bg-govt-blue text-white shadow-xs ring-2 ring-govt-blue/30"
                          : isFirst
                            ? "bg-govt-blueLight text-govt-navy border border-govt-blue/30"
                            : "bg-panel text-main border border-line shadow-xs"
                        }
                      `}>
                        {b.sequence_number}
                      </span>
                    </div>

                    {/* ── Block Card ── */}
                    <div className={`
                      relative flex-1 min-w-0 overflow-hidden rounded-lg border border-line bg-panel
                      border-l-[3px] ${accentClass}
                      shadow-card transition-all duration-200 hover:shadow-card-md
                    `}>
                      {/* Scanning Shimmer Beam overlay during verification */}
                      {verifying && (
                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-lg">
                          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-govt-blue/20 to-transparent animate-scan-shimmer" />
                        </div>
                      )}

                      {/* Card Header */}
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : b.sequence_number)}
                        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left hover:bg-field/50 transition-colors"
                        aria-expanded={isOpen}
                      >
                        {/* Operation type */}
                        <span className="shrink-0">
                          {b.operation_type ? (
                            <OperationTypeTag type={b.operation_type as OperationType} />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                              GENESIS ANCHOR
                            </span>
                          )}
                        </span>

                        {/* Target description */}
                        <span className="flex-1 min-w-0 truncate text-xs sm:text-sm font-medium text-main">
                          {b.target_description || "Chain anchor block"}
                        </span>

                        {/* Cert ID pill */}
                        {b.certificate_id && (
                          <span className="hidden md:inline-flex items-center gap-1 rounded border border-line bg-field px-2 py-0.5 font-mono text-[10px] text-muted hover:border-govt-blue transition-colors">
                            <span className="opacity-60">cert</span>
                            {shortHash(b.certificate_id)}
                          </span>
                        )}

                        {/* Status stamp */}
                        {b.success !== null && (
                          <span className="shrink-0">
                            <StatusStamp success={b.success} />
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="font-mono text-[11px] text-muted whitespace-nowrap">
                          {fmt(b.created_at)}
                        </span>

                        {/* Chevron */}
                        <span
                          className={`ml-1 shrink-0 text-[10px] text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-govt-blue" : ""}`}
                          aria-hidden="true"
                        >
                          ▾
                        </span>
                      </button>

                      {/* ── Expanded Detail Panel ── */}
                      {isOpen && (
                        <div className="border-t border-line bg-field/30 p-4 space-y-4 animate-fadeIn">
                          {/* Animated Cryptographic Hash Flow Diagram */}
                          <HashFlowDiagram
                            prevHash={b.previous_hash}
                            entryHash={b.entry_hash}
                            certId={b.certificate_id}
                            seq={b.sequence_number}
                          />

                          {/* Hash grid */}
                          <div className="grid gap-px bg-line sm:grid-cols-2 rounded-md overflow-hidden border border-line">
                            <HashCell label="Entry Hash (SHA-256)" value={b.entry_hash} accent="blue" />
                            <HashCell label="Previous Chained Hash" value={b.previous_hash} />
                            <HashCell label="Report Hash" value={b.report_hash} />
                            {b.certificate_id && (
                              <HashCell label="Certificate ID" value={b.certificate_id} accent="blue" />
                            )}
                          </div>

                          {/* Footer action bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-panel px-4 py-3 rounded-md border border-line">
                            <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                              <span className="h-1.5 w-1.5 rounded-full bg-govt-blue" />
                              Timestamp: {fmt(b.created_at)}
                            </div>
                            <button
                              type="button"
                              onClick={() => runVerify(b.sequence_number)}
                              disabled={verifying}
                              className="fg-btn-primary !py-1.5 !px-3 text-xs"
                            >
                              {verifying ? (
                                <>
                                  <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                                  Verifying…
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Verify Seq #{b.sequence_number}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HashCell({
  label,
  value,
  accent = "muted",
}: {
  label: string;
  value: string;
  accent?: "blue" | "muted";
}) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${accent === "blue" ? "bg-govt-blue" : "bg-muted/40"}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted font-semibold">
            {label}
          </span>
        </div>
        {value && <CopyButton text={value} />}
      </div>
      <div className="font-mono text-[11px] break-all leading-relaxed text-main select-all font-medium">
        {value || "—"}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="fg-label !mb-0">{label}</div>
        {value && value !== "-" && <CopyButton text={value} />}
      </div>
      <div
        className={
          "break-all text-main font-medium " + (mono ? "font-mono text-[11px]" : "text-xs")
        }
      >
        {value || "-"}
      </div>
    </div>
  );
}
