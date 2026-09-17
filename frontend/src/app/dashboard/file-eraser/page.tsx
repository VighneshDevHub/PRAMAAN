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
    <AppShell
      eyebrow="File &amp; Folder Eraser Module"
      title="Selective Logical Data Destruction"
      subtitle="Prepare a case-linked file erasure job with explicit multi-pass overwrite parameters, inode metadata scrubbing, and free-space sanitisation."
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
        {/* Main Wizard Card */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header Step Rail Bar */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
            <FileEraserStepRail step={step} />
          </div>

          {/* STEP 1: TARGET PATHS */}
          {step === 1 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  01. Select Target Files or Directory Paths
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Enter target file or directory paths below. Nothing is modified during queue configuration.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                    Target File / Folder Paths (One per line)
                  </label>
                  <textarea
                    value={targetsText}
                    onChange={(event) => setTargetsText(event.target.value)}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all leading-relaxed"
                    placeholder={'C:\\Evidence\\to-delete\nC:\\Evidence\\old-notes.txt'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                    Registered Inventory Device Linkage (Optional)
                  </label>
                  <select
                    value={deviceId}
                    onChange={(event) => setDeviceId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all"
                  >
                    <option value="">No device linkage selected</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.serial_number} · {device.model || device.media_type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  onClick={() => setStep(2)}
                  disabled={!targets.length}
                >
                  <span>Continue to Standard</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ERASE STANDARD */}
          {step === 2 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  02. Choose Overwrite Standard &amp; Metadata Parameters
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Select sanitisation pass profile and metadata scrubbing options per NIST SP 800-88 REV. 2 guidelines.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {FILE_ERASE_STANDARDS.map((item) => (
                  <StandardCard
                    key={item.value}
                    standard={item}
                    selected={standard === item.value}
                    onSelect={() => setStandard(item.value)}
                  />
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={metadataScrub}
                    onChange={(event) => setMetadataScrub(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-govt-navy focus:ring-govt-navy cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-govt-navy block">Scrub Filesystem Inode Metadata</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Wipes MFT records, inode timestamps &amp; file slack space.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={freeSpaceOverwrite}
                    onChange={(event) => setFreeSpaceOverwrite(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-govt-navy focus:ring-govt-navy cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-govt-navy block">Overwrite Unallocated Free Space</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Cleans deleted file remnants from volume free-space clusters.</span>
                  </div>
                </label>
              </div>

              {freeSpaceOverwrite && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display max-w-xs">
                    Free-Space Overwrite Cap (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={freeSpaceMaxMb}
                    onChange={(event) => setFreeSpaceMaxMb(event.target.value)}
                    className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2 text-xs font-mono font-bold text-slate-900 focus:border-govt-navy focus:bg-white focus:outline-none transition-all"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">Limits free-space sanitisation pass during demonstration runs.</span>
                </div>
              )}

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
                  <span>Continue to Preview</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TARGET PREVIEW */}
          {step === 3 && (
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h3 className="font-display text-xl font-extrabold text-govt-navy">
                  03. Target Preview &amp; Scope Audit
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Review the target file list before queueing. The preview is strictly read-only.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-5 text-xs text-slate-800 space-y-3">
                <div className="font-bold text-amber-950 font-display flex items-center justify-between">
                  <span>{targets.length} Target Path{targets.length === 1 ? "" : "s"} Selected for Destruction</span>
                  <span className="font-mono text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">READ-ONLY PREVIEW</span>
                </div>
                <ul className="space-y-1.5 font-mono text-xs text-slate-700 max-h-48 overflow-y-auto pr-2">
                  {targets.map((target) => (
                    <li key={target} className="break-all bg-white/80 p-2 rounded border border-amber-200/60 font-semibold">
                      {target}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">SANITISATION STANDARD</div>
                  <div className="mt-1 font-display text-xs font-bold text-govt-navy">{selectedStandard.label}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">INODE METADATA SCRUB</div>
                  <div className="mt-1 font-display text-xs font-bold text-emerald-700">{metadataScrub ? "Enabled (MFT Clean)" : "Disabled"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">FREE-SPACE OVERWRITE</div>
                  <div className="mt-1 font-display text-xs font-bold text-govt-navy">{freeSpaceOverwrite ? `${freeSpaceMaxMb} MB Cap` : "Disabled"}</div>
                </div>
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
                  className="inline-flex items-center gap-2 rounded-xl bg-govt-navy hover:bg-govt-blueDark text-white font-bold px-6 py-3 text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
                  onClick={() => setStep(4)}
                >
                  <span>Continue to Review</span>
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
                  04. Review &amp; Dispatch Work Item
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Link official case metadata and confirm creation of the File Erase job.
                </p>
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
                  <option value="">No case selected</option>
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.case_number} · {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">TARGET DEVICE LINKAGE</div>
                  <div className="mt-1 font-display text-xs font-bold text-govt-navy">
                    {selectedDevice?.serial_number ?? "No device linkage"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">EXECUTION AGENT</div>
                  <div className="mt-1 font-display text-xs font-bold text-emerald-700">
                    file-folder-eraser CLI Agent
                  </div>
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
                  onClick={() => void startErase()}
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Queue File Erase Job</span>
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
              SAFETY &amp; COMPLIANCE
            </div>
            <div className="font-display text-sm font-bold text-govt-navy">
              Orchestrated Worker Task
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              File overwrite, MFT metadata scrubbing, and read-back verification are executed by the worker agent in isolated subprocesses.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#051329] to-[#0B2D4D] text-white p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="font-mono text-[10px] font-bold text-govt-goldLight uppercase tracking-widest">
              CRYPTOGRAPHIC OUTPUT
            </div>
            <h4 className="font-display text-sm font-bold text-white">
              Signed PDF &amp; Blockchain Seal
            </h4>
            <p className="text-xs text-white/80 leading-relaxed font-normal">
              Upon completion, a PDF certificate and SHA-256 ledger block with ECDSA P-256 signatures are generated automatically.
            </p>
            <div className="pt-2 border-t border-white/15 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              NIST SP 800-88 REV. 2 VERIFIED
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
