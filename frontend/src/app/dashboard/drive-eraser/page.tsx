"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, listCases, listDevices, UnauthorizedError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { CaseSummary, DeviceOut, JobCreateIn } from "@/lib/types";
import {
  DRIVE_METHODS,
  DriveMethodCard,
  DriveSafetyWarningCard,
  DriveStepRail,
  DriveTargetHealthSummary,
  type MethodOption,
} from "@/components/modules/DriveEraserUI";

export default function DriveEraserPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [devices, setDevices] = useState<DeviceOut[]>([]);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [target, setTarget] = useState("test_wipe_target.img");
  const [method, setMethod] = useState<MethodOption["value"]>("CLEAR");
  const [verification, setVerification] = useState(true);
  const [realDevice, setRealDevice] = useState(false);
  const [caseId, setCaseId] = useState("");
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
        else setError(err instanceof Error ? err.message : "Failed to load drive context.");
      });
  }, [router]);

  const selectedDevice = devices.find((device) => device.id === deviceId);
  const selectedMethod = DRIVE_METHODS.find((item) => item.value === method) ?? DRIVE_METHODS[0];

  async function startErase() {
    const trimmedTarget = target.trim();
    if (realDevice && !/^\d+$/.test(trimmedTarget)) {
      setError("Real-device mode requires a numeric Windows DeviceId such as 1. Use a filename only for a test-file job.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload: Record<string, unknown> = {
      target: trimmedTarget,
      method,
      verification,
      real_device: realDevice,
      auto_execute: true,
    };
    const request: JobCreateIn = {
      operation_type: "DRIVE_ERASE",
      title: `Drive erase · ${selectedDevice?.serial_number ?? trimmedTarget}`,
      payload,
      case_id: caseId || null,
      device_id: deviceId || null,
    };
    try {
      const job = await createJob(request);
      router.push(`/dashboard/jobs/${job.id}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) router.push("/login");
      else setError(err instanceof Error ? err.message : "Failed to create drive erase job.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      eyebrow="Drive Eraser Module"
      title="Secure Storage Sanitisation"
      subtitle="Select a target storage device, review health metrics, choose an erasure profile, and dispatch execution to the isolated CLI agent."
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
        {/* Main Interactive Wizard Panel */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header Step Rail Bar */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
            <DriveStepRail step={step} />
          </div>

          {/* STEP 1: DRIVE SELECTION */}
          {step === 1 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  01. Choose Target Drive or Test Image
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Select a registered inventory storage device or specify a safe disk image path for demonstration purposes.
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
                    <option value="">No registered drive selected (Use target path below)</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.serial_number} · {device.media_type} · {device.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                    Target File Path or Windows Device Identifier
                  </label>
                  <div className="relative">
                    <input
                      value={target}
                      onChange={(event) => setTarget(event.target.value)}
                      placeholder="test_wipe_target.img or physical disk ID"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <DriveSafetyWarningCard />

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  onClick={() => setStep(2)}
                  disabled={!target.trim()}
                >
                  <span>Continue to Health Check</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: HEALTH ANALYSIS */}
          {step === 2 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  02. Review Drive Health &amp; Geometry
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Review reported S.M.A.R.T. metrics, capacity, and connection interface before choosing an erase profile.
                </p>
              </div>

              <DriveTargetHealthSummary device={selectedDevice} />

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
                  <span>Choose Erase Profile</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ERASE METHOD */}
          {step === 3 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  03. Select Sanitisation Profile
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Choose a sanitisation method conforming to NIST SP 800-88 guidelines. The agent executes hardware primitives.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {DRIVE_METHODS.map((item) => (
                  <DriveMethodCard
                    key={item.value}
                    item={item}
                    isSelected={method === item.value}
                    onSelect={() => setMethod(item.value)}
                  />
                ))}
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={verification}
                  onChange={(event) => setVerification(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-govt-navy focus:ring-govt-navy cursor-pointer"
                />
                <div>
                  <span className="block font-bold text-govt-navy">Mandatory 100% Read-Back Verification</span>
                  <span className="text-[11px] text-slate-500 font-normal">Performs independent block read-back to confirm zero pattern across all sectors.</span>
                </div>
              </label>

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
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
                  onClick={() => setStep(4)}
                >
                  <span>Review Confirmation</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM & QUEUE */}
          {step === 4 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  04. Confirm &amp; Dispatch Operation
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Review parameters and link case file. Submission dispatches payload to isolated execution agent.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 font-medium space-y-1">
                <div className="font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  IRREVERSIBLE SANITISATION MANDATE
                </div>
                <p className="leading-relaxed text-red-800">
                  Storage sanitisation is permanent. Ensure you have verified the correct target path before dispatching the execution worker.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">TARGET IDENTIFIER</div>
                  <div className="mt-1 break-all font-mono text-xs font-bold text-govt-navy">
                    {selectedDevice?.serial_number ?? target}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">SANITISATION PLAN</div>
                  <div className="mt-1 font-display text-xs font-bold text-govt-navy">
                    {selectedMethod.label} · {verification ? "100% Verified" : "Unverified"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                  Link Official Case File (Chain of Custody)
                </label>
                <select
                  value={caseId}
                  onChange={(event) => setCaseId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-bold text-slate-900 focus:border-govt-navy focus:bg-white focus:outline-none transition-all font-mono"
                >
                  <option value="">No case file linked</option>
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.case_number} · {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={realDevice}
                  onChange={(event) => setRealDevice(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-700 focus:ring-red-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-red-900 block">Enable Real-Device Hardware Overwrite Mode</span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Leave disabled for image targets and UI demonstration runs.
                  </span>
                </div>
              </label>

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
                  onClick={() => void startErase()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-govt-gold" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Dispatching Job...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Dispatch Drive Erase Job</span>
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
              LIFECYCLE STATUS
            </div>
            <div className="font-display text-xl font-bold text-govt-navy">
              {step < 4 ? `Stage 0${step} of 04` : "Ready to Queue"}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              After submission, the backend task dispatcher assigns the job to the isolated Python CLI worker. WebSocket telemetry streams real-time block erasure progress.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>WORKER: CLI AGENT</span>
              <span className="text-emerald-700 font-bold">READY</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#051329] to-[#0B2D4D] text-white p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="font-mono text-[10px] font-bold text-govt-goldLight uppercase tracking-widest">
              CRYPTOGRAPHIC GUARANTEE
            </div>
            <h4 className="font-display text-sm font-bold text-white">
              SHA-256 Chained Certificate
            </h4>
            <p className="text-xs text-white/80 leading-relaxed font-normal">
              Upon completion, PRAMAAN writes a signed PDF certificate anchored to the append-only SHA-256 hash-chain ledger with ECDSA P-256 operator signatures.
            </p>
            <div className="pt-2 border-t border-white/15 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              INDEPENDENTLY VERIFIABLE
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
