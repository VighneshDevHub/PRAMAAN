"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface NtroLogoProps {
  variant?: "header" | "footer" | "dark" | "light" | "compact";
  showSubtitle?: boolean;
  className?: string;
  logoSrc?: string;
}

export function StateEmblemSvg({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      role="img"
      aria-label="State Emblem of India - Satyamev Jayate"
    >
      <path d="M 20 115 L 100 115 L 95 125 L 25 125 Z" fill="currentColor" opacity="0.9" />
      <rect x="25" y="108" width="70" height="7" rx="1" fill="currentColor" opacity="0.85" />
      <circle cx="60" cy="111.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="60" cy="111.5" r="0.8" fill="currentColor" />
      <path
        d="M 48 45 C 44 25, 52 12, 60 12 C 68 12, 76 25, 72 45 C 76 48, 80 58, 76 72 C 72 82, 68 95, 68 108 L 52 108 C 52 95, 48 82, 44 72 C 40 58, 44 48, 48 45 Z"
        fill="currentColor"
      />
      <path d="M 52 28 Q 60 22 68 28" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M 50 38 Q 60 30 70 38" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M 48 48 Q 60 40 72 48" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M 47 58 Q 60 50 73 58" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path
        d="M 32 50 C 26 36, 32 24, 40 22 C 44 32, 44 45, 42 55 C 38 65, 34 78, 32 92 C 30 100, 32 108, 38 108 L 30 108 C 24 95, 24 80, 26 65 C 28 58, 28 52, 32 50 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M 88 50 C 94 36, 88 24, 80 22 C 76 32, 76 45, 78 55 C 82 65, 86 78, 88 92 C 90 100, 88 108, 82 108 L 90 108 C 96 95, 96 80, 94 65 C 92 58, 92 52, 88 50 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <text
        x="60"
        y="136"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="bold"
        fontFamily="'Noto Sans Devanagari', 'Mangal', 'Segoe UI Historic', sans-serif"
        fill="currentColor"
      >
        सत्यमेव जयते
      </text>
    </svg>
  );
}

