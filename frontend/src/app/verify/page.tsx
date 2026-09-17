"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NtroGovernmentLogo, GovernmentTopHeaderBar } from "@/components/NtroGovernmentLogo";

function VerifyLookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [certificateId, setCertificateId] = useState(searchParams.get("certificate_id") ?? "");

  useEffect(() => {
    const existing = searchParams.get("certificate_id");
    if (existing) router.replace(`/verify/${encodeURIComponent(existing)}`);
  }, [router, searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = certificateId.trim();
    if (value) router.push(`/verify/${encodeURIComponent(value)}`);
  }

  function fillSample(id: string) {
    setCertificateId(id);
    router.push(`/verify/${encodeURIComponent(id)}`);
  }

  return (
    <main className="min-h-screen bg-page text-main font-display flex flex-col justify-between">
      <div>
        {/* Official Government Top Header */}
        <GovernmentTopHeaderBar />

        {/* Portal Navigation Header */}
        <header className="border-b border-line bg-panel/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <NtroGovernmentLogo variant="header" showSubtitle={true} />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs font-medium text-muted hover:text-govt-navy hidden sm:inline-block">
                ← Back to Home
              </Link>
              <Link href="/login" className="fg-btn-primary !py-1.5 !px-3 text-xs">
                Operator Sign In
              </Link>
            </div>
          </div>
        </header>

        {/* Verification Hero & Form */}
        <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 rounded-sm border border-govt-gold/70 bg-govt-goldLight px-3 py-1 font-mono text-[10px] uppercase tracking-[0.26em] text-govt-navy mb-3">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-govt-navy" />
              Public Verification Portal · Zero-Trust Validation
            </div>
            <h1 className="font-display text-3xl font-semibold text-govt-navy md:text-4xl">
              Digital Certificate Verification
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Independently validate the authenticity, cryptographic signature (ECDSA P-256), and SHA-256 hash-chain sequence of any PRAMAAN operation certificate.
            </p>
          </div>

          <div className="fg-panel overflow-hidden shadow-card-md">
            <div className="bg-govt-navy text-white px-6 py-4 flex items-center justify-between border-b border-govt-gold/30">
              <div className="font-mono text-xs uppercase tracking-wider text-govt-goldLight">
                Certificate Authenticator
              </div>
              <span className="font-mono text-[10px] text-white/70">
                NIST SP 800-88 REV. 2 & ISO 27037
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-main mb-2">
                  Enter Certificate Identification (UUID)
                </label>
                <div className="relative">
                  <input
                    autoFocus
                    required
                    value={certificateId}
                    onChange={(event) => setCertificateId(event.target.value)}
                    placeholder="e.g. 90dcb09d-a0ba-461b-9154-fccdb9923941"
                    className="fg-input font-mono text-sm py-3.5 pl-4 pr-12 w-full text-main bg-white"
                  />
                  {certificateId && (
                    <button
                      type="button"
                      onClick={() => setCertificateId("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted">
                  The Certificate ID is printed on top of official PDF reports or encoded inside QR codes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button type="submit" className="fg-btn-primary w-full sm:w-auto flex-1 !py-3 justify-center text-sm font-medium">
                  Verify Record Authenticity →
                </button>
              </div>

              {/* Sample Quick Verifications */}
              <div className="border-t border-line pt-5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">
                  Sample Verification IDs:
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "78b0b57c-e53a-4932-b9a2-45c6741669ab",
                    "8690b454-2fab-417c-b7a5-b9a7fb680732",
                  ].map((sampleId) => (
                    <button
                      key={sampleId}
                      type="button"
                      onClick={() => fillSample(sampleId)}
                      className="px-2.5 py-1 text-xs font-mono rounded border border-line bg-field text-muted hover:text-govt-blue hover:border-govt-blueRing transition-all"
                    >
                      {sampleId.slice(0, 18)}…
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Security Features Callout */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-xs">
            <div className="p-4 rounded border border-line bg-panel">
              <div className="font-mono font-semibold text-govt-navy mb-1">ECDSA P-256</div>
              <p className="text-muted">Digital signature validation against authorized operator keys.</p>
            </div>
            <div className="p-4 rounded border border-line bg-panel">
              <div className="font-mono font-semibold text-govt-navy mb-1">SHA-256 Chain</div>
              <p className="text-muted">Append-only cryptographic ledger sequence check.</p>
            </div>
            <div className="p-4 rounded border border-line bg-panel">
              <div className="font-mono font-semibold text-govt-navy mb-1">Tamper Detection</div>
              <p className="text-muted">Instant detection if underlying operation records are modified.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-govt-navy text-white py-6 border-t border-govt-gold/30 mt-12">
        <div className="mx-auto max-w-7xl px-5 text-center font-mono text-[10px] uppercase tracking-wider text-white/60">
          National Technical Research Organisation · Government of India · Official Verification Portal
        </div>
      </footer>
    </main>
  );
}

export default function VerifyLookupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-page p-8 text-sm text-muted">Loading verification portal...</main>}>
      <VerifyLookupContent />
    </Suspense>
  );
}
