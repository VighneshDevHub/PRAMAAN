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
      eyebrow="Recovery Engine Module"
      title="Evidence Recovery &amp; Forensic Carving"
      subtitle="Configure a case-linked recovery job, specify evidence image parameters, and dispatch signature carving to the recovery worker agent."
      actions={
        <Link href="/dashboard/jobs" className="fg-btn font-mono text-xs">
          Task Queue →
        </Link>
      }
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium flex items-start gap-3 shadow-2xs">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-bold text-red-900 mb-0.5">Configuration Alert</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        {/* Main Wizard Container */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header Step Rail Bar */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
            <RecoveryStepRail step={step} />
          </div>

          {/* STEP 1: EVIDENCE SOURCE */}
          {step === 1 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  01. Select Evidence Source &amp; Output Directory
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Select a registered inventory device or specify a raw evidence image path (.dd, .e01, .raw, .img).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                    Registered Media Inventory Device
                  </label>
                  <select
                    value={deviceId}
                    onChange={(event) => setDeviceId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all"
                  >
                    <option value="">No registered device selected (Use image path below)</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.serial_number} · {device.model || device.media_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                      Evidence Image Path (.dd / .raw / .img)
                    </label>
                    <div className="relative">
                      <input
                        value={imagePath}
                        onChange={(event) => setImagePath(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 font-mono text-xs text-slate-900 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                      Recovery Output Destination Directory
                    </label>
                    <div className="relative">
                      <input
                        value={outputDir}
                        onChange={(event) => setOutputDir(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 font-mono text-xs text-slate-900 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  onClick={() => setStep(2)}
                  disabled={!imagePath.trim()}
                >
                  <span>Continue to Scan Profile</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SCAN PROFILE */}
          {step === 2 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  02. Select Signature Carving Scan Profile
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Select signature carving granularity and analysis depth for the recovery agent.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {SCAN_MODES.map((mode) => (
                  <ScanProfileCard
                    key={mode.value}
                    mode={mode}
                    selected={scanMode === mode.value}
                    onSelect={() => setScanMode(mode.value)}
                  />
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 text-xs transition-all cursor-pointer"
                  onClick={() => setStep(1)}
                >
                  <span>← Back</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
                  onClick={() => setStep(3)}
                >
                  <span>Continue to File Types</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FILE CATEGORIES */}
          {step === 3 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  03. Target File Categories &amp; Classifications
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Select file classifications to prioritize during signature header carving analysis.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FILE_TYPES.map((item) => {
                  const selected = fileTypes.includes(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleFileType(item.id)}
                      className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
                        selected
                          ? "border-govt-blue bg-white shadow-lg ring-2 ring-govt-blue/20 -translate-y-0.5"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-display text-sm font-bold text-govt-navy">{item.label}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{item.desc}</div>
                          <span className="inline-block mt-2 font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.badge}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          selected ? "border-govt-navy bg-govt-navy text-white shadow-xs" : "border-slate-300 bg-slate-50"
                        }`}
                      >
                        {selected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 text-xs transition-all cursor-pointer"
                  onClick={() => setStep(2)}
                >
                  <span>← Back</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                  onClick={() => setStep(4)}
                  disabled={!fileTypes.length}
                >
                  <span>Review Recovery Parameters</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & QUEUE */}
          {step === 4 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  04. Review &amp; Dispatch Recovery Job
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Review configuration parameters and link case file before queueing work item.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <RecoveryReviewTile
                  label="EVIDENCE SOURCE"
                  value={selectedDevice?.serial_number ?? imagePath}
                  hint="Read-only image analysis"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  }
                />
                <RecoveryReviewTile
                  label="SCAN PROFILE"
                  value={selectedScan.label}
                  hint={selectedScan.badge}
                  icon={selectedScan.icon}
                />
                <RecoveryReviewTile
                  label="TARGET CATEGORIES"
                  value={fileTypes.join(", ")}
                  hint={`${fileTypes.length} categories active`}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  }
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">LINK CASE FILE</div>
                  <select
                    value={caseId}
                    onChange={(event) => setCaseId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-govt-navy focus:outline-none mt-2 font-mono"
                  >
                    <option value="">No case file selected</option>
                    {cases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.case_number} · {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 text-xs transition-all cursor-pointer"
                  onClick={() => setStep(3)}
                >
                  <span>← Back</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#051329] via-[#0B2D4D] to-[#005BAC] hover:from-[#0B2D4D] hover:to-[#0284C7] text-white font-bold px-7 py-3.5 text-xs transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-60 font-display"
                  onClick={() => void startRecovery()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-govt-gold" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Creating Work Item...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span>Start Recovery Job</span>
                      <span className="text-sm">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Institutional Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl space-y-4">
            <div className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              WORKFLOW TELEMETRY
            </div>
            <div className="font-display text-xl font-bold text-govt-navy">
              {step < 4 ? `Stage 0${step} of 04` : "Ready to Queue"}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              After submission, the recovery worker agent claims the job, executes byte carving, generates the recovery manifest, and anchors the output to the SHA-256 ledger.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#051329] to-[#0B2D4D] text-white p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="font-mono text-[10px] font-bold text-govt-goldLight uppercase tracking-widest">
              SAFETY GUARANTEE
            </div>
            <h4 className="font-display text-sm font-bold text-white">
              Read-Only Evidence Protection
            </h4>
            <p className="text-xs text-white/80 leading-relaxed font-normal">
              Evidence images are analyzed in strict read-only mode with SHA-256 hash preservation. Source drives are never mutated.
            </p>
            <div className="pt-2 border-t border-white/15 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ISO 27037 EVIDENCE SEAL
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
