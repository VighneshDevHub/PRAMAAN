"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthError, getToken, login, register } from "@/lib/auth";
import { NtroGovernmentLogo } from "@/components/NtroGovernmentLogo";

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const reservedDomain = /@(test|example|invalid|localhost)$/i.test(normalizedEmail);
      if (!normalizedEmail || !normalizedEmail.includes("@") || reservedDomain || password.length < 8) {
        throw new AuthError(
          "Please enter a valid email address (e.g. user@ntro.gov.in) and a password of at least 8 characters."
        );
      }

      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new AuthError("Passwords do not match. Please verify your password.");
        }
        if (!agreeTerms) {
          throw new AuthError("You must agree to the Terms of Use and Privacy Policy.");
        }
        await register(normalizedEmail, password, role);
      }

      await login(normalizedEmail, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Authentication failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* ========================================== TOP HEADER BAR */}
      <header className="w-full border-b border-slate-200 bg-white px-6 py-3.5 flex items-center justify-between shadow-xs">
        <Link href="/" className="inline-flex items-center gap-3">
          <NtroGovernmentLogo variant="header" showSubtitle={true} />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* ========================================== MAIN SPLIT LAYOUT */}
      <main className="flex-1 grid lg:grid-cols-2 max-w-7xl w-full mx-auto p-4 md:p-8 items-center gap-8">
        
        {/* ---- LEFT PANEL: Dark Navy Institutional Branding ---- */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#051329] via-[#0B2D4D] to-[#07172B] text-white p-8 md:p-12 flex flex-col justify-between min-h-[580px] shadow-xl border border-white/10">
          {/* Subtle background glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(600px 300px at 10% 20%, rgba(212,175,55,0.2), transparent 70%), radial-gradient(600px 300px at 90% 80%, rgba(0,91,172,0.3), transparent 70%)",
            }}
          />

          <div className="relative z-10 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>{mode === "login" ? "Sign In to" : "Create Your Account"}</span>
                <span className="text-govt-gold font-display">
                  {mode === "login" ? "PRAMAAN" : "Join PRAMAAN"}
                </span>
              </h1>
              <div className="h-1 w-16 bg-govt-gold rounded-full mt-3" />
            </div>

            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-md">
              {mode === "login"
                ? "Secure access to digital forensics and data sanitization platform."
                : "Create an account to request access to the digital forensics platform."}
            </p>

            {/* Feature List */}
            <div className="space-y-6 pt-4">
              {mode === "login" ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-govt-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Role-based secure access</h4>
                      <p className="text-xs text-white/70 mt-0.5">Controlled access based on roles and permissions.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-govt-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">End-to-end encryption</h4>
                      <p className="text-xs text-white/70 mt-0.5">All data is encrypted in transit and at rest.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-govt-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Audit &amp; accountability</h4>
                      <p className="text-xs text-white/70 mt-0.5">All actions are logged with immutable audit trails.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-govt-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Request platform access</h4>
                      <p className="text-xs text-white/70 mt-0.5">Submit request for access and our team will review and approve.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-govt-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Secure &amp; compliant</h4>
                      <p className="text-xs text-white/70 mt-0.5">Built with security and compliance as the core principle.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 p-2.5 rounded-full bg-white/10 border border-white/15 text-govt-gold">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Trusted by professionals</h4>
                      <p className="text-xs text-white/70 mt-0.5">Used by investigative agencies and forensic experts.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Architectural Line Illustration Graphic */}
          <div className="relative z-10 pt-8 opacity-25">
            <svg viewBox="0 0 500 80" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-16 text-white">
              <path d="M10 70 h480 M30 70 V40 H80 V70 M100 70 V30 H150 V70 M130 30 L125 15 L120 30 M170 70 V50 H220 V70 M240 70 V20 H300 V70 M270 20 L270 10 M320 70 V40 H370 V70 M390 70 V30 H450 V70" />
            </svg>
          </div>
        </div>

        {/* ---- RIGHT PANEL: Clean Auth Form Card ---- */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? "Welcome Back!" : "Create Account"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === "login"
                ? "Enter your credentials to continue"
                : "Fill in your details to get started"}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "login" ? (
              /* ---- LOGIN FORM ---- */
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username / Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <span className="text-slate-500 font-mono text-[10px]">Role:</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                      className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="INVESTIGATOR">Investigator</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="SUPERVISOR">Supervisor</option>
                    </select>
                  </label>

                  <a href="#" onClick={(e) => { e.preventDefault(); setError("Please contact your NTRO Administrator to reset credentials."); }} className="text-blue-600 hover:underline font-semibold">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#051329] hover:bg-[#0B2D4D] text-white py-3 px-4 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>{submitting ? "Signing In..." : "Sign In"}</span>
                </button>
              </>
            ) : (
              /* ---- REGISTER FORM ---- */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organization / Department
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Enter your organization"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation &amp; Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="INVESTIGATOR">Investigator Officer</option>
                      <option value="AUDITOR">Auditor / Forensic Analyst</option>
                      <option value="SUPERVISOR">Supervisor / Unit Head</option>
                      <option value="ADMINISTRATOR">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      tabIndex={-1}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-600 cursor-pointer">
                    I agree to the <span className="text-blue-600 underline font-medium">Terms of Use</span> and <span className="text-blue-600 underline font-medium">Privacy Policy</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#051329] hover:bg-[#0B2D4D] text-white py-3 px-4 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>{submitting ? "Creating Account..." : "Create Account"}</span>
                </button>
              </>
            )}
          </form>

          {/* Mode Switch Divider & Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              {mode === "login" ? (
                <>
                  New to PRAMAAN?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(null); }}
                    className="text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(null); }}
                    className="text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-xs text-slate-400 font-mono">
        © {new Date().getFullYear()} National Technical Research Organisation (NTRO) · PRAMAAN Forensic Portal
      </footer>
    </div>
  );
}
