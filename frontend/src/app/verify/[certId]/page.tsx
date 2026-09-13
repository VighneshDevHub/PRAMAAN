"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOperation, getOperationPdfUrl, NotFoundError, verifyOperation } from "@/lib/api";
import type { OperationRecord, VerificationResult } from "@/lib/types";
import { OperationDetails, OperationTypeTag } from "@/components/OperationBadges";
import { NtroGovernmentLogo, GovernmentTopHeaderBar } from "@/components/NtroGovernmentLogo";
import { formatIndianDateTime } from "@/lib/formatters";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "loaded"; record: OperationRecord; result: VerificationResult };

export default function VerifyPage({ params }: { params: { certId: string } }) {
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      try {
        const [record, result] = await Promise.all([
          getOperation(params.certId),
          verifyOperation(params.certId),
        ]);
        if (!cancelled) setState({ status: "loaded", record, result });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NotFoundError) {
          setState({ status: "not_found" });
        } else {
          setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.certId]);

  return (
    <main className="min-h-screen bg-page text-main font-display flex flex-col justify-between">
      <div>
        {/* Government Top Header Bar */}
        <GovernmentTopHeaderBar />

        {/* Portal Header */}
        <header className="border-b border-line bg-panel/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <NtroGovernmentLogo variant="header" showSubtitle={true} />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/verify" className="text-xs font-medium text-muted hover:text-govt-navy">
                ← Verify Another ID
              </Link>
              <Link href="/login" className="fg-btn-primary !py-1.5 !px-3 text-xs">
                Operator Sign In
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <div className="mx-auto max-w-4xl px-5 py-10 md:py-14">
          {state.status === "loading" && (
            <div className="fg-panel p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-govt-blue border-t-transparent mb-4" />
              <div className="font-mono text-sm text-main font-medium">
                Validating ECDSA signature & SHA-256 ledger chain…
              </div>
              <div className="mt-1 font-mono text-xs text-muted">Certificate ID: {params.certId}</div>
            </div>
          )}

          {state.status === "not_found" && (
            <div className="fg-panel overflow-hidden border-govt-red/40 bg-govt-redLight/30 p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-govt-red text-white text-xl font-bold mb-3">
                ✕
              </div>
              <h2 className="font-display text-xl font-bold text-govt-red">Certificate Record Not Found</h2>
              <p className="mt-2 text-sm text-muted max-w-md mx-auto">
                No operation record exists matching certificate ID <code className="font-mono text-main">{params.certId}</code>. Please verify the ID and try again.
              </p>
              <Link href="/verify" className="fg-btn-primary mt-6 inline-block !py-2 !px-4 text-xs">
                Return to Verification Portal
              </Link>
            </div>
          )}

          {state.status === "error" && (
            <div className="fg-panel border-govt-gold bg-govt-goldLight/30 p-8 text-center">
              <h2 className="font-display text-xl font-bold text-govt-navy">Verification Service Unavailable</h2>
              <p className="mt-2 text-sm text-muted">{state.message}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="fg-btn mt-4 !py-2 !px-4 text-xs"
              >
                Retry Verification
              </button>
            </div>
          )}

          {state.status === "loaded" && (
            <div className="space-y-6">
              {/* Verification Seal Badge Card */}
              <div
                className={`fg-panel overflow-hidden border-2 transition-all ${
                  state.result.overall_verified
                    ? "border-govt-green bg-gradient-to-br from-white via-white to-govt-greenLight/30 shadow-card-md"
                    : "border-govt-red bg-gradient-to-br from-white via-white to-govt-redLight/30 shadow-card-md"
                }`}
              >
                <div
                  className={`px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-between text-white ${
                    state.result.overall_verified ? "bg-govt-green" : "bg-govt-red"
                  }`}
                >
                  <span>Government Verification Stamp</span>
                  <span>Authenticity Seal</span>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Big Seal Badge */}
                    <div
                      className={`h-20 w-20 shrink-0 rounded-full flex flex-col items-center justify-center border-4 shadow-sm ${
                        state.result.overall_verified
                          ? "border-govt-green bg-govt-greenLight text-govt-green"
                          : "border-govt-red bg-govt-redLight text-govt-red"
                      }`}
                    >
                      <span className="text-2xl font-bold">
                        {state.result.overall_verified ? "✓" : "✕"}
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                        {state.result.overall_verified ? "VERIFIED" : "INVALID"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          Official Certificate Verification
                        </span>
                      </div>
                      <h2
                        className={`font-display text-2xl font-bold tracking-tight mt-0.5 ${
                          state.result.overall_verified ? "text-govt-green" : "text-govt-red"
                        }`}
                      >
                        {state.result.overall_verified
                          ? "AUTHENTIC & UNTAMPERED CERTIFICATE"
                          : "TAMPER DETECTED — INVALID RECORD"}
                      </h2>
                      <p className="mt-1 text-sm text-muted max-w-xl">
                        {state.result.detail}
                      </p>
                    </div>
                  </div>

                  {/* PDF Download Button */}
                  <div className="shrink-0">
                    <a
                      href={getOperationPdfUrl(state.record.certificate_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fg-btn-primary !py-3 !px-5 text-sm flex items-center gap-2 shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      Download Official PDF Report
                    </a>
                  </div>
                </div>

                {/* Sub-checks Bar */}
                <div className="border-t border-line bg-field/60 px-6 py-3 grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">ECDSA Signature:</span>
                    <span
                      className={`font-bold ${
                        state.result.signature_valid ? "text-govt-green" : "text-govt-red"
                      }`}
                    >
                      {state.result.signature_valid ? "VALID & AUTHENTIC" : "SIGNATURE MISMATCH"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-l border-line pl-4">
                    <span className="text-muted">SHA-256 Ledger Chain:</span>
                    <span
                      className={`font-bold ${
                        state.result.chain_intact ? "text-govt-green" : "text-govt-red"
                      }`}
                    >
                      {state.result.chain_intact ? "INTACT & ANCHORED" : "CHAIN BROKEN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Record Details Panel */}
              <div className="fg-panel overflow-hidden">
                <div className="fg-panel-header flex items-center justify-between">
                  <div>
                    <div className="fg-panel-title">Operation Certificate Details</div>
                    <div className="text-xs text-muted">Recorded in NTRO Digital Forensics Registry</div>
                  </div>
                  <OperationTypeTag type={state.record.operation_type} />
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b border-line pb-4">
                    <div>
                      <div className="fg-label">Certificate ID</div>
                      <div className="mt-1 font-mono text-xs text-govt-navy font-semibold select-all">
                        {state.record.certificate_id}
                      </div>
                    </div>
                    <div>
                      <div className="fg-label">Target Media / Description</div>
                      <div className="mt-1 font-mono text-xs text-main font-semibold">
                        {state.record.target_description}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-b border-line pb-4">
                    <div>
                      <div className="fg-label">Authenticated Operator</div>
                      <div className="mt-1 font-medium text-main">{state.record.operator}</div>
                    </div>
                    <div>
                      <div className="fg-label">Completed Timestamp (IST)</div>
                      <div className="mt-1 font-mono text-xs text-main font-semibold">
                        {formatIndianDateTime(state.record.completed_at)}
                      </div>
                    </div>
                    <div>
                      <div className="fg-label">Ledger Sequence Block #</div>
                      <div className="mt-1 font-mono text-xs text-govt-blue font-semibold">
                        Block #{state.record.ledger_sequence_number}
                      </div>
                    </div>
                  </div>

                  {/* Operation Specific Details */}
                  <div className="pt-2">
                    <div className="fg-label mb-2">Module Specific Data</div>
                    <OperationDetails record={state.record} />
                  </div>

                  {/* Cryptographic Hashes */}
                  <div className="border-t border-line pt-4 space-y-3">
                    <div>
                      <div className="fg-label">SHA-256 Report Hash</div>
                      <div className="mt-1 rounded bg-field p-2.5 font-mono text-[11px] text-main break-all select-all border border-line">
                        {state.record.report_hash}
                      </div>
                    </div>
                    <div>
                      <div className="fg-label">ECDSA P-256 Digital Signature</div>
                      <div className="mt-1 rounded bg-field p-2.5 font-mono text-[10px] text-muted break-all select-all border border-line">
                        {state.record.signature}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-govt-navy text-white py-6 border-t border-govt-gold/30 mt-12">
        <div className="mx-auto max-w-7xl px-5 text-center font-mono text-[10px] uppercase tracking-wider text-white/60">
          National Technical Research Organisation · Government of India · Verification Portal
        </div>
      </footer>
    </main>
  );
}
