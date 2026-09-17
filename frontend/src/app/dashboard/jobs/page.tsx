"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  cancelJob,
  ConflictError,
  createJob,
  deleteJob,
  listCases,
  listDevices,
  listJobs,
  retryJob,
  UnauthorizedError,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { CaseSummary, DeviceOut, JobOut, JobCreateIn, OperationType, TaskStatus } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import {
  JOB_FILTERS,
  JOB_PAYLOAD_TEMPLATES,
  JobRow,
} from "@/components/jobs/JobUI";

type Notice = { tone: "error" | "success"; text: string } | null;

const OPERATION_OPTIONS: Array<{ value: OperationType; label: string }> = [
  { value: "DRIVE_ERASE", label: "Drive Erase" },
  { value: "FILE_ERASE", label: "File / Folder Erase" },
  { value: "RECOVERY", label: "Recovery" },
];

function getDefaultTitle(operationType: OperationType): string {
  return OPERATION_OPTIONS.find((item) => item.value === operationType)?.label ?? operationType;
}

type StatCardDef = {
  label: string;
  value: number;
  accent: "navy" | "gold" | "blue" | "green";
  icon: React.ReactNode;
  hint?: string;
};

const ACCENT_STYLES: Record<StatCardDef["accent"], { border: string; iconBg: string; text: string }> = {
  navy: { border: "border-govt-navy/20", iconBg: "bg-govt-navy/10 text-govt-navy", text: "text-govt-navy" },
  gold: { border: "border-govt-gold/40", iconBg: "bg-govt-goldLight text-govt-goldDark", text: "text-govt-goldDark" },
  blue: { border: "border-govt-blue/20", iconBg: "bg-govt-blueLight text-govt-blue", text: "text-govt-blue" },
  green: { border: "border-govt-green/20", iconBg: "bg-govt-greenLight text-govt-green", text: "text-govt-green" },
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

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [devices, setDevices] = useState<DeviceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "ALL">("ALL");

  const [operationType, setOperationType] = useState<OperationType>("DRIVE_ERASE");
  const [title, setTitle] = useState(getDefaultTitle("DRIVE_ERASE"));
  const [caseId, setCaseId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [payloadText, setPayloadText] = useState(JOB_PAYLOAD_TEMPLATES.DRIVE_ERASE);

  async function loadData(nextStatus: TaskStatus | "ALL" = selectedStatus) {
    try {
      const [jobRows, caseRows, deviceRows] = await Promise.all([
        listJobs({ status: nextStatus === "ALL" ? undefined : nextStatus, limit: 100 }),
        listCases(),
        listDevices({ limit: 100 }),
      ]);
      setJobs(jobRows);
      setCases(caseRows);
      setDevices(deviceRows);
      setNotice(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Failed to load task queue data.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void loadData();
  }, [router]);

  useEffect(() => {
    const requestedType = new URLSearchParams(window.location.search).get("operation");
    const requestedDevice = new URLSearchParams(window.location.search).get("device");
    if (requestedType === "DRIVE_ERASE" || requestedType === "FILE_ERASE" || requestedType === "RECOVERY") {
      handleOperationChange(requestedType);
    }
    if (requestedDevice) {
      setDeviceId(requestedDevice);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setRefreshing(true);
      void loadData(selectedStatus);
    }
  }, [selectedStatus]);

  const pendingCount = useMemo(
    () => jobs.filter((job) => job.status === "PENDING" || job.status === "CLAIMED" || job.status === "RUNNING").length,
    [jobs],
  );

  async function handleCreateJob(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);
    try {
      const payloadJson = JSON.parse(payloadText) as Record<string, unknown>;
      const request: JobCreateIn = {
        operation_type: operationType,
        title: title.trim() || getDefaultTitle(operationType),
        payload: payloadJson,
        case_id: caseId || null,
        device_id: deviceId || null,
      };
      const created = await createJob(request);
      setNotice({ tone: "success", text: `Job ${created.job_number} created successfully.` });
      await loadData(selectedStatus);
      router.push(`/dashboard/jobs/${created.id}`);
    } catch (err) {
      setNotice({
        tone: "error",
        text: err instanceof SyntaxError
          ? "Payload must be valid JSON."
          : err instanceof Error
            ? err.message
            : "Failed to create job.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(jobId: string) {
    setBusyJobId(jobId);
    setNotice(null);
    try {
      await cancelJob(jobId);
      setNotice({ tone: "success", text: "Job cancelled successfully." });
      await loadData(selectedStatus);
    } catch (err) {
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Failed to cancel job.",
      });
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleRetry(jobId: string) {
    setBusyJobId(jobId);
    setNotice(null);
    try {
      const retried = await retryJob(jobId);
      setNotice({ tone: "success", text: `New retry job ${retried.job_number} created.` });
      await loadData(selectedStatus);
    } catch (err) {
      const text =
        err instanceof ConflictError
          ? "This job cannot be retried in its current state."
          : err instanceof Error
            ? err.message
            : "Failed to retry job.";
      setNotice({ tone: "error", text });
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDelete(jobId: string) {
    if (!window.confirm("Are you sure you want to permanently delete this job record?")) return;
    setBusyJobId(jobId);
    setNotice(null);
    try {
      await deleteJob(jobId);
      setNotice({ tone: "success", text: "Job record permanently deleted." });
      await loadData(selectedStatus);
    } catch (err) {
      setNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Failed to delete job.",
      });
    } finally {
      setBusyJobId(null);
    }
  }

  function handleOperationChange(nextType: OperationType) {
    setOperationType(nextType);
    if (!title.trim() || title === getDefaultTitle(operationType)) {
      setTitle(getDefaultTitle(nextType));
    }
    setPayloadText(JOB_PAYLOAD_TEMPLATES[nextType]);
  }

  return (
    <AppShell
      eyebrow="Task Queue"
      title="Operational Job Orchestration"
      subtitle="Create, review, and supervise dashboard-driven forensic jobs while keeping the existing CLI execution model intact."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadData(selectedStatus);
            }}
            className="fg-btn !py-1.5 !px-3 text-xs"
            disabled={refreshing}
          >
            <svg className={`w-3.5 h-3.5 text-muted ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Queue
          </button>
          <Link href="/dashboard/devices" className="fg-btn !py-1.5 !px-3 text-xs">
            <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Device Inventory
          </Link>
        </div>
      }
    >
      {notice && (
        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm flex items-center justify-between ${
            notice.tone === "error"
              ? "border-govt-red/25 bg-govt-redLight text-govt-red"
              : "border-govt-green/25 bg-govt-greenLight text-govt-green"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {notice.tone === "error" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              )}
            </svg>
            <span>{notice.text}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* ================= TOP STAT CARDS ================ */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Jobs"
          value={jobs.length}
          accent="navy"
          hint="Filtered queue entries"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Active Pipeline"
          value={pendingCount}
          accent="gold"
          hint="Pending, claimed & running"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          label="Linked Assets"
          value={cases.length + devices.length}
          accent="blue"
          hint={`${cases.length} cases · ${devices.length} devices`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      </div>

      {/* ================= CREATE JOB FORM ================ */}
      <section className="mb-6">
        <div className="fg-panel">
          <div className="fg-panel-header">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-govt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <div className="fg-panel-title">Create Operational Job</div>
            </div>
            <div className="text-xs text-muted font-mono">Dashboard-driven queue creation</div>
          </div>
          <form className="space-y-4 p-5" onSubmit={handleCreateJob}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="fg-label" htmlFor="operation-type">Operation Type</label>
                <select
                  id="operation-type"
                  value={operationType}
                  onChange={(e) => handleOperationChange(e.target.value as OperationType)}
                  className="fg-input"
                >
                  {OPERATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="fg-label" htmlFor="job-title">Job Title</label>
                <input
                  id="job-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="fg-input"
                  placeholder="Case-linked drive wipe"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="fg-label" htmlFor="job-case">Case Linkage</label>
                <select
                  id="job-case"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="fg-input"
                >
                  <option value="">No case linkage</option>
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.case_number} - {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="fg-label" htmlFor="job-device">Device Linkage</label>
                <select
                  id="job-device"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="fg-input"
                >
                  <option value="">No device linkage</option>
                  {devices.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.serial_number} - {item.manufacturer} {item.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="fg-label !mb-0" htmlFor="payload-json">Payload JSON</label>
                <button
                  type="button"
                  onClick={() => setPayloadText(JOB_PAYLOAD_TEMPLATES[operationType])}
                  className="text-xs font-medium text-govt-blue hover:underline font-mono"
                >
                  Reset Template
                </button>
              </div>
              <textarea
                id="payload-json"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={7}
                spellCheck={false}
                className="fg-input min-h-[160px] font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
              <p className="max-w-md text-xs text-muted">
                Queue records are orchestration metadata only. CLI report submission and certificate signing remain unchanged.
              </p>
              <button type="submit" disabled={submitting} className="fg-btn-primary">
                {submitting ? "Creating Job..." : "+ Queue Job"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ================= QUEUE REGISTER TABLE ================ */}
      <section className="fg-panel overflow-hidden">
        <div className="fg-panel-header flex-wrap gap-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-govt-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <div>
              <div className="fg-panel-title">Queue Register</div>
              <p className="mt-0.5 text-xs text-muted">Operational state, progress, retry lineage, and live job entry points.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {JOB_FILTERS.map((filter) => {
              const active = selectedStatus === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedStatus(filter.value)}
                  className={
                    "rounded border px-2.5 py-1 font-mono text-xs font-medium transition-colors " +
                    (active
                      ? "border-govt-navy bg-govt-navy text-white shadow-xs"
                      : "border-line bg-panel text-muted hover:text-main hover:bg-field")
                  }
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted flex flex-col items-center gap-2 font-mono">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-govt-blue border-t-transparent" />
            <span>Loading job queue data…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            No jobs found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fg-table min-w-[980px]">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Operation</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Stage / Message</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onCancel={(jobId) => void handleCancel(jobId)}
                    onRetry={(jobId) => void handleRetry(jobId)}
                    onDelete={(jobId) => void handleDelete(jobId)}
                    busyAction={busyJobId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
