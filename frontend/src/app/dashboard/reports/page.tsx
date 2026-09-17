"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOperation,
  downloadCertificatesCsv,
  getCertificatesCsvDownloadUrl,
  getCertificateReportPdfUrl,
  openCertificatePdf,
  listAuditReport,
  listCertificatesReport,
  listMonthlyReport,
  listRecoveryReport,
  UnauthorizedError,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  MonthlyReportBucket,
  MonthlyReportOut,
  OperationType,
  ReportCertificateRow,
  ReportListOut,
} from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { OperationTypeTag, StatusStamp } from "@/components/OperationBadges";
import { formatIndianDateTime } from "@/lib/formatters";

type ReportTab = "certificates" | "recovery" | "audit" | "monthly";

const TABS: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
  {
    key: "certificates",
    label: "Certificates",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    key: "recovery",
    label: "Recovery Reports",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    key: "audit",
    label: "Audit Reports",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: "monthly",
    label: "Monthly Summaries",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

function fmtShort(ts: string | null | undefined): string {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function shortHash(h: string): string {
  if (!h || h.length < 12) return h ?? "-";
  return `${h.slice(0, 6)}…${h.slice(-6)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className="inline-flex items-center gap-0.5 rounded border border-line bg-field px-1 py-0.5 text-[9px] font-mono text-muted transition hover:bg-panel hover:text-main hover:border-govt-blue"
    >
      {copied ? (
        <svg className="w-2.5 h-2.5 text-govt-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

type StatCardDef = {
  label: string;
  value: string | number;
  accent: "navy" | "blue" | "green" | "red" | "gold";
  icon: React.ReactNode;
  hint?: string;
};

const ACCENT_STYLES: Record<StatCardDef["accent"], { border: string; iconBg: string; text: string }> = {
  navy: { border: "border-govt-navy/20", iconBg: "bg-govt-navy/10 text-govt-navy", text: "text-govt-navy" },
  blue: { border: "border-govt-blue/20", iconBg: "bg-govt-blueLight text-govt-blue", text: "text-govt-blue" },
  green: { border: "border-govt-green/20", iconBg: "bg-govt-greenLight text-govt-green", text: "text-govt-green" },
  red: { border: "border-govt-red/20", iconBg: "bg-govt-redLight text-govt-red", text: "text-govt-red" },
  gold: { border: "border-govt-gold/40", iconBg: "bg-govt-goldLight text-govt-goldDark", text: "text-govt-goldDark" },
};

function StatCard({ label, value, accent, icon, hint }: StatCardDef) {
  const style = ACCENT_STYLES[accent];
  return (
    <div className={`fg-panel overflow-hidden transition-all hover:shadow-card-md border ${style.border} bg-panel`}>
      <div className="p-3.5 sm:p-4 flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-semibold">
            {label}
          </div>
          <div className={`mt-1 font-display text-2xl font-bold tracking-tight ${style.text} tabular-nums`}>
            {value}
          </div>
          {hint && (
            <div className="mt-0.5 text-[11px] text-muted flex items-center gap-1 font-mono">
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{hint}</span>
            </div>
          )}
        </div>
        <div className={`shrink-0 p-2.5 rounded-lg ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ReportCenterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ReportTab>("certificates");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // filter params
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [operator, setOperator] = useState("");
  const [success, setSuccess] = useState<"all" | "success" | "fail">("all");

  // monthly filter
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));

  // state per tab
  const [certList, setCertList] = useState<ReportListOut | null>(null);
  const [recList, setRecList] = useState<ReportListOut | null>(null);
  const [audList, setAudList] = useState<ReportListOut | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReportOut | null>(null);

  async function reloadCertificates() {
    setLoading(true);
    setError(null);
    try {
      const r = await listCertificatesReport({
        from: fromDate || undefined,
        to: toDate || undefined,
        operator_email: operator || undefined,
        success: success === "all" ? undefined : success === "success",
        limit: 200,
      });
      setCertList(r);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load certificates report");
    } finally {
      setLoading(false);
    }
  }

  async function reloadRecovery() {
    setLoading(true);
    setError(null);
    try {
      const r = await listRecoveryReport({
        from: fromDate || undefined,
        to: toDate || undefined,
        operator_email: operator || undefined,
        success: success === "all" ? undefined : success === "success",
        limit: 200,
      });
      setRecList(r);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load recovery report");
    } finally {
      setLoading(false);
    }
  }

  async function reloadAudit() {
    setLoading(true);
    setError(null);
    try {
      const r = await listAuditReport({
        from: fromDate || undefined,
        to: toDate || undefined,
        operator_email: operator || undefined,
        success: success === "all" ? undefined : success === "success",
        limit: 200,
      });
      setAudList(r);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load audit report");
    } finally {
      setLoading(false);
    }
  }

  async function reloadMonthly() {
    setLoading(true);
    setError(null);
    try {
      const r = await listMonthlyReport({
        year: Number(year) || undefined,
        month: Number(month) || undefined,
      });
      setMonthly(r);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  }

  function runTab() {
    if (tab === "certificates") void reloadCertificates();
    else if (tab === "recovery") void reloadRecovery();
    else if (tab === "audit") void reloadAudit();
    else void reloadMonthly();
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;
    runTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleDeleteOperation(certificateId: string) {
    if (!window.confirm("Are you sure you want to permanently delete this operation record?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteOperation(certificateId);
      runTab();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete operation record");
      setLoading(false);
    }
  }

  async function downloadCsv() {
    setLoading(true);
    setError(null);
    try {
      await downloadCertificatesCsv({
        from: fromDate || undefined,
        to: toDate || undefined,
        operator_email: operator || undefined,
        success: success === "all" ? undefined : success === "success",
      });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to download CSV report");
    } finally {
      setLoading(false);
    }
  }

  const activeRows = useMemo(() => {
    if (tab === "certificates") return certList?.items;
    if (tab === "recovery") return recList?.items;
    if (tab === "audit") return audList?.items;
    return undefined;
  }, [tab, certList, recList, audList]);

  const activeTotal = useMemo(() => {
    if (tab === "certificates") return certList?.total ?? 0;
    if (tab === "recovery") return recList?.total ?? 0;
    if (tab === "audit") return audList?.total ?? 0;
    if (tab === "monthly") return monthly?.count ?? 0;
    return 0;
  }, [tab, certList, recList, audList, monthly]);

  const successCount = useMemo(() => {
    if (!activeRows) return 0;
    return activeRows.filter((r) => r.success).length;
  }, [activeRows]);

  const integrityPct = useMemo(() => {
    if (!activeRows || activeRows.length === 0) return 100;
    return Math.round((successCount / activeRows.length) * 100);
  }, [activeRows, successCount]);

  return (
    <AppShell
      eyebrow="Reporting & Compliance"
      title="Report Center"
      subtitle="Signed PDF certificates, recovery reports, audit trails, and monthly summaries."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {tab === "certificates" && (
            <button type="button" onClick={downloadCsv} className="fg-btn !py-1.5 !px-3 text-xs">
              <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
          <Link href="/dashboard/ledger" className="fg-btn !py-1.5 !px-3 text-xs">
            <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            </svg>
            Chain Ledger
          </Link>
          <Link href="/dashboard/audit" className="fg-btn-primary !py-1.5 !px-3 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Audit Log
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-govt-red/25 bg-govt-redLight px-4 py-3 text-sm text-govt-red flex items-center justify-between">
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
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Records"
          value={activeTotal}
          accent="navy"
          hint="Matching filter"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Verified Success"
          value={successCount}
          accent="green"
          hint={`${integrityPct}% pass rate`}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Module"
          value={tab.toUpperCase()}
          accent="blue"
          hint="Report View Mode"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
            </svg>
          }
        />
        <StatCard
          label="Compliance Seal"
          value="ISO 27037"
          accent="gold"
          hint="Custody valid"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* ============== TABS & MAIN PANEL ============== */}
      <div className="fg-panel mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b border-line bg-field/30 px-2 pt-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={
                  "flex items-center gap-1.5 rounded-t-md px-3.5 py-2 text-xs font-semibold transition-all duration-150 " +
                  (active
                    ? "bg-panel text-govt-navy border-t-2 border-x border-b-transparent border-t-govt-blue border-line shadow-xs font-bold"
                    : "text-muted hover:text-main hover:bg-panel/50")
                }
              >
                <span className={active ? "text-govt-blue" : "text-muted"}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ============== FILTERS (certificates / recovery / audit) ============== */}
        {tab !== "monthly" && (
          <form
            className="grid gap-3 border-b border-line p-3.5 sm:p-4 md:grid-cols-4 bg-panel text-xs"
            onSubmit={(e) => {
              e.preventDefault();
              runTab();
            }}
          >
            <label className="flex flex-col gap-1 text-xs">
              <span className="fg-label !mb-0">From Date</span>
              <input type="date" className="fg-input !py-1.5 text-xs" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="fg-label !mb-0">To Date</span>
              <input type="date" className="fg-input !py-1.5 text-xs" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="fg-label !mb-0">Operator Email</span>
              <input
                type="text"
                className="fg-input !py-1.5 text-xs"
                placeholder="officer@ntro.gov.in"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-1 justify-end text-xs">
              <span className="fg-label !mb-0">Outcome</span>
              <div className="flex items-center gap-1.5">
                <select
                  className="fg-input !py-1.5 text-xs flex-1"
                  value={success}
                  onChange={(e) => setSuccess(e.target.value as typeof success)}
                >
                  <option value="all">All Records</option>
                  <option value="success">Success Only</option>
                  <option value="fail">Failures Only</option>
                </select>
                <button type="submit" className="fg-btn-primary !py-1.5 !px-3 text-xs" disabled={loading}>
                  {loading ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ============== FILTERS (monthly) ============== */}
        {tab === "monthly" && (
          <form
            className="grid gap-3 border-b border-line p-3.5 sm:p-4 md:grid-cols-3 bg-panel text-xs"
            onSubmit={(e) => {
              e.preventDefault();
              void reloadMonthly();
            }}
          >
            <label className="flex flex-col gap-1 text-xs">
              <span className="fg-label !mb-0">Year</span>
              <input
                type="number"
                min={2020}
                max={2100}
                className="fg-input !py-1.5 font-mono text-xs"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="fg-label !mb-0">Month (1–12)</span>
              <input
                type="number"
                min={1}
                max={12}
                className="fg-input !py-1.5 font-mono text-xs"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="fg-btn-primary flex-1 !py-1.5 text-xs" disabled={loading}>
                {loading ? "Generating…" : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setYear(String(new Date().getFullYear()));
                  setMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
                  setTimeout(() => reloadMonthly(), 0);
                }}
                className="fg-btn flex-1 !py-1.5 text-xs"
                disabled={loading}
              >
                Current Month
              </button>
            </div>
          </form>
        )}

        {/* ============== TAB ACTION BAR ============== */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-field/40 border-b border-line text-xs">
          <div className="font-mono text-[11px] text-muted font-medium flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-govt-blue" />
            {tab === "certificates" && certList && `Total: ${certList.total} certificates matching filter`}
            {tab === "recovery" && recList && `Total: ${recList.total} recovery operations`}
            {tab === "audit" && audList && `Total: ${audList.total} audit trail entries`}
            {tab === "monthly" && monthly && `Monthly Buckets: ${monthly.count}`}
            {loading && !certList && !recList && !audList && !monthly && "Fetching data…"}
          </div>
          <div className="flex items-center gap-1.5">
            {tab === "certificates" && (
              <button type="button" onClick={() => void downloadCsv()} disabled={loading} className="fg-btn !py-1 !px-2.5 text-xs">
                <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
            )}
            <Link href="/dashboard/ledger" className="fg-btn !py-1 !px-2.5 text-xs">
              Ledger
            </Link>
            <Link href="/dashboard/audit" className="fg-btn-primary !py-1 !px-2.5 text-xs">
              Audit
            </Link>
          </div>
        </div>

        {/* ============== CERTIFICATES / RECOVERY / AUDIT TABLES ============== */}
        {tab !== "monthly" && (
          <ReportTable
            loading={loading}
            rows={
              tab === "certificates"
                ? certList?.items
                : tab === "recovery"
                  ? recList?.items
                  : audList?.items
            }
            onDelete={(certId) => void handleDeleteOperation(certId)}
          />
        )}

        {/* ============== MONTHLY ============== */}
        {tab === "monthly" && <MonthlyView buckets={monthly?.buckets ?? []} />}
      </div>
    </AppShell>
  );
}

function ReportTable({
  rows,
  loading,
  onDelete,
}: {
  rows: ReportCertificateRow[] | undefined;
  loading: boolean;
  onDelete?: (certificateId: string) => void;
}) {
  if (loading && !rows) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-govt-blue border-t-transparent" />
        <p className="text-xs font-mono text-muted">Loading report records…</p>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-2xl opacity-40">📄</span>
        <p className="text-sm font-semibold text-main">No records matched the selected filters.</p>
        <p className="text-xs text-muted">Adjust date range or officer filter above.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="fg-table w-full text-xs">
        <thead>
          <tr>
            <th className="!px-2.5 !py-2">Certificate ID</th>
            <th className="!px-2.5 !py-2">Operation</th>
            <th className="!px-2.5 !py-2">Target</th>
            <th className="!px-2.5 !py-2">Operator</th>
            <th className="!px-2.5 !py-2">Execution Window</th>
            <th className="!px-2.5 !py-2 text-center">Seq</th>
            <th className="!px-2.5 !py-2">Outcome</th>
            <th className="!px-2.5 !py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.certificate_id} className="hover:bg-field/50 transition-colors">
              {/* Cert ID with Copy Button */}
              <td className="!px-2.5 !py-2 font-mono text-xs font-semibold text-govt-blue whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span title={r.certificate_id}>{shortHash(r.certificate_id)}</span>
                  <CopyButton text={r.certificate_id} />
                </div>
              </td>

              {/* Operation type tag */}
              <td className="!px-2.5 !py-2 whitespace-nowrap">
                <OperationTypeTag type={r.operation_type as OperationType} />
              </td>

              {/* Target Description */}
              <td className="!px-2.5 !py-2 text-xs font-medium text-main max-w-[140px] xl:max-w-[200px] truncate" title={r.target_description}>
                {r.target_description || "—"}
              </td>

              {/* Operator */}
              <td className="!px-2.5 !py-2 font-mono text-[11px] text-main whitespace-nowrap">
                <div className="inline-flex items-center gap-1 rounded bg-field border border-line px-1.5 py-0.5 max-w-[130px] truncate" title={r.operator}>
                  <span className="h-1.5 w-1.5 rounded-full bg-govt-navy shrink-0" />
                  <span className="truncate">{r.operator}</span>
                </div>
              </td>

              {/* Compact Timestamps */}
              <td className="!px-2.5 !py-2 text-[11px] text-muted font-mono whitespace-nowrap">
                <div>{fmtShort(r.started_at)}</div>
                <div className="text-[10px] text-muted/70">→ {fmtShort(r.completed_at)}</div>
              </td>

              {/* Ledger Sequence */}
              <td className="!px-2.5 !py-2 text-center font-mono text-xs whitespace-nowrap">
                <span className="inline-block rounded bg-govt-blueLight border border-govt-blue/30 px-1.5 py-0.5 text-govt-navy font-bold">
                  #{r.ledger_sequence_number}
                </span>
              </td>

              {/* Status stamp */}
              <td className="!px-2.5 !py-2 whitespace-nowrap">
                <StatusStamp success={r.success} />
              </td>

              {/* Compact Actions */}
              <td className="!px-2.5 !py-2 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => void openCertificatePdf(r.certificate_id)}
                    className="fg-btn-primary !px-2 !py-0.5 text-[10px] flex items-center gap-0.5"
                    title="View / Download PDF Certificate"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(r.certificate_id)}
                      className="rounded border border-govt-red/30 bg-govt-redLight px-1.5 py-0.5 text-[10px] font-medium text-govt-red hover:bg-govt-red hover:text-white transition-colors"
                      title="Delete operation record"
                    >
                      Del
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyView({ buckets }: { buckets: MonthlyReportBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-2xl opacity-40">📊</span>
        <p className="text-sm font-semibold text-main">No monthly buckets available for this period.</p>
        <p className="text-xs text-muted">Try selecting a different year or month range above.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-3 sm:p-4">
      <table className="fg-table w-full text-xs">
        <thead>
          <tr>
            <th className="!px-2.5 !py-2">Period</th>
            <th className="!px-2.5 !py-2 text-center">Total Ops</th>
            <th className="!px-2.5 !py-2 text-center">Drive Erase</th>
            <th className="!px-2.5 !py-2 text-center">File Erase</th>
            <th className="!px-2.5 !py-2 text-center">Recoveries</th>
            <th className="!px-2.5 !py-2 text-center">Success</th>
            <th className="!px-2.5 !py-2 text-center">Failures</th>
            <th className="!px-2.5 !py-2 text-right">Success Rate</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => {
            const rate = b.operations_total
              ? Math.round((b.successes / b.operations_total) * 10000) / 100
              : 0;
            return (
              <tr key={`${b.year}-${b.month}`} className="hover:bg-field/50 transition-colors">
                <td className="!px-2.5 !py-2 font-mono text-xs font-bold text-govt-navy">
                  {b.year}-{String(b.month).padStart(2, "0")}
                </td>
                <td className="!px-2.5 !py-2 text-center font-mono text-xs font-bold text-main">{b.operations_total}</td>
                <td className="!px-2.5 !py-2 text-center font-mono text-xs text-main">{b.drive_erases}</td>
                <td className="!px-2.5 !py-2 text-center font-mono text-xs text-main">{b.file_erases}</td>
                <td className="!px-2.5 !py-2 text-center font-mono text-xs text-main">{b.recoveries}</td>
                <td className="!px-2.5 !py-2 text-center">
                  <span className="fg-badge fg-badge--green">{b.successes}</span>
                </td>
                <td className="!px-2.5 !py-2 text-center">
                  <span className="fg-badge fg-badge--red">{b.failures}</span>
                </td>
                <td className="!px-2.5 !py-2 text-right font-mono text-xs font-bold text-main">
                  <div className="flex items-center justify-end gap-2">
                    <div className="fg-progress-track h-1.5 w-12 hidden sm:block">
                      <div className="fg-progress-fill bg-govt-green" style={{ width: `${rate}%` }} />
                    </div>
                    <span>{rate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
