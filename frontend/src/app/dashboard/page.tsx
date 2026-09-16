"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAnalyticsSummary,
  getAnalyticsTimeseries,
  listJobs,
  UnauthorizedError,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatIndianDateTime } from "@/lib/formatters";
import { AppShell } from "@/components/AppShell";
import type {
  AnalyticsSummary,
  JobOut,
  TaskStatus,
  TimeseriesPoint,
  TopInvestigator,
} from "@/lib/types";
import { useJobSocket } from "@/lib/ws";
import {
  bytesHuman,
  pct,
  InteractiveLineChart,
  OperationTypeDonut,
  IntegrityGauge,
  DataVolumeBarChart,
  DeviceStatusMatrix,
} from "@/components/dashboard/DashboardCharts";

// ---- helpers ---------------------------------------------------------------

function statusBadge(s: TaskStatus): { label: string; cls: string } {
  switch (s) {
    case "PENDING":
      return { label: "Pending", cls: "fg-badge fg-badge--gold" };
    case "CLAIMED":
      return { label: "Claimed", cls: "fg-badge fg-badge--blue" };
    case "RUNNING":
      return { label: "Running", cls: "fg-badge fg-badge--navy" };
    case "COMPLETED":
      return { label: "Completed", cls: "fg-badge fg-badge--green" };
    case "FAILED":
      return { label: "Failed", cls: "fg-badge fg-badge--red" };
    case "CANCELLED":
      return { label: "Cancelled", cls: "fg-badge" };
    default:
      return { label: s, cls: "fg-badge" };
  }
}

// ---- Stat cards with SVG icons ---------------------------------------------

type StatCardDef = {
  label: string;
  value: string;
  hint?: string;
  accent: "navy" | "green" | "red" | "gold" | "blue";
  icon: React.ReactNode;
};

const ACCENT_STYLES: Record<StatCardDef["accent"], { border: string; bg: string; iconBg: string; text: string }> = {
  navy: { border: "border-govt-navy/30", bg: "bg-white", iconBg: "bg-govt-navy/10 text-govt-navy", text: "text-govt-navy" },
  blue: { border: "border-govt-blue/30", bg: "bg-white", iconBg: "bg-govt-blueLight text-govt-blue", text: "text-govt-blue" },
  green: { border: "border-govt-green/30", bg: "bg-white", iconBg: "bg-govt-greenLight text-govt-green", text: "text-govt-green" },
  gold: { border: "border-govt-gold/40", bg: "bg-white", iconBg: "bg-govt-goldLight text-govt-goldDark", text: "text-govt-goldDark" },
  red: { border: "border-govt-red/30", bg: "bg-white", iconBg: "bg-govt-redLight text-govt-red", text: "text-govt-red" },
};

function StatCard({ card }: { card: StatCardDef }) {
  const style = ACCENT_STYLES[card.accent];
  return (
    <div className={`fg-panel overflow-hidden transition-all hover:shadow-md border ${style.border}`}>
      <div className="p-5 flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted font-semibold">
            {card.label}
          </div>
          <div className={`mt-2 font-display text-3xl font-bold tracking-tight ${style.text} tabular-nums`}>
            {card.value}
          </div>
          {card.hint && (
            <div className="mt-1 text-xs text-muted flex items-center gap-1 font-mono">
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{card.hint}</span>
            </div>
          )}
        </div>
        <div className={`shrink-0 p-3 rounded-lg ${style.iconBg}`}>
          {card.icon}
        </div>
      </div>
    </div>
  );
}

// ---- Top investigators + recent jobs ---------------------------------------

