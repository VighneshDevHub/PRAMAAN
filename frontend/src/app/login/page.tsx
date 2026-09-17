"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthError, getToken, login, register } from "@/lib/auth";
import { NtroGovernmentLogo, GovernmentTopHeaderBar } from "@/components/NtroGovernmentLogo";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<"ADMINISTRATOR" | "INVESTIGATOR" | "AUDITOR" | "SUPERVISOR">("INVESTIGATOR");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  // Helper for quick filling demo credentials
  function handleQuickFill(fillEmail: string, fillRole: typeof role) {
    setEmail(fillEmail);
    setPassword("testpass123");
    setRole(fillRole);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const reservedDomain = /@(test|example|invalid|localhost)$/i.test(normalizedEmail);
      if (!normalizedEmail || !normalizedEmail.includes("@") || reservedDomain || password.length < 8) {
        throw new AuthError(
          "Please enter a valid official email address (e.g. operator@ntro.gov.in) and a password of at least 8 characters."
        );
      }

      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new AuthError("Passwords do not match. Please verify your password confirmation.");
        }
        if (!agreeTerms) {
          throw new AuthError("You must accept the Government Operating Guidelines and Privacy Mandates.");
        }
        await register(normalizedEmail, password, role);
      }

      await login(normalizedEmail, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Authentication failed. Please verify your credentials or contact administrator.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-display">
      {/* ========================================== GOVERNMENT TOP BAR */}
      <GovernmentTopHeaderBar />

      {/* ========================================== PAGE HEADER */}
      <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur px-5 py-3.5 md:px-8 flex items-center justify-between shadow-2xs sticky top-0 z-40">
        <Link href="/" className="inline-flex items-center gap-3">
          <NtroGovernmentLogo variant="header" showSubtitle={true} />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-900">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            RESTRICTED ACCESS · AUTH REQUIRED
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-govt-navy hover:text-govt-blue transition-colors bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <span>←</span>
            <span>Return to Landing Page</span>
          </Link>
        </div>
      </header>

      {/* ========================================== MAIN AUTH GRID */}
      <main className="flex-1 grid lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 md:p-8 items-center gap-8 my-auto">
        
        {/* ---- LEFT PANEL: Dark Navy Institutional Branding (5 cols on lg) ---- */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#051329] via-[#0B2D4D] to-[#07172B] text-white p-8 md:p-10 flex flex-col justify-between min-h-[600px] shadow-2xl border border-slate-700/60">
          {/* Subtle background glow accents */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(600px 300px at 10% 20%, rgba(212,175,55,0.25), transparent 70%), radial-gradient(600px 300px at 90% 80%, rgba(0,91,172,0.35), transparent 70%)",
            }}
          />

          <div className="relative z-10 space-y-6">
            {/* National Mandate Header */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-govt-gold/40 bg-white/10 px-3 py-1 text-[10px] font-mono font-bold text-govt-goldLight uppercase tracking-wider mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-govt-gold animate-pulse" />
                NTRO · PROBLEM STATEMENT ID 26149
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
                {mode === "login" ? "Operator Sign In" : "Register Account"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-sm font-bold text-govt-gold uppercase tracking-widest">
                  PRAMAAN · प्रमाण
                </span>
                <span className="text-white/40">|</span>
                <span className="text-xs text-white/70 font-mono">DIGITAL FORENSIC PLATFORM</span>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-govt-gold to-blue-500 rounded-full mt-4" />
            </div>

            <p className="text-xs md:text-sm text-white/80 leading-relaxed font-normal">
              {mode === "login"
                ? "Authenticate with certified agency credentials to access drive sanitisation tools, forensic file carving, SHA-256 chain ledgers, and evidence registers."
                : "Submit an official operator registration request to join the PRAMAAN digital forensics workspace under NTRO oversight."}
            </p>

            {/* Feature List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="shrink-0 p-2.5 rounded-xl bg-govt-gold/20 text-govt-gold border border-govt-gold/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">4-Tier Role Access Control</h4>
                  <p className="text-[11px] text-white/70 mt-0.5 font-normal">Administrator, Supervisor, Investigator, and Auditor duty gating.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="shrink-0 p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Immutable SHA-256 Ledger</h4>
                  <p className="text-[11px] text-white/70 mt-0.5 font-normal">Cryptographically sealed operations with ECDSA P-256 operator keys.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="shrink-0 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">NIST SP 800-88 REV. 2 &amp; ISO 27037</h4>
                  <p className="text-[11px] text-white/70 mt-0.5 font-normal">Compliant sanitisation primitives &amp; digital forensic evidence seals.</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Telemetry Footer */}
          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-white/70">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span>TLS 1.3 · ENCRYPTED</span>
          </div>
        </div>

        {/* ---- RIGHT PANEL: Clean Auth Form Card (7 cols on lg) ---- */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 md:p-10 shadow-xl space-y-6">
          
          {/* Segmented Mode Switcher Bar */}
          <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200/80 grid grid-cols-2 gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`py-2.5 px-4 rounded-xl font-bold transition-all text-center ${
                mode === "login"
                  ? "bg-govt-navy text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold"
              }`}
            >
              OPERATOR SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`py-2.5 px-4 rounded-xl font-bold transition-all text-center ${
                mode === "register"
                  ? "bg-govt-navy text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold"
              }`}
            >
              REGISTER ACCOUNT
            </button>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-2xl font-extrabold text-govt-navy font-display">
              {mode === "login" ? "Sign In to Operator Console" : "Create Operator Account"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {mode === "login"
                ? "Enter your authorized credentials below to initiate your session."
                : "Fill out the registration form to request access to the PRAMAAN platform."}
            </p>
          </div>

          {/* Quick Demo Credentials Bar (Only in Sign In Mode) */}
          {mode === "login" && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>QUICK DEMO CREDENTIALS</span>
                <span className="text-emerald-700">ONE-CLICK FILL</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill("investigator@ntro.com", "INVESTIGATOR")}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-govt-navy hover:text-govt-navy hover:shadow-2xs transition-all text-left cursor-pointer"
                >
                  <div className="text-[10px] text-slate-400">ROLE</div>
                  <div className="font-bold text-slate-800 text-[11px]">Investigator</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@ntro.gov.in", "ADMINISTRATOR")}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-govt-navy hover:text-govt-navy hover:shadow-2xs transition-all text-left cursor-pointer"
                >
                  <div className="text-[10px] text-slate-400">ROLE</div>
                  <div className="font-bold text-slate-800 text-[11px]">Admin</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("auditor@ntro.gov.in", "AUDITOR")}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-govt-navy hover:text-govt-navy hover:shadow-2xs transition-all text-left cursor-pointer"
                >
                  <div className="text-[10px] text-slate-400">ROLE</div>
                  <div className="font-bold text-slate-800 text-[11px]">Auditor</div>
                </button>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium flex items-start gap-3 shadow-2xs">
              <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <div className="font-bold text-red-900 mb-0.5 font-display">Authentication Alert</div>
                <div className="leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "login" ? (
              /* ---- SIGN IN FORM ---- */
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                    Username / Official Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. operator@ntro.gov.in"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all font-medium"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-display">
                    Account Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-navy/20 transition-all font-medium"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21f-3-3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">ROLE:</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-govt-navy focus:outline-none focus:border-govt-navy cursor-pointer font-mono"
                    >
                      <option value="INVESTIGATOR">INVESTIGATOR</option>
                      <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                      <option value="AUDITOR">AUDITOR</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setError("Please contact your organization administrator or NTRO liaison to reset credentials.")}
                    className="text-xs font-semibold text-govt-blue hover:text-govt-navy hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-[#051329] via-[#0B2D4D] to-[#005BAC] hover:from-[#0B2D4D] hover:to-[#0284C7] text-white py-3.5 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 font-display mt-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-govt-gold" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Authenticating Operator...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign In to Operator Console</span>
                      <span className="text-sm">→</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* ---- REGISTRATION FORM ---- */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Officer R. Sharma"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none transition-all font-medium"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@ntro.gov.in"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none transition-all font-medium"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
                      Organization / Unit
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. Digital Forensics Unit"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none transition-all font-medium"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
                      Designated System Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-900 font-bold focus:border-govt-navy focus:bg-white focus:outline-none font-mono cursor-pointer"
                    >
                      <option value="INVESTIGATOR">INVESTIGATOR OFFICER</option>
                      <option value="AUDITOR">AUDITOR / FORENSIC ANALYST</option>
                      <option value="SUPERVISOR">SUPERVISOR / UNIT HEAD</option>
                      <option value="ADMINISTRATOR">SYSTEM ADMINISTRATOR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
                      Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none transition-all font-medium"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21f-3-3" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-govt-navy focus:bg-white focus:outline-none transition-all font-medium"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21f-3-3" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-govt-navy focus:ring-govt-navy cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer font-medium">
                    I agree to the <span className="text-govt-blue underline font-bold">Operating Guidelines</span> and <span className="text-govt-blue underline font-bold">Privacy Mandates</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-[#051329] via-[#0B2D4D] to-[#005BAC] hover:from-[#0B2D4D] hover:to-[#0284C7] text-white py-3.5 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 font-display mt-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-govt-gold" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Creating Operator Account...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Submit Operator Registration Request</span>
                      <span className="text-sm">→</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Mode Switch Prompt */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              {mode === "login" ? (
                <>
                  Need an operator account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(null); }}
                    className="text-govt-blue hover:text-govt-navy hover:underline font-bold cursor-pointer"
                  >
                    Request registration here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(null); }}
                    className="text-govt-blue hover:text-govt-navy hover:underline font-bold cursor-pointer"
                  >
                    Sign in to your console
                  </button>
                </>
              )}
            </p>
          </div>

        </div>

      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-xs text-slate-400 font-mono border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} National Technical Research Organisation (NTRO) · PRAMAAN Restricted Platform
      </footer>
    </div>
  );
}
