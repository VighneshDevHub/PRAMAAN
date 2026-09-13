"use client";

import type { DeviceOut } from "@/lib/types";

export interface MethodOption {
  value: "CLEAR" | "PURGE" | "CRYPTO_ERASE" | "NIST_CLEAR";
  label: string;
  detail: string;
  standardBadge?: string;
}

export const DRIVE_METHODS: MethodOption[] = [
  {
    value: "CLEAR",
    label: "Clear",
    detail: "Logical sanitization via standard zero/pattern overwrites. Overwrites user-addressable storage locations.",
    standardBadge: "NIST SP 800-88 Clear",
  },
  {
    value: "PURGE",
    label: "Purge",
    detail: "Hardware-level sanitization using ATA Secure Erase or SCSI Sanitize. Removes data from hidden areas (HPA/DCO).",
    standardBadge: "NIST SP 800-88 Purge",
  },
  {
    value: "CRYPTO_ERASE",
    label: "Crypto-Erase",
    detail: "Cryptographic sanitization by destroying internal media encryption keys. Fast & secure for SED drives.",
    standardBadge: "NIST SP 800-88 Cryptographic",
  },
  {
    value: "NIST_CLEAR",
    label: "NIST Clear Pass",
    detail: "Controlled multi-pass pattern overwrite with verification read-back for certified forensic audit trails.",
    standardBadge: "Multi-Pass Forensic Clear",
  },
];

const STEPS = ["Drive Selection", "Health Check", "Erase Method", "Confirm & Queue"];

export function DriveStepRail({ step }: { step: number }) {
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const complete = number < step;
        return (
          <li
            key={label}
            className={`border-t-2 pt-2 transition-colors ${
              active
                ? "border-govt-blue dark:border-govt-blueLight"
                : complete
                  ? "border-govt-green"
                  : "border-line"
            }`}
          >
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                active
                  ? "text-typeblue font-bold"
                  : complete
                    ? "text-govt-green font-medium"
                    : "text-muted"
              }`}
            >

              0{number}
            </div>
            <div
              className={`mt-1 text-xs truncate ${
                active ? "font-semibold text-main" : "text-muted"
              }`}
            >
              {label}
            </div>
          </li>
        );
      })}
    </ol>
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
      className={`rounded-md border p-4 text-left transition-all ${
        isSelected
          ? "border-govt-blue bg-govt-blue/10 dark:border-govt-blueLight dark:bg-govt-blue/20 ring-1 ring-govt-blue/30"
          : "border-line bg-panel hover:bg-field"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-main text-sm">{item.label}</div>
        {item.standardBadge && (
          <span className="fg-badge text-[10px] font-mono">{item.standardBadge}</span>
        )}
      </div>
      <div className="mt-2 text-xs leading-relaxed text-muted">{item.detail}</div>
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
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-line bg-field p-4">
        <div className="fg-label">Media Type</div>
        <div className="mt-1 font-medium text-main">
          {device?.media_type?.replaceAll("_", " ") ?? "File / Image target"}
        </div>
      </div>
      <div className="rounded-md border border-line bg-field p-4">
        <div className="fg-label">Reported Capacity</div>
        <div className="mt-1 font-mono text-sm text-main">
          {bytesHuman(device?.capacity_bytes)}
        </div>
      </div>
      <div className="rounded-md border border-line bg-field p-4">
        <div className="fg-label">S.M.A.R.T. Health</div>
        <div className="mt-1 font-medium text-main">
          {device?.health ?? "Agent detection required"}
        </div>
      </div>
      <div className="rounded-md border border-line bg-field p-4">
        <div className="fg-label">Connection Interface</div>
        <div className="mt-1 font-medium text-main">
          {device?.connection_type ?? "Local file"}
        </div>
      </div>
    </div>
  );
}

export function DriveSafetyWarningCard() {
  return (
    <div className="rounded-md border border-govt-gold/40 bg-govt-gold/10 p-4 text-sm text-main">
      <div className="flex items-center gap-2 font-semibold text-govt-gold text-xs uppercase tracking-wider">
        <span>⚠ Operator Safety Notice</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Use safe image targets for demonstration purposes. Direct block-level raw disk sanitization requires explicitly toggling Real-Device Mode.
      </p>
    </div>
  );
}
