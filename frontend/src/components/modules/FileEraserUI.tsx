"use client";

import React from "react";

export type SanitizationStandard = "NIST_CLEAR" | "DOD_5220_22_M" | "CUSTOM";

export const FILE_ERASE_STANDARDS: Array<{
  value: SanitizationStandard;
  label: string;
  badge: string;
  passes: string;
  detail: string;
  icon: string;
}> = [
  {
    value: "NIST_CLEAR",
    label: "NIST SP 800-88 Rev. 1 Clear",
    badge: "Government Standard",
    passes: "1 Pass (Overwrite 0x00)",
    detail: "Single-pass logical overwrite for files, folders, and unallocated metadata structures.",
    icon: "🛡️",
  },
  {
    value: "DOD_5220_22_M",
    label: "DoD 5220.22-M Profile",
    badge: "Legacy Multi-Pass",
    passes: "3 Passes (0x00, 0xFF, Random)",
    detail: "3-pass overwrite profile with random character fill and read-back validation.",
    icon: "🔒",
  },
  {
    value: "CUSTOM",
    label: "Custom Agent Overwrite",
    badge: "Configurable",
    passes: "Configurable Agent Passes",
    detail: "User-configured pass counts and custom bit patterns passed directly to the agent.",
    icon: "⚡",
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
                      ? "bg-govt-gold"
                      : "bg-line"
                }`}
              />
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    complete
                      ? "bg-govt-greenLight text-govt-green border border-govt-green/30"
                      : active
                        ? "bg-govt-goldDark text-white"
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

export function StandardCard({
  standard,
  selected,
  onSelect,
}: {
  standard: (typeof FILE_ERASE_STANDARDS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-govt-gold bg-govt-goldLight/40 shadow-md ring-1 ring-govt-gold dark:bg-govt-goldDark/30"
          : "border-line bg-panel hover:border-govt-gold/40 hover:bg-field"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl">{standard.icon}</span>
          <span className={`fg-badge ${selected ? "fg-badge--gold" : ""}`}>
            {standard.badge}
          </span>
        </div>
        <div className="mt-3 font-display text-sm font-semibold text-main">
          {standard.label}
        </div>
        <div className="mt-1 font-mono text-[11px] font-medium text-govt-navy dark:text-govt-gold">
          {standard.passes}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{standard.detail}</p>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <span
          className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
            selected
              ? "border-govt-gold bg-govt-goldDark text-white"
              : "border-line bg-field"
          }`}
        >
          {selected && "✓"}
        </span>
      </div>
    </button>
  );
}