export function NtroGovernmentLogo({
  variant = "header",
  showSubtitle = true,
  className = "",
  logoSrc,
}: NtroLogoProps) {
  const [imgError, setImgError] = useState(false);
  let activeTheme = "govt-light";
  try {
    const themeCtx = useTheme();
    activeTheme = themeCtx.theme;
  } catch {
    // If rendered outside ThemeProvider, fallback to variant
  }

  const isDark = variant === "dark" || variant === "footer" || activeTheme === "dark";
  const isCompact = variant === "compact";

  const defaultImg = isDark ? "/ntro-logo2.png" : "/ntro-logo3.png";
  const imageToRender = logoSrc ?? defaultImg;

  const textColor = isDark ? "text-white" : "text-govt-navy";
  const mutedColor = isDark ? "text-white/70" : "text-muted";
  const emblemColor = isDark ? "text-[#EAB308]" : "text-govt-navy";

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {!imgError ? (
        <img
          src={imageToRender}
          alt="NTRO - National Technical Research Organisation"
          className={`${isCompact ? "h-8" : "h-11"} w-auto object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`shrink-0 ${emblemColor}`}>
          <StateEmblemSvg className={isCompact ? "h-8 w-auto" : "h-11 w-auto"} />
        </div>
      )}

      {/* Vertical Divider */}
      <div className={`h-8 w-px ${isDark ? "bg-white/25" : "bg-line"}`} />

      {/* Project Name Typography */}
      <div className="leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-bold tracking-tight ${isCompact ? "text-base" : "text-lg"} ${textColor}`}>
            PRAMAAN
          </span>
          <span className="inline-block rounded-xs bg-govt-gold/20 px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-govt-navy">
            GOVT OF INDIA
          </span>
        </div>
        {showSubtitle && (
          <div className={`mt-1 font-mono uppercase tracking-[0.18em] ${isCompact ? "text-[8px]" : "text-[9px]"} ${mutedColor}`}>
            NTRO · Digital Forensics Platform
          </div>
        )}
      </div>
    </div>
  );
}

export function GovernmentTopHeaderBar() {
  const [visible, setVisible] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [language, setLanguage] = useState<string>("en");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderAnnounce, setScreenReaderAnnounce] = useState("");

  const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "mr", label: "मराठी (Marathi)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "gu", label: "ગુજરાતી (Gujarati)" },
    { code: "bn", label: "বাংলা (Bengali)" },
    { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  ];

  // Load Google Translate script for full webpage translation
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      (window as unknown as Record<string, unknown>).googleTranslateElementInit = () => {
        const win = window as unknown as Record<string, any>;
        if (win.google?.translate?.TranslateElement) {
          new win.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,hi,mr,ta,te,gu,bn,kn",
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };
    }
  }, []);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem("pramaan_font_scale") as "sm" | "md" | "lg" | null;
      const savedLang = localStorage.getItem("pramaan_lang");
      const savedContrast = localStorage.getItem("pramaan_high_contrast") === "true";

      if (savedSize) applyFontSize(savedSize, false);
      if (savedLang) setLanguage(savedLang);
      if (savedContrast) applyHighContrast(true, false);
    } catch {
      // Degrade gracefully if localStorage is unavailable
    }
  }, []);

  // Keyboard shortcut handler (Alt+S for Skip, Alt+A for Accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        triggerSkipToContent();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setAccessibilityModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const announceToScreenReader = (msg: string) => {
    setScreenReaderAnnounce(msg);
    setTimeout(() => setScreenReaderAnnounce(""), 4000);
  };

  const applyFontSize = (size: "sm" | "md" | "lg", announce = true) => {
    setFontSize(size);
    try {
      localStorage.setItem("pramaan_font_scale", size);
    } catch {}

    const root = document.documentElement;
    if (size === "sm") root.style.fontSize = "92%";
    else if (size === "lg") root.style.fontSize = "108%";
    else root.style.fontSize = "100%";

    if (announce) {
      announceToScreenReader(
        `Font size set to ${size === "sm" ? "Small (92%)" : size === "lg" ? "Large (108%)" : "Normal (100%)"}`
      );
    }
  };

  const applyHighContrast = (enable: boolean, announce = true) => {
    setHighContrast(enable);
    try {
      localStorage.setItem("pramaan_high_contrast", String(enable));
    } catch {}

    if (enable) {
      document.documentElement.classList.add("high-contrast-mode");
    } else {
      document.documentElement.classList.remove("high-contrast-mode");
    }

    if (announce) {
      announceToScreenReader(`High Contrast mode ${enable ? "enabled" : "disabled"}`);
    }
  };

  const triggerSkipToContent = () => {
    const mainEl = document.getElementById("main-content") || document.querySelector("main") || document.body;
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: "smooth" });
      mainEl.setAttribute("tabIndex", "-1");
      mainEl.focus();
      announceToScreenReader("Skipped to main content");
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setLangDropdownOpen(false);
    try {
      localStorage.setItem("pramaan_lang", langCode);
    } catch {}

    // Set Google Translate cookie for full webpage translation
    if (typeof window !== "undefined") {
      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
      document.cookie = `googtrans=/en/${langCode}; path=/`;

      const googleCombo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (googleCombo) {
        googleCombo.value = langCode;
        googleCombo.dispatchEvent(new Event("change"));
      } else {
        window.location.reload();
      }
    }
    announceToScreenReader(`Language changed to ${langCode}`);
  };

  if (!visible) return null;

  return (
    <>
      {/* Hidden Container for Google Translate Element */}
      <div id="google_translate_element" className="hidden" />

      {/* Live Region for Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {screenReaderAnnounce}
      </div>

      <div className="border-b border-govt-navy/10 bg-[#051329] text-white text-[11px] relative z-[100]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-1.5 md:px-8">
          
          {/* Left Side: Flag & Made in India / NTRO Tag */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInfoModalOpen(true)}
              className="flex items-center gap-1.5 font-medium text-white/90 hover:text-white transition-colors cursor-pointer group"
              title="View NTRO & Made In India Mandate Information"
            >
              <span className="inline-block h-2.5 w-3.5 bg-gradient-to-b from-[#FF9933] via-white to-[#128807] rounded-xs shadow-xs group-hover:scale-105 transition-transform" />
              <span>
                {language === "hi" ? "भारत में निर्मित  |  एनटीआरओ" : "MADE IN INDIA  |  NTRO"}
              </span>
              <span className="text-[9px] bg-white/10 text-govt-gold px-1 rounded font-mono group-hover:bg-white/20">
                INFO
              </span>
            </button>
          </div>

          {/* Right Side: Accessibility, Language Controls & Dismiss X Button */}
          <div className="flex items-center gap-3 text-white/80">
            {/* Skip to Main Content Link */}
            <button
              type="button"
              onClick={triggerSkipToContent}
              className="hover:text-white transition-colors hidden md:inline text-[11px] underline underline-offset-2 cursor-pointer"
              title="Shortcut: Alt + S"
            >
              {language === "hi" ? "मुख्य विषयवस्तु पर जाएं" : "Skip to Main Content"}
            </button>

            <span className="hidden text-white/30 md:inline">|</span>

            {/* Screen Reader Access Modal Button */}
            <button
              type="button"
              onClick={() => setAccessibilityModalOpen(true)}
              className="hover:text-white transition-colors hidden md:flex items-center gap-1 text-[11px] cursor-pointer"
              title="Screen Reader Access & Accessibility Options (Alt + A)"
            >
              <svg className="w-3 h-3 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span>{language === "hi" ? "स्क्रीन रीडर एक्सेस" : "Screen Reader Access"}</span>
            </button>

            <span className="hidden text-white/30 md:inline">|</span>

            {/* Font Sizing Controls */}
            <div className="flex items-center gap-1 font-mono text-[10px] bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
              <span className="text-[9px] text-white/50 mr-0.5 hidden sm:inline">Text:</span>
              <button
                type="button"
                onClick={() => applyFontSize("sm")}
                className={`px-1 py-0.5 rounded text-[10px] transition-colors ${
                  fontSize === "sm" ? "bg-govt-gold text-govt-navy font-bold" : "hover:text-white hover:bg-white/10"
                }`}
                title="Decrease Text Size (Small)"
                aria-label="Decrease Text Size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => applyFontSize("md")}
                className={`px-1 py-0.5 rounded text-[10px] transition-colors ${
                  fontSize === "md" ? "bg-govt-gold text-govt-navy font-bold" : "hover:text-white hover:bg-white/10"
                }`}
                title="Reset Standard Text Size"
                aria-label="Reset Standard Text Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => applyFontSize("lg")}
                className={`px-1 py-0.5 rounded text-[10px] transition-colors ${
                  fontSize === "lg" ? "bg-govt-gold text-govt-navy font-bold" : "hover:text-white hover:bg-white/10"
                }`}
                title="Increase Text Size (Large)"
                aria-label="Increase Text Size"
              >
                A+
              </button>
            </div>

            <span className="hidden text-white/30 md:inline">|</span>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-[11px] text-white font-medium hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded border border-white/15 transition-colors cursor-pointer"
                aria-expanded={langDropdownOpen}
                aria-haspopup="true"
              >
                <svg className="w-3.5 h-3.5 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>
                  {LANGUAGES.find((l) => l.code === language)?.label || "English"}
                </span>
                <span className="text-[9px] text-white/60">▾</span>
              </button>

              {langDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown on outside click */}
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg bg-[#07172B] border border-govt-gold/40 shadow-2xl py-1.5 z-[9999] text-white divide-y divide-white/10">
                    <div className="px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-govt-gold font-bold">
                      Translate Page / भाषा चुनें
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-white/15 transition-colors ${
                            language === lang.code ? "text-govt-gold font-bold bg-white/10" : "text-white/90"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold uppercase bg-govt-gold/20 text-govt-gold px-1.5 py-0.5 rounded border border-govt-gold/30">
                              {lang.code.toUpperCase()}
                            </span>
                            <span>{lang.label}</span>
                          </span>
                          {language === lang.code && <span className="text-govt-gold font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="text-white/30">|</span>

            {/* Dismiss / Cancel Icon Button on Far Right */}
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="flex items-center justify-center p-1 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer ml-1"
              title="Close Top Header Bar"
              aria-label="Close Top Header Bar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Screen Reader Access & Accessibility Modal */}
      {accessibilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#0B2D4D] text-white border border-white/20 rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setAccessibilityModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-lg font-bold p-1 cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-white/15 pb-3">
              <div className="h-10 w-10 rounded-full bg-govt-gold/20 flex items-center justify-center text-govt-gold">
                <svg className="w-5 h-5 text-govt-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="4" r="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 13v-2a2 2 0 00-2-2h-3l-2.5-4.5A2 2 0 009.8 3.6L5.5 6.5A2 2 0 004.8 9.3l2.2 3.8A2 2 0 008.7 14H11v6a2 2 0 002 2h2a2 2 0 002-2v-4.5l2.5 1.5a2 2 0 002.8-.7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === "hi" ? "स्क्रीन रीडर और सुगम्यता पोर्टल" : "Screen Reader & Accessibility Portal"}
                </h3>
                <p className="text-xs text-white/70">
                  {language === "hi" ? "भारत सरकार GIGW 3.0 दिशानिर्देश अनुपालन" : "GIGW 3.0 Guidelines for Indian Government Websites"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs text-white/90 max-h-96 overflow-y-auto pr-1">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <h4 className="font-bold text-govt-gold mb-1">Supported Screen Readers</h4>
                <p className="text-white/80 leading-relaxed">
                  PRAMAAN is optimized for standard screen readers in compliance with WCAG 2.1 AA and GIGW standards:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-white/70 font-mono text-[11px]">
                  <li>NVDA (NonVisual Desktop Access) on Windows</li>
                  <li>JAWS (Job Access With Speech)</li>
                  <li>Apple VoiceOver on macOS / iOS</li>
                  <li>Google TalkBack on Android</li>
                </ul>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <h4 className="font-bold text-govt-gold mb-1">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-2">
                  <div className="bg-white/5 p-2 rounded">
                    <span className="text-white font-bold">Alt + S</span>
                    <p className="text-white/60 text-[10px]">Skip to Main Content</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <span className="text-white font-bold">Alt + A</span>
                    <p className="text-white/60 text-[10px]">Open Accessibility Dialog</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <span className="text-white font-bold">Tab / Shift+Tab</span>
                    <p className="text-white/60 text-[10px]">Navigate Controls</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <span className="text-white font-bold">Esc</span>
                    <p className="text-white/60 text-[10px]">Close Active Dialog</p>
                  </div>
                </div>
              </div>

              {/* High Contrast Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <h4 className="font-bold text-white">High Contrast Mode</h4>
                  <p className="text-[11px] text-white/70">Enhance background contrast for low-vision reading</p>
                </div>
                <button
                  type="button"
                  onClick={() => applyHighContrast(!highContrast)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    highContrast
                      ? "bg-govt-gold text-govt-navy"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {highContrast ? "Enabled ✓" : "Enable"}
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-white/15 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setAccessibilityModalOpen(false)}
                className="px-4 py-1.5 bg-govt-gold hover:bg-yellow-500 text-govt-navy font-bold rounded text-xs transition-colors"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Made In India / NTRO Info Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#0B2D4D] text-white border border-white/20 rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setInfoModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-lg font-bold p-1 cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-white/15 pb-3">
              <span className="inline-block h-6 w-8 bg-gradient-to-b from-[#FF9933] via-white to-[#128807] rounded-xs shadow-md" />
              <div>
                <h3 className="text-base font-bold text-white">
                  NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
                </h3>
                <p className="text-xs text-govt-gold font-mono">PRAMAAN Platform Compliance & Mandate</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-white/90 leading-relaxed">
              <p>
                <strong>PRAMAAN</strong> is a 100% indigenous Digital Forensics, Data Sanitization, and File Recovery solution engineered under the auspices of the <strong>National Technical Research Organisation (NTRO)</strong>, Government of India.
              </p>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/60">Standard:</span>
                  <span className="text-govt-gold font-bold">NIST SP 800-88 Rev. 1 Compliant</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/60">Verification:</span>
                  <span className="text-white font-bold">ECDSA + SHA-256 Hash Chain</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Deployment:</span>
                  <span className="text-white font-bold">Air-gapped & Secure Enterprise</span>
                </div>
              </div>

              <p className="text-white/70 text-[11px]">
                Certified for use across Government Ministries, Law Enforcement Agencies, and National Security Organizations.
              </p>
            </div>

            <div className="mt-5 border-t border-white/15 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
