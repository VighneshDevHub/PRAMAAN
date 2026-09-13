"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, listCases, listDevices, UnauthorizedError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { CaseSummary, DeviceOut, JobCreateIn } from "@/lib/types";

import {
  FILE_ERASE_STANDARDS,
  FileEraserStepRail,
  SanitizationStandard,
  StandardCard,
  STANDARDS,
} from "@/components/modules/FileEraserUI";

export default function FileEraserPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [targetsText, setTargetsText] = useState("C:\\Evidence\\to-delete");
  const [standard, setStandard] = useState<(typeof STANDARDS)[number]["value"]>("NIST_CLEAR");

  const [metadataScrub, setMetadataScrub] = useState(true);
  const [freeSpaceOverwrite, setFreeSpaceOverwrite] = useState(true);
  const [freeSpaceMaxMb, setFreeSpaceMaxMb] = useState("256");
  const [caseId, setCaseId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState<DeviceOut[]>([]);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    const queryDevice = new URLSearchParams(window.location.search).get("device");
    setDeviceId(queryDevice ?? "");
    void Promise.all([listDevices({ limit: 100 }), listCases()])
      .then(([deviceRows, caseRows]) => {
        setDevices(deviceRows);
        setCases(caseRows);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) router.push("/login");
        else setError(err instanceof Error ? err.message : "Failed to load erase context.");
      });
  }, [router]);

  const targets = useMemo(() => targetsText.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean), [targetsText]);
  const selectedStandard = FILE_ERASE_STANDARDS.find((item) => item.value === standard) ?? FILE_ERASE_STANDARDS[0];
  const selectedDevice = devices.find((device) => device.id === deviceId);

  async function startErase() {
    setSubmitting(true);
    setError(null);
    const payload: Record<string, unknown> = {
      targets,
      method: standard,
      metadata_scrub: metadataScrub,
      free_space_overwrite: freeSpaceOverwrite,
      freespace_max_bytes: freeSpaceOverwrite ? Math.max(1, Number(freeSpaceMaxMb) || 256) * 1024 * 1024 : 0,
      simulation: false,
      auto_execute: true,
    };
    const request: JobCreateIn = {
      operation_type: "FILE_ERASE",
      title: `File erase · ${targets[0] ?? "selected targets"}`,
      payload,
      case_id: caseId || null,
      device_id: deviceId || null,
    };
    try {
      const job = await createJob(request);
      router.push(`/dashboard/jobs/${job.id}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) router.push("/login");
      else setError(err instanceof Error ? err.message : "Failed to create file erase job.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell eyebrow="File & Folder Eraser" title="Selective Sanitization Workflow" subtitle="Prepare a case-linked file erasure job with explicit verification parameters." actions={<Link href="/dashboard/jobs" className="fg-btn">Open task queue</Link>}>
      {error && <div className="mb-6 rounded-md border border-govt-red/25 bg-govt-redLight px-4 py-3 text-sm text-govt-red">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <section className="fg-panel">
          <div className="border-b border-line p-5">
            <FileEraserStepRail step={step} />
          </div>
          {step === 1 && <div className="space-y-5 p-5">
            <div><div className="fg-panel-title">Select Folders or Files</div><p className="mt-1 text-sm text-muted">Enter target file or directory paths. Nothing is modified during queue setup.</p></div>
            <label className="flex flex-col gap-1.5 text-sm"><span className="fg-label font-semibold">Target File Paths</span><textarea value={targetsText} onChange={(event) => setTargetsText(event.target.value)} rows={5} className="fg-input font-mono text-xs" placeholder={'C:\\Evidence\\to-delete\nC:\\Evidence\\old-notes.txt'} /></label>
            <label className="flex flex-col gap-1.5 text-sm"><span className="fg-label">Registered Device Linkage (Optional)</span><select value={deviceId} onChange={(event) => setDeviceId(event.target.value)} className="fg-input"><option value="">No device linkage</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.serial_number} · {device.model || device.media_type}</option>)}</select></label>
            <div className="flex justify-end"><button type="button" className="fg-btn-primary" onClick={() => setStep(2)} disabled={!targets.length}>Continue to Standard →</button></div>
          </div>}
          {step === 2 && <div className="space-y-5 p-5">
            <div><div className="fg-panel-title">Select Sanitization Standard</div><p className="mt-1 text-sm text-muted">Choose overwrite pass profile per NIST SP 800-88 guidelines.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {FILE_ERASE_STANDARDS.map((item) => (
                <StandardCard
                  key={item.value}
                  standard={item}
                  selected={standard === item.value}
                  onSelect={() => setStandard(item.value)}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-line bg-field p-4 text-sm text-main hover:bg-panel cursor-pointer">
                <input type="checkbox" checked={metadataScrub} onChange={(event) => setMetadataScrub(event.target.checked)} className="h-4 w-4 accent-govt-goldDark" />
                <div>
                  <span className="font-semibold block">Scrub Filesystem Metadata</span>
                  <span className="text-xs text-muted">Wipes MFT, inode timestamps &amp; file slack space</span>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-line bg-field p-4 text-sm text-main hover:bg-panel cursor-pointer">
                <input type="checkbox" checked={freeSpaceOverwrite} onChange={(event) => setFreeSpaceOverwrite(event.target.checked)} className="h-4 w-4 accent-govt-goldDark" />
                <div>
                  <span className="font-semibold block">Overwrite Volume Free Space</span>
                  <span className="text-xs text-muted">Cleans unallocated disk space clusters</span>
                </div>
              </label>
            </div>
            {freeSpaceOverwrite && <label className="flex max-w-xs flex-col gap-1.5 text-sm"><span className="fg-label">Free-Space Cap (MB)</span><input type="number" min="1" value={freeSpaceMaxMb} onChange={(event) => setFreeSpaceMaxMb(event.target.value)} className="fg-input font-mono text-xs" /><span className="text-xs text-muted">Limits test run duration during evidence demonstrations.</span></label>}
            <div className="flex justify-between"><button type="button" className="fg-btn" onClick={() => setStep(1)}>← Back</button><button type="button" className="fg-btn-primary" onClick={() => setStep(3)}>Continue to Preview →</button></div>
          </div>}
          {step === 3 && <div className="space-y-5 p-5">
            <div><div className="fg-panel-title">Preview Operation Scope</div><p className="mt-1 text-sm text-muted">Review target list before queueing. The preview is read-only.</p></div>
            <div className="rounded-lg border border-govt-gold/40 bg-govt-goldLight/30 p-4 text-sm text-main"><div className="font-semibold">{targets.length} target{targets.length === 1 ? "" : "s"} selected</div><ul className="mt-2 space-y-1 font-mono text-xs text-muted">{targets.map((target) => <li key={target} className="break-all">{target}</li>)}</ul></div>
            <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-line bg-field p-4"><div className="fg-label">Standard</div><div className="mt-1 text-sm font-semibold text-main">{selectedStandard.label}</div></div><div className="rounded-lg border border-line bg-field p-4"><div className="fg-label">Metadata</div><div className="mt-1 text-sm font-semibold text-main">{metadataScrub ? "Enabled" : "Disabled"}</div></div><div className="rounded-lg border border-line bg-field p-4"><div className="fg-label">Free space</div><div className="mt-1 text-sm font-semibold text-main">{freeSpaceOverwrite ? "Enabled" : "Disabled"}</div></div></div>
            <div className="flex justify-between"><button type="button" className="fg-btn" onClick={() => setStep(2)}>← Back</button><button type="button" className="fg-btn-primary" onClick={() => setStep(4)}>Continue to Review →</button></div>
          </div>}
          {step === 4 && <div className="space-y-5 p-5">
            <div><div className="fg-panel-title">Review &amp; Queue Work Item</div><p className="mt-1 text-sm text-muted">Link case metadata and confirm creation of the File Erase job.</p></div>
            <label className="flex flex-col gap-1.5 text-sm"><span className="fg-label">Case Linkage</span><select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="fg-input"><option value="">No case selected</option>{cases.map((item) => <option key={item.id} value={item.id}>{item.case_number} · {item.title}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-line bg-field p-4"><div className="fg-label">Target device</div><div className="mt-1 text-sm font-medium text-main">{selectedDevice?.serial_number ?? "No device linkage"}</div></div><div className="rounded-lg border border-line bg-field p-4"><div className="fg-label">Execution</div><div className="mt-1 text-sm font-medium text-main">Queued for File Eraser Agent</div></div></div>
            <div className="flex justify-between"><button type="button" className="fg-btn" onClick={() => setStep(3)}>← Back</button><button type="button" className="fg-btn-primary" onClick={() => void startErase()} disabled={submitting}>{submitting ? "Creating Job..." : "Queue File Erase Job"}</button></div>
          </div>}
        </section>
        <aside className="space-y-4">
          <div className="fg-panel p-5"><div className="fg-label">Safety &amp; Compliance</div><p className="mt-2 text-xs leading-relaxed text-muted">This wizard queues an orchestration task. File overwrite, metadata scrubbing, and read-back verification are executed by the worker agent.</p></div>
          <div className="fg-panel p-5"><div className="fg-label">Signed Output</div><p className="mt-2 text-xs leading-relaxed text-muted">Upon completion, a cryptographic PDF certificate and SHA-256 ledger block are generated automatically.</p></div>
        </aside>
      </div>
    </AppShell>
  );
}
