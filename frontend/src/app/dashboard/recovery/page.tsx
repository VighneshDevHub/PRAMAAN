"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, listCases, listDevices, UnauthorizedError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { CaseSummary, DeviceOut, JobCreateIn } from "@/lib/types";

import {
  FILE_TYPES,
  RecoveryReviewTile,
  RecoveryStepRail,
  SCAN_MODES,
  ScanProfileCard,
  type ScanMode,
} from "@/components/modules/RecoveryUI";

export default function RecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [devices, setDevices] = useState<DeviceOut[]>([]);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [imagePath, setImagePath] = useState("D:\\Images\\evidence.dd");
  const [outputDir, setOutputDir] = useState("D:\\RecoveryOutput");
  const [scanMode, setScanMode] = useState<(typeof SCAN_MODES)[number]["value"]>("deep");
  const [fileTypes, setFileTypes] = useState<string[]>(FILE_TYPES.map((f) => f.id));
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
        if (queryDevice && deviceRows.some((device) => device.id === queryDevice)) setDeviceId(queryDevice);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) router.push("/login");
        else setError(err instanceof Error ? err.message : "Failed to load recovery context.");
      });
  }, [router]);

  const selectedDevice = useMemo(() => devices.find((device) => device.id === deviceId), [devices, deviceId]);
  const selectedScan = SCAN_MODES.find((mode) => mode.value === scanMode) ?? SCAN_MODES[1];

  function toggleFileType(type: string) {
    setFileTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  async function startRecovery() {
    setSubmitting(true);
    setError(null);
    const payload: Record<string, unknown> = {
      image_path: imagePath.trim(),
      output_dir: outputDir.trim(),
      deep_scan: scanMode === "deep" || scanMode === "custom",
      scan_mode: scanMode,
      file_types: fileTypes,
      auto_execute: true,
    };
    const request: JobCreateIn = {
      operation_type: "RECOVERY",
      title: `Recovery · ${selectedDevice?.serial_number ?? "evidence image"}`,
      payload,
      case_id: caseId || null,
      device_id: deviceId || null,
    };
    try {
      const job = await createJob(request);
      router.push(`/dashboard/jobs/${job.id}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) router.push("/login");
      else setError(err instanceof Error ? err.message : "Failed to create recovery job.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      eyebrow="Recovery Engine"
      title="Evidence Recovery Workflow"
      subtitle="Configure a case-linked recovery job, then hand execution to the existing recovery agent and live job monitor."
      actions={<Link href="/dashboard/jobs" className="fg-btn">Open task queue</Link>}
    >
      {error && <div className="mb-6 rounded-md border border-govt-red/25 bg-govt-redLight px-4 py-3 text-sm text-govt-red">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <section className="fg-panel">
          <div className="border-b border-line p-5">
            <RecoveryStepRail step={step} />
          </div>

          {step === 1 && (
            <div className="space-y-5 p-5">
              <div>
                <div className="fg-panel-title">Choose Evidence Source</div>
                <p className="mt-1 text-sm text-muted">Select a registered inventory device or specify an image file path.</p>
              </div>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="fg-label">Registered Device</span>
                <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)} className="fg-input">
                  <option value="">No registered device selected</option>
                  {devices.map((device) => <option key={device.id} value={device.id}>{device.serial_number} · {device.model || device.media_type}</option>)}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm"><span className="fg-label">Evidence Image Path</span><input value={imagePath} onChange={(event) => setImagePath(event.target.value)} className="fg-input font-mono text-xs" /></label>
                <label className="flex flex-col gap-1.5 text-sm"><span className="fg-label">Recovery Output Directory</span><input value={outputDir} onChange={(event) => setOutputDir(event.target.value)} className="fg-input font-mono text-xs" /></label>
              </div>
              <div className="flex justify-end"><button type="button" className="fg-btn-primary" onClick={() => setStep(2)} disabled={!imagePath.trim()}>Continue to Scan Profile →</button></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 p-5">
              <div><div className="fg-panel-title">Choose Scan Profile</div><p className="mt-1 text-sm text-muted">Select signature carving granularity for the recovery agent.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SCAN_MODES.map((mode) => (
                  <ScanProfileCard
                    key={mode.value}
                    mode={mode}
                    selected={scanMode === mode.value}
                    onSelect={() => setScanMode(mode.value)}
                  />
                ))}
              </div>
              <div className="flex justify-between"><button type="button" className="fg-btn" onClick={() => setStep(1)}>← Back</button><button type="button" className="fg-btn-primary" onClick={() => setStep(3)}>Continue to File Types →</button></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 p-5">
              <div><div className="fg-panel-title">Choose Target File Categories</div><p className="mt-1 text-sm text-muted">Select file classifications to prioritize during analysis.</p></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FILE_TYPES.map((item) => {
                  const selected = fileTypes.includes(item.id);
                  return (
                    <label key={item.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm transition-all ${selected ? "border-govt-blue bg-govt-blueLight/40 dark:bg-govt-blueDark/40" : "border-line bg-panel hover:bg-field"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="font-semibold text-main">{item.label}</div>
                          <div className="text-[11px] text-muted">{item.desc}</div>

                        </div>
                      </div>
                      <input type="checkbox" checked={selected} onChange={() => toggleFileType(item.id)} className="h-4 w-4 accent-govt-navy" />
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-between"><button type="button" className="fg-btn" onClick={() => setStep(2)}>← Back</button><button type="button" className="fg-btn-primary" onClick={() => setStep(4)} disabled={!fileTypes.length}>Review Recovery →</button></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 p-5">
              <div><div className="fg-panel-title">Review & Queue Recovery Job</div><p className="mt-1 text-sm text-muted">Confirm configuration parameters before queueing work item.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <RecoveryReviewTile label="Evidence Source" value={selectedDevice?.serial_number ?? imagePath} hint="Read-only image" icon="💾" />
                <RecoveryReviewTile label="Scan Profile" value={selectedScan.label} hint={selectedScan.badge} icon={selectedScan.icon} />
                <RecoveryReviewTile label="Target Categories" value={fileTypes.join(", ")} hint={`${fileTypes.length} selected`} icon="📁" />
                <div className="rounded-lg border border-line bg-field p-4 shadow-xs">
                  <div className="fg-label">Case Linkage</div>
                  <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="fg-input mt-2">
                    <option value="">No case selected</option>
                    {cases.map((item) => <option key={item.id} value={item.id}>{item.case_number} · {item.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between"><button type="button" className="fg-btn" onClick={() => setStep(3)}>← Back</button><button type="button" className="fg-btn-primary" onClick={() => void startRecovery()} disabled={submitting}>{submitting ? "Creating Job..." : "Start Recovery Job"}</button></div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="fg-panel p-5">
            <div className="fg-label">Workflow Status</div>
            <div className="mt-2 font-display text-xl font-semibold text-main">{step < 4 ? `Configuration ${step}/3` : "Ready to Queue"}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted">After submission, the recovery worker agent claims the job, executes byte carving, generates the recovery report, and anchors the output to the blockchain ledger.</p>
          </div>
          <div className="fg-panel p-5">
            <div className="fg-label">Safety & Read-Only Guarantee</div>
            <p className="mt-2 text-xs leading-relaxed text-muted">Evidence images are analyzed in read-only mode with SHA-256 hash preservation. Source drives are never mutated.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
