"use client";

import React from "react";

export type ScanMode = "quick" | "deep" | "deleted" | "partition" | "custom";

export interface ScanModeOption {
  value: ScanMode;
  label: string;
  badge: string;
  detail: string;
  gradient: string;
  icon: React.ReactNode;
}

export const RECOVERY_SCAN_MODES: ScanModeOption[] = [
  {
    value: "quick",
    label: "Quick Inspection Scan",
    badge: "Fast Pass",
    detail: "Fast inspection over accessible filesystem tables, NTFS MFT records, and EXT inode indices.",
    gradient: "from-[#051329] to-[#0B2D4D]",
    icon: (
      <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: "deep",
    label: "Deep Signature Carving",
    badge: "Recommended",
    detail: "Header/footer signature carving across raw disk blocks with structural file reconstruction.",
    gradient: "from-[#0B2D4D] to-[#005BAC]",
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
  },
  {
    value: "deleted",
    label: "Deleted & Orphaned Nodes",
    badge: "Unallocated Space",
    detail: "Prioritizes unallocated clusters, unlinked directory entries, and deleted file remnants.",
    gradient: "from-[#047857] to-[#10B981]",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    value: "partition",
    label: "Partition Boundary Repair",
    badge: "Volume Repair",
    detail: "Analyzes corrupted or lost MBR/GPT partition tables and raw volume headers.",
    gradient: "from-[#B8860B] to-[#D4AF37]",
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a2 2 0 01-4 0V4zM4 7a2 2 0 114 0v1a2 2 0 01-4 0V7zM18 7a2 2 0 114 0v1a2 2 0 01-4 0V7zM8 13a2 2 0 114 0v1a2 2 0 01-4 0v-1zM16 13a2 2 0 114 0v1a2 2 0 01-4 0v-1zM12 18a2 2 0 114 0v1a2 2 0 01-4 0v-1z" />
      </svg>
    ),
  },
  {
    value: "custom",
    label: "Custom Forensics Profile",
    badge: "Advanced",
    detail: "Applies evidence-specific rule sets, target hex offset masks, and custom header magic numbers.",
    gradient: "from-[#4338CA] to-[#6366F1]",
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export interface FileTypeCategory {
  id: string;
  label: string;
  desc: string;
  badge: string;
  icon: React.ReactNode;
}

export const RECOVERY_FILE_TYPES: FileTypeCategory[] = [
  {
    id: "Documents",
    label: "Documents & Evidence",
    desc: "PDF, DOCX, XLSX, PPTX, TXT",
    badge: "DOCUMENTS",
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "Images",
    label: "Forensic Media & Images",
    desc: "PNG, JPG, RAW, HEIC, TIFF",
    badge: "IMAGES",
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "Videos",
    label: "Video Recordings",
    desc: "MP4, AVI, MOV, MKV, FLV",
    badge: "VIDEO",
    icon: (
      <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "Audio",
    label: "Audio & Voice Logs",
    desc: "MP3, WAV, FLAC, M4A, AAC",
    badge: "AUDIO",
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    id: "Email",
    label: "Email & Chat Logs",
    desc: "PST, EML, MSG, DB, OST",
    badge: "MESSAGING",
    icon: (
      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "Database",
    label: "Databases & Stores",
    desc: "SQLITE, MDB, EDB, ACCDB",
    badge: "DATABASES",
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
];

export const SCAN_MODES = RECOVERY_SCAN_MODES;
export const FILE_TYPES = RECOVERY_FILE_TYPES;

export function RecoveryStepRail({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Evidence Source" },
    { num: 2, label: "Scan Profile" },
    { num: 3, label: "File Categories" },
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
                      ? "bg-gradient-to-r from-govt-navy via-govt-blue to-sky-500 shadow-md animate-pulse"
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

export function ScanProfileCard({
  mode,
  selected,
  onSelect,
}: {
  mode: ScanModeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden ${
        selected
          ? "border-govt-blue bg-white shadow-xl ring-2 ring-govt-blue/30 -translate-y-1"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Top Subtle Gradient Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mode.gradient}`} />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${mode.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
            {mode.icon}
          </div>
          <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            selected ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"
          }`}>
            {mode.badge}
          </span>
        </div>

        <div className="font-display text-base font-bold text-govt-navy group-hover:text-govt-blue transition-colors">
          {mode.label}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 font-normal">
          {mode.detail}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">CARVING GRANULARITY</span>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
            selected
              ? "border-govt-navy bg-govt-navy text-white shadow-xs"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          {selected && "✓"}
        </div>
      </div>
    </button>
  );
}

export function RecoveryReviewTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && <span className="p-1 rounded-lg bg-white border border-slate-200 text-govt-navy">{icon}</span>}
      </div>
      <div className="mt-2 truncate font-display text-base font-bold text-govt-navy">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500 font-medium">{hint}</div>}
    </div>
  );
}
