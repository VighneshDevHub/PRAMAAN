"use client";

import React from "react";

export type SanitizationStandard = "NIST_CLEAR" | "DOD_5220_22_M" | "CUSTOM";

export interface FileEraseStandardOption {
  value: SanitizationStandard;
  label: string;
  badge: string;
  passes: string;
  detail: string;
  gradient: string;
  icon: React.ReactNode;
}

export const FILE_ERASE_STANDARDS: FileEraseStandardOption[] = [
  {
    value: "NIST_CLEAR",
    label: "NIST SP 800-88 Rev. 2 Clear",
    badge: "Government Standard",
    passes: "1 Pass (Overwrite 0x00)",
    detail: "Single-pass logical overwrite for files, folders, and unallocated metadata structures with 100% block read-back verification.",
    gradient: "from-[#051329] to-[#0B2D4D]",
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    value: "DOD_5220_22_M",
    label: "DoD 5220.22-M Profile",
    badge: "Legacy Multi-Pass",
    passes: "3 Passes (0x00, 0xFF, Random)",
    detail: "3-pass overwrite profile with random character fill and read-back validation for military evidence disposal.",
    gradient: "from-[#0B2D4D] to-[#005BAC]",
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    value: "CUSTOM",
    label: "Custom Agent Overwrite",
    badge: "Configurable",
    passes: "Configurable Agent Passes",
    detail: "User-configured pass counts and custom bit patterns passed directly to the isolated file-eraser CLI agent.",
    gradient: "from-[#047857] to-[#10B981]",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export const STANDARDS = FILE_ERASE_STANDARDS;

export function FileEraserStepRail({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Target Paths" },
    { num: 2, label: "Erase Standard" },
    { num: 3, label: "Target Preview" },
    { num: 4, label: "Review & Queue" },
  ];

  return (
    <div className="w-full">
      <ol className="grid grid-cols-4 gap-3 relative">
        {steps.map((item) => {
          const active = item.num === step;
          const complete = item.num < step;
          return (
            <li key={item.num} className="relative flex flex-col group">
              {/* Progress Bar Line */}
              <div
                className={`h-2 w-full rounded-full transition-all duration-500 ${
                  complete
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm"
                    : active
                      ? "bg-gradient-to-r from-govt-navy via-govt-blue to-amber-500 shadow-md animate-pulse"
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
                  {complete ? "✓" : `0${item.num}`}
                </span>
                <div className="min-w-0">
                  <div
                    className={`font-mono text-[9px] uppercase tracking-wider font-bold ${
                      active ? "text-govt-navy" : complete ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    STAGE 0{item.num}
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
                    {item.label}
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

export function StandardCard({
  standard,
  selected,
  onSelect,
}: {
  standard: FileEraseStandardOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
        selected
          ? "border-govt-gold bg-white shadow-xl ring-2 ring-govt-gold/40 -translate-y-1"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Top Subtle Gradient Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${standard.gradient}`} />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${standard.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
            {standard.icon}
          </div>
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            selected ? "bg-govt-goldLight text-govt-navy border-govt-gold/50" : "bg-slate-100 text-slate-600 border-slate-200"
          }`}>
            {standard.badge}
          </span>
        </div>

        <div className="font-display text-base font-bold text-govt-navy group-hover:text-govt-blue transition-colors">
          {standard.label}
        </div>

        <div className="mt-1 font-mono text-[11px] font-bold text-govt-blue">
          {standard.passes}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 font-normal">
          {standard.detail}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">OVERWRITE PROFILE</span>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
            selected
              ? "border-govt-gold bg-govt-goldDark text-white shadow-xs"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          {selected && "✓"}
        </div>
      </div>
    </button>
  );
}
