"use client";

import React from "react";

export type ScanMode = "quick" | "deep" | "deleted" | "partition" | "custom";

export const RECOVERY_SCAN_MODES: Array<{
  value: ScanMode;
  label: string;
  badge: string;
  detail: string;
  icon: string;
}> = [
  {
    value: "quick",
    label: "Quick Scan",
    badge: "Fast Pass",
    detail: "Fast inspection over accessible filesystem tables and MFT records.",
    icon: "⚡",
  },
  {
    value: "deep",
    label: "Deep Carving Scan",
    badge: "Recommended",
    detail: "Signature-based raw carving across full disk image blocks.",
    icon: "🔍",
  },
  {
    value: "deleted",
    label: "Deleted & Orphaned Files",
    badge: "Unallocated Space",
    detail: "Prioritizes unallocated clusters and unlinked directory nodes.",
    icon: "🗑️",
  },
  {
    value: "partition",
    label: "Partition Boundary Scan",
    badge: "Volume Repair",
    detail: "Analyzes corrupted or lost MBR/GPT partition boundaries.",
    icon: "🧩",
  },
  {
    value: "custom",
    label: "Custom Forensics Profile",
    badge: "Advanced",
    detail: "Applies evidence-specific rule sets and custom header signatures.",
    icon: "⚙️",
  },
];

export const RECOVERY_FILE_TYPES = [
  { id: "Documents", label: "Documents", desc: "PDF, DOCX, XLSX, TXT", icon: "📄" },
  { id: "Images", label: "Images", desc: "PNG, JPG, RAW, HEIC", icon: "🖼️" },
  { id: "Videos", label: "Videos", desc: "MP4, AVI, MOV, MKV", icon: "🎥" },
  { id: "Audio", label: "Audio", desc: "MP3, WAV, FLAC, M4A", icon: "🎵" },
  { id: "Email", label: "Email & Chat", desc: "PST, EML, MSG, DB", icon: "✉️" },
  { id: "Database", label: "Databases", desc: "SQLITE, MDB, EDB", icon: "🗄️" },
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
      <ol className="grid grid-cols-4 gap-3">
        {steps.map((item) => {
          const active = item.num === step;
          const complete = item.num < step;
          return (
            <li key={item.num} className="flex flex-col">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                  complete
                    ? "bg-govt-green"
                    : active
                      ? "bg-govt-blue"
                      : "bg-line"
                }`}
              />
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    complete
                      ? "bg-govt-greenLight text-govt-green border border-govt-green/30"
                      : active
                        ? "bg-govt-navy text-white"
                        : "bg-field text-muted border border-line"
                  }`}
                >
                  {complete ? "✓" : `0${item.num}`}
                </span>
                <span
                  className={`text-xs font-medium truncate ${
                    active ? "text-govt-navy font-semibold dark:text-white" : complete ? "text-govt-green font-medium" : "text-muted"
                  }`}
                >
                  {item.label}
                </span>
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
  mode: (typeof RECOVERY_SCAN_MODES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-govt-blue bg-govt-blueLight/50 shadow-md ring-1 ring-govt-blue dark:bg-govt-blueDark/40"
          : "border-line bg-panel hover:border-govt-blue/40 hover:bg-field"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl">{mode.icon}</span>
          <span className={`fg-badge ${selected ? "fg-badge--navy" : ""}`}>
            {mode.badge}
          </span>
        </div>
        <div className="mt-3 font-display text-sm font-semibold text-main">
          {mode.label}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{mode.detail}</p>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <span
          className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
            selected
              ? "border-govt-blue bg-govt-navy text-white"
              : "border-line bg-field"
          }`}
        >
          {selected && "✓"}
        </span>
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
  icon?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-field p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className="mt-1.5 truncate font-display text-sm font-semibold text-main">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}
