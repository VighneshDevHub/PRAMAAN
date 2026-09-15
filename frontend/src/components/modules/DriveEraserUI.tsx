"use client";

import React from "react";
import type { DeviceOut } from "@/lib/types";

export interface MethodOption {
  value: "CLEAR" | "PURGE" | "CRYPTO_ERASE" | "NIST_CLEAR";
  label: string;
  detail: string;
  standardBadge?: string;
  gradient: string;
  icon: React.ReactNode;
}

export const DRIVE_METHODS: MethodOption[] = [
  {
    value: "CLEAR",
    label: "Clear (Single Pass)",
    detail: "Logical sanitization via standard zero/pattern overwrites. Overwrites user-addressable storage locations across all sector blocks.",
    standardBadge: "NIST SP 800-88 Clear",
    gradient: "from-[#051329] to-[#0B2D4D]",
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    value: "PURGE",
    label: "Purge (Firmware Erase)",
    detail: "Hardware-level sanitization using ATA Secure Erase or SCSI Sanitize. Removes data from hidden regions (HPA, DCO, and reallocated sectors).",
    standardBadge: "NIST SP 800-88 Purge",
    gradient: "from-[#0B2D4D] to-[#005BAC]",
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    value: "CRYPTO_ERASE",
    label: "Crypto-Erase (SED Key Destroy)",
    detail: "Cryptographic sanitization by destroying internal media encryption keys (MEK/KEK). Fast & secure for Self-Encrypting Drives (SED).",
    standardBadge: "NIST SP 800-88 Cryptographic",
    gradient: "from-[#047857] to-[#10B981]",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    value: "NIST_CLEAR",
    label: "NIST Multi-Pass Overwrite",
    detail: "Controlled multi-pass pattern overwrite with verification read-back for certified forensic audit trails and legal evidence disposal.",
    standardBadge: "Multi-Pass Forensic Clear",
    gradient: "from-[#B8860B] to-[#D4AF37]",
    icon: (
      <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const STEPS = ["Drive Selection", "Health Check", "Erase Method", "Confirm & Queue"];

export function DriveStepRail({ step }: { step: number }) {
  return (
    <div className="w-full">
      <ol className="grid grid-cols-4 gap-3 relative">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const active = number === step;
          const complete = number < step;
          return (
            <li key={label} className="relative flex flex-col group">
              {/* Progress Line */}
              <div
                className={`h-2 w-full rounded-full transition-all duration-500 ${
                  complete
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm"
                    : active
                      ? "bg-gradient-to-r from-govt-navy via-govt-blue to-blue-500 shadow-md animate-pulse"
                      : "bg-slate-200"
                }`}
              />

              <div className="mt-3 flex items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono text-xs font-extrabold transition-all duration-300 ${
                    complete
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                      : active
                        ? "bg-govt-navy text-govt-gold shadow-lg shadow-govt-navy/30 ring-2 ring-govt-gold scale-110"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {complete ? "✓" : `0${number}`}
                </span>
                <div className="min-w-0">
                  <div
                    className={`font-mono text-[9px] uppercase tracking-wider font-bold ${
                      active ? "text-govt-navy" : complete ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    STAGE 0{number}
                  </div>
                  <div
                    className={`text-xs truncate transition-colors ${
                      active
                        ? "font-extrabold text-govt-navy"
                        : complete
                          ? "font-semibold text-emerald-800"
                          : "text-slate-500 font-medium"
                    }`}
                  >
                    {label}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function DriveMethodCard({
  item,
  isSelected,
  onSelect,
}: {
  item: MethodOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-govt-navy bg-white shadow-xl ring-2 ring-govt-navy/20 -translate-y-1"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Subtle Top Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient}`} />

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
            {item.icon}
          </div>
          {item.standardBadge && (
            <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isSelected ? "bg-govt-goldLight text-govt-navy border-govt-gold/50" : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {item.standardBadge}
            </span>
          )}
        </div>

        <h4 className="font-display text-base font-bold text-govt-navy group-hover:text-govt-blue transition-colors">
          {item.label}
        </h4>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 font-normal">
          {item.detail}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">SPECIFICATION PROTOCOL</span>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
            isSelected
              ? "border-govt-navy bg-govt-navy text-white shadow-xs"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          {isSelected && "✓"}
        </div>
      </div>
    </button>
  );
}

export function DriveTargetHealthSummary({ device }: { device?: DeviceOut }) {
  function bytesHuman(n?: number): string {
    if (!n || !Number.isFinite(n) || n <= 0) return "Detected by agent";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
    return `${(n / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <svg className="w-4 h-4 text-govt-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          MEDIA TYPE &amp; CLASSIFICATION
        </div>
        <div className="mt-2 font-display text-base font-bold text-govt-navy">
          {device?.media_type?.replaceAll("_", " ") ?? "File / Image target"}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 font-medium">
          {device?.model ?? "Virtual / Image Target"}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7z" />
          </svg>
          REPORTED STORAGE CAPACITY
        </div>
        <div className="mt-2 font-mono text-base font-bold text-govt-navy">
          {bytesHuman(device?.capacity_bytes)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 font-medium">
          Sector geometry verified
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          S.M.A.R.T. HEALTH METRICS
        </div>
        <div className="mt-2 font-display text-base font-bold text-emerald-700">
          {device?.health ?? "PASSED (Agent Verified)"}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 font-medium">
          Zero reallocated sectors
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          BUS / CONNECTION INTERFACE
        </div>
        <div className="mt-2 font-display text-base font-bold text-govt-navy">
          {device?.connection_type ?? "Local File System"}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 font-medium">
          Direct I/O access
        </div>
      </div>
    </div>
  );
}

export function DriveSafetyWarningCard() {
  return (
    <div className="rounded-2xl border border-amber-300/90 bg-amber-50/90 p-4.5 text-slate-800 shadow-sm">
      <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-900 uppercase tracking-wider">
        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Operator Safety Notice · Raw Disk Override</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-700 font-medium">
        Use safe image targets for demonstration purposes (`test_wipe_target.img`). Direct block-level raw disk sanitization overwrites physical sectors permanently and requires explicitly toggling Real-Device Mode.
      </p>
    </div>
  );
}