function TopInvestigators({ items }: { items: TopInvestigator[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="fg-panel h-full flex flex-col justify-between">
      <div className="fg-panel-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-govt-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div className="fg-panel-title">Top Investigators</div>
        </div>
        <div className="text-xs text-muted">Operations Completed</div>
      </div>
      <div className="divide-y divide-line flex-1">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted">
            No investigators have recorded operations yet.
          </div>
        ) : (
          items.map((inv, idx) => (
            <div
              key={inv.email}
              className="grid grid-cols-[minmax(0,1fr)_60px] items-center gap-3 px-5 py-3.5 hover:bg-field/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-govt-navy text-[10px] font-bold text-white font-mono">
                    #{idx + 1}
                  </span>
                  <div className="truncate font-mono text-xs text-main font-medium">
                    {inv.email}
                  </div>
                </div>
                <div className="mt-2 fg-progress-track h-1.5 rounded-full overflow-hidden">
                  <div
                    className="fg-progress-fill bg-gradient-to-r from-govt-navy to-govt-blue"
                    style={{ width: `${(inv.count / max) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right font-mono text-sm text-govt-navy font-bold">
                {inv.count}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecentJobsList({ jobs: initialJobs }: { jobs: JobOut[] }) {
  const [jobs, setJobs] = useState<JobOut[]>(initialJobs);

  const latestId = jobs[0]?.id ?? null;
  const { lastEvent } = useJobSocket(latestId);

  useEffect(() => {
    if (!lastEvent || !latestId) return;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== latestId) return j;
        return {
          ...j,
          status: (lastEvent.status as TaskStatus) ?? j.status,
          progress_percent: lastEvent.progress_percent ?? j.progress_percent,
          stage: lastEvent.stage ?? j.stage,
          message: lastEvent.message ?? j.message,
          error_message: lastEvent.error_message ?? j.error_message,
          certificate_id: lastEvent.certificate_id ?? j.certificate_id,
        };
      }),
    );
  }, [lastEvent, latestId]);

  return (
    <div className="fg-panel">
      <div className="fg-panel-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-govt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div className="fg-panel-title">Recent Jobs & Live Activity Queue</div>
        </div>
        <Link href="/dashboard/jobs" className="text-xs font-semibold text-govt-blue hover:underline flex items-center gap-1">
          View all jobs →
        </Link>
      </div>
      {jobs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted">
          No jobs have been scheduled yet.
        </div>
      ) : (
        <div className="divide-y divide-line">
          {jobs.slice(0, 6).map((j) => {
            const badge = statusBadge(j.status);
            return (
              <Link
                key={j.id}
                href={`/dashboard/jobs/${j.id}`}
                className="block px-5 py-3.5 hover:bg-field/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`${badge.cls}`}>{badge.label}</span>
                      <span className="truncate font-mono text-[11px] text-muted font-medium">
                        {j.job_number}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-main">
                      {j.title || `${j.operation_type} job`}
                    </div>
                    <div className="mt-1 line-clamp-1 font-mono text-[11px] text-muted">
                      {j.stage || j.message || formatIndianDateTime(j.created_at)}
                    </div>
                  </div>
                  <div className="w-36 shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-govt-navy">
                      {j.status === "COMPLETED" ? 100 : j.progress_percent}%
                    </div>
                    <div className="mt-1.5 fg-progress-track h-2 rounded-xs overflow-hidden">
                      <div
                        className="fg-progress-fill bg-govt-navy transition-all duration-300"
                        style={{ width: `${j.status === "COMPLETED" ? 100 : j.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ModuleCardProps = {
  code: string;
  title: string;
  description: string;
  accent: string;
  href: string;
  action: string;
  jobs: JobOut[];
  capabilities: string[];
  icon: React.ReactNode;
};

function ModuleCard({
  code,
  title,
  description,
  accent,
  href,
  action,
  jobs,
  capabilities,
  icon,
}: ModuleCardProps) {
  const activeJobs = jobs.filter(
    (job) => job.status === "PENDING" || job.status === "CLAIMED" || job.status === "RUNNING",
  ).length;
  const completedJobs = jobs.filter((job) => job.status === "COMPLETED").length;

  return (
    <article className="fg-panel flex h-full flex-col overflow-hidden transition-all hover:border-govt-navy/40 hover:shadow-md">
      <div className={`h-1.5 ${accent}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-field border border-line text-govt-navy">
              {icon}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted font-semibold">{code}</div>
              <h3 className="mt-0.5 font-display text-xl font-bold text-main">{title}</h3>
            </div>
          </div>
          <span className="inline-flex h-8 px-2.5 items-center justify-center rounded bg-govt-blueLight font-mono text-xs font-bold text-govt-navy">
            {activeJobs > 0 ? `${activeJobs} Active` : "Idle"}
          </span>
        </div>
        <p className="mt-3 min-h-[3.2rem] text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 border-y border-line py-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-medium">Active Jobs</div>
            <div className="mt-1 font-display text-lg font-bold text-govt-navy">{activeJobs}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-medium">Completed</div>
            <div className="mt-1 font-display text-lg font-bold text-govt-green">{completedJobs}</div>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
          {capabilities.map((capability) => (
            <li key={capability} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-govt-gold" />
              <span>{capability}</span>
            </li>
          ))}
        </ul>
        <Link href={href} className="fg-btn-primary mt-6 w-full justify-center text-xs font-bold !py-2.5">
          {action} <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

// ---- Page Component ---------------------------------------------------------

export default function DashboardHome() {
  const router = useRouter();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [metric, setMetric] = useState<"operations" | "successes" | "failures" | "recoveries" | "erases">("operations");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void (async () => {
      try {
        const [s, t, j] = await Promise.all([
          getAnalyticsSummary(),
          getAnalyticsTimeseries({ metric, range: "30d" }),
          listJobs({ limit: 20 }),
        ]);
        setSummary(s);
        setTimeseries(t);
        setJobs(j);
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          router.push("/login");
          return;
        }
        setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, [router, metric]);

  const statCards = useMemo<StatCardDef[]>(() => {
    const s = summary;
    if (!s) {
      return [
        { label: "Recovered files", value: "—", accent: "navy", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: "Recovered data", value: "—", accent: "blue", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg> },
        { label: "Today's operations", value: "—", accent: "gold", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        { label: "Total devices", value: "—", accent: "navy", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: "Success rate", value: "—", accent: "green", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: "Failure rate", value: "—", accent: "red", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: "Storage sanitized", value: "—", accent: "navy", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> },
      ];
    }
    return [
      {
        label: "Recovered files",
        value: s.recovered_files_count.toLocaleString(),
        accent: "navy",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      },
      {
        label: "Recovered data",
        value: bytesHuman(s.recovered_data_size_bytes),
        accent: "blue",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>,
      },
      {
        label: "Today's operations",
        value: s.operations_today_count.toLocaleString(),
        hint: "UTC day boundary",
        accent: "gold",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      },
      {
        label: "Total devices",
        value: s.devices_total.toLocaleString(),
        hint: "Inventory tracked",
        accent: "navy",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      },
      {
        label: "Success rate",
        value: pct(s.success_rate_pct),
        accent: "green",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      },
      {
        label: "Failure rate",
        value: pct(s.failure_rate_pct),
        accent: "red",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      },
      {
        label: "Storage sanitized",
        value: bytesHuman(s.storage_sanitized_bytes),
        hint: "Drive & File Sanitization",
        accent: "navy",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      },
    ];
  }, [summary]);

  return (
    <AppShell
      eyebrow="Command Console"
      title="Dashboard"
      subtitle="Platform operations telemetry, interactive analytical distributions, cryptographic ledger health, and task queue monitoring."
    >
      {/* Top Banner / Quick Action Command Bar */}
      <div className="mb-6 rounded-xl border border-govt-navy/20 bg-gradient-to-r from-[#051329] via-[#0B2D4D] to-[#07172B] p-5 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-govt-gold font-bold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-govt-green animate-pulse" />
            <span>NIST SP 800-88 REV. 2 COMPLIANT · LIVE SYSTEM OPERATIONAL</span>
          </div>
          <h2 className="text-xl font-bold font-display text-white">
            National Technical Research Organisation (NTRO) Forensics Hub
          </h2>
          <p className="text-xs text-white/75">
            Tamper-resistant storage sanitization, file recovery engine, and SHA-256 hash-chain verification.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link
            href="/dashboard/cases/new"
            className="px-3.5 py-2 rounded-lg bg-govt-gold hover:bg-yellow-500 text-govt-navy font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>+ New Case</span>
          </Link>
          <Link
            href="/dashboard/drive-eraser"
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
          >
            <span>+ Drive Eraser</span>
          </Link>
          <Link
            href="/dashboard/recovery"
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
          >
            <span>+ Recovery</span>
          </Link>
        </div>
      </div>

      {err && (
        <div className="mb-6 rounded-md border border-govt-red/30 bg-govt-redLight px-4 py-3 text-sm text-govt-red">
          {err}
        </div>
      )}

      {/* Stat cards */}
      <section aria-labelledby="stats-heading" className="mb-6">
        <h2 id="stats-heading" className="sr-only">
          Key statistics
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map((c) => (
            <StatCard key={c.label} card={c} />
          ))}
        </div>
      </section>

      {/* Graphical Data Visualizations Grid 1: Interactive Line Chart + Module Donut */}
      <section aria-labelledby="visualizations-heading" className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <h2 id="visualizations-heading" className="sr-only">
          Analytics & Visual Data
        </h2>
        <div className="lg:col-span-2">
          <InteractiveLineChart
            data={timeseries}
            title="Operations Telemetry — Rolling 30-Day Trend"
            currentMetric={metric}
            onMetricChange={setMetric}
          />
        </div>
        <div>
          <OperationTypeDonut summary={summary} />
        </div>
      </section>

      {/* Graphical Data Visualizations Grid 2: Integrity Gauge, Data Volume Bar, Fleet Matrix */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <IntegrityGauge summary={summary} />
        <DataVolumeBarChart summary={summary} />
        <DeviceStatusMatrix summary={summary} />
      </section>

      {/* Modules section */}
      <section aria-labelledby="modules-heading" className="mb-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted font-semibold">Choose Module</div>
            <h2 id="modules-heading" className="mt-1 font-display text-2xl font-bold text-main">
              Forensic Operations Center
            </h2>
          </div>
          <Link href="/dashboard/jobs" className="text-xs font-semibold text-govt-blue hover:underline">
            Open job queue →
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ModuleCard
            code="01 / RECOVERY"
            title="Recovery Engine"
            description="Carve, classify, verify, and preserve recovered files as case-linked evidence."
            accent="bg-typeviolet"
            href="/dashboard/recovery"
            action="Start recovery job"
            jobs={jobs.filter((job) => job.operation_type === "RECOVERY")}
            capabilities={["Quick or deep scan", "Evidence integrity"]}
            icon={<svg className="w-5 h-5 text-typeviolet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <ModuleCard
            code="02 / FILE ERASE"
            title="File & Folder Eraser"
            description="Sanitise selected content with overwrite passes, metadata scrubbing, and verification."
            accent="bg-amber"
            href="/dashboard/file-eraser"
            action="Start erase job"
            jobs={jobs.filter((job) => job.operation_type === "FILE_ERASE")}
            capabilities={["N-pass overwrite", "Free-space cleanse"]}
            icon={<svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
          />
          <ModuleCard
            code="03 / DRIVE ERASE"
            title="Drive Eraser"
            description="Manage full-media sanitisation with device-aware methods and read-back verification."
            accent="bg-typeblue"
            href="/dashboard/drive-eraser"
            action="Start drive wipe"
            jobs={jobs.filter((job) => job.operation_type === "DRIVE_ERASE")}
            capabilities={["Clear, purge, crypto", "Read-back verify"]}
            icon={<svg className="w-5 h-5 text-typeblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
        </div>
      </section>

      {/* Top Investigators & Recent Jobs */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopInvestigators items={summary?.top_investigators_by_ops ?? []} />
        <div className="lg:col-span-2">
          <RecentJobsList jobs={jobs} />
        </div>
      </section>
    </AppShell>
  );
}
