"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import type {
  DeviceConnectionType,
  DeviceHealth,
  DeviceMediaType,
  DeviceOut,
  DeviceStatus,
} from "@/lib/types";

export const STATUS_VARIANT: Record<DeviceStatus, string> = {
  CONNECTED: "fg-badge fg-badge--green",
  DISCONNECTED: "fg-badge",
  IN_USE: "fg-badge fg-badge--navy",
  ERRORED: "fg-badge fg-badge--red",
  QUARANTINED: "fg-badge fg-badge--gold",
  SANITIZED: "fg-badge fg-badge--blue",
  DECOMMISSIONED: "fg-badge",
};

export const HEALTH_VARIANT: Record<DeviceHealth, string> = {
  EXCELLENT: "fg-badge fg-badge--green",
  GOOD: "fg-badge fg-badge--green",
  FAIR: "fg-badge fg-badge--gold",
  POOR: "fg-badge fg-badge--red",
  CRITICAL: "fg-badge fg-badge--red",
  UNKNOWN: "fg-badge",
};

export const MEDIA_OPTIONS: DeviceMediaType[] = [
  "SSD", "HDD", "USB_FLASH", "SD_CARD", "NVME_SSD", "OPTICAL", "TAPE", "OTHER",
];

export const CONN_OPTIONS: DeviceConnectionType[] = [
  "USB", "SATA", "NVMe", "PCIe", "SAS", "SD", "NETWORK", "UNKNOWN",
];

export const STATUS_OPTIONS: DeviceStatus[] = [
  "CONNECTED", "DISCONNECTED", "IN_USE", "ERRORED", "QUARANTINED", "SANITIZED", "DECOMMISSIONED",
];

export const HEALTH_OPTIONS: DeviceHealth[] = [
  "EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL", "UNKNOWN",
];

export function bytesHuman(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v.toFixed(v < 10 && i > 0 ? 2 : 1)} ${units[i]}`;
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="fg-label">{label}</span>
      {children}
    </label>
  );
}

export function DeviceCard({ device }: { device: DeviceOut }) {
  const query = (operation: string) =>
    operation === "RECOVERY"
      ? `/dashboard/recovery?device=${encodeURIComponent(device.id)}`
      : operation === "FILE_ERASE"
        ? `/dashboard/file-eraser?device=${encodeURIComponent(device.id)}`
        : `/dashboard/drive-eraser?device=${encodeURIComponent(device.id)}`;

  const isHostDrive =
    device.connection_type === "NVMe" ||
    device.connection_type === "SATA" ||
    device.connection_type === "PCIe" ||
    device.media_type === "NVME_SSD" ||
    device.media_type === "SSD" ||
    (device.model && (
      device.model.toLowerCase().includes("samsung") ||
      device.model.toLowerCase().includes("nvme") ||
      device.model.toLowerCase().includes("system")
    )) ||
    (device.notes && (
      device.notes.toLowerCase().includes("host") ||
      device.notes.toLowerCase().includes("system")
    ));

  return (
    <article
      className={`fg-panel overflow-hidden transition-all rounded-xl border ${
        isHostDrive
          ? "border-amber-400/80 bg-gradient-to-b from-amber-50/40 via-panel to-panel shadow-sm hover:border-amber-500"
          : "border-govt-blue/30 bg-panel hover:border-govt-blue/60 shadow-xs"
      }`}
    >
      {/* Category Ribbon Header */}
      <div
        className={`px-4 py-2 text-xs font-mono font-bold flex items-center justify-between border-b ${
          isHostDrive
            ? "bg-slate-900 text-amber-300 border-slate-800"
            : "bg-govt-blueLight text-govt-navy border-govt-blue/20"
        }`}
      >
        <div className="flex items-center gap-2">
          {isHostDrive ? (
            <>
              <svg
                className="w-4 h-4 text-amber-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>HOST MACHINE SYSTEM DRIVE (PRIMARY OS)</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-govt-navy shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span>REMOVABLE EVIDENCE MEDIA</span>
            </>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
            isHostDrive
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
          }`}
        >
          {isHostDrive ? "PROTECTED OS" : "EVIDENCE READY"}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="truncate font-mono text-xs font-semibold text-typeblue">
            {device.serial_number}
          </div>
          <h3 className="mt-1 truncate font-display text-lg font-bold text-main">
            {device.model || device.manufacturer || "Unidentified device"}
          </h3>
        </div>

        <span className={STATUS_VARIANT[device.status]}>
          {device.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
        <div>
          <div className="fg-label">Media</div>
          <div className="mt-1 text-main font-semibold">
            {device.media_type.replaceAll("_", " ")}
          </div>
        </div>
        <div>
          <div className="fg-label">Capacity</div>
          <div className="mt-1 font-mono text-xs font-bold text-main">
            {bytesHuman(device.capacity_bytes)}
          </div>
        </div>
        <div>
          <div className="fg-label">Connection</div>
          <div className="mt-1 text-main font-semibold">{device.connection_type}</div>
        </div>
        <div>
          <div className="fg-label">Health</div>
          <div className="mt-1">
            <span className={HEALTH_VARIANT[device.health]}>{device.health}</span>
          </div>
        </div>
      </div>
      <div
        className={`border-t px-5 py-3.5 ${
          isHostDrive ? "bg-amber-500/5 border-amber-200" : "bg-field/40 border-line"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
            Available operations
          </span>
          {isHostDrive && (
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              ⚠️ OS Drive Protection Active
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={query("RECOVERY")} className="fg-btn !px-2.5 !py-1 text-[11px] font-bold">
            Recover
          </Link>
          <Link href={query("FILE_ERASE")} className="fg-btn !px-2.5 !py-1 text-[11px] font-bold">
            Erase folder
          </Link>
          {isHostDrive ? (
            <Link
              href={query("DRIVE_ERASE")}
              className="px-3 py-1 text-[11px] font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 transition-all flex items-center gap-1"
              title="Caution: Operating system host drive"
            >
              🔒 Erase OS Drive (Protected)
            </Link>
          ) : (
            <Link href={query("DRIVE_ERASE")} className="fg-btn-primary !px-2.5 !py-1 text-[11px] font-bold">
              Erase drive
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function DeviceFormModal({
  initial,
  submitting,
  onClose,
  onSubmit,
}: {
  initial: DeviceOut | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void> | void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-md border border-line bg-panel shadow-card-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-field/40">
          <div>
            <div className="fg-panel-title">{initial ? "Edit Device Record" : "Register New Device"}</div>
            <p className="mt-0.5 text-xs text-muted">
              Data is persisted to the PostgreSQL devices table via{" "}
              <code className="fg-badge !py-0">POST /api/v1/devices</code>
            </p>
          </div>
          <button type="button" onClick={onClose} className="fg-btn !px-2.5 !py-1 text-xs">
            Close
          </button>
        </div>
        <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Serial Number *">
            <input
              required
              defaultValue={initial?.serial_number ?? ""}
              name="serial_number"
              className="fg-input font-mono"
            />
          </FormField>
          <FormField label="Manufacturer">
            <input defaultValue={initial?.manufacturer ?? ""} name="manufacturer" className="fg-input" />
          </FormField>
          <FormField label="Model">
            <input defaultValue={initial?.model ?? ""} name="model" className="fg-input" />
          </FormField>
          <FormField label="Firmware Version">
            <input defaultValue={initial?.firmware_version ?? ""} name="firmware_version" className="fg-input" />
          </FormField>
          <FormField label="Connection Type">
            <select defaultValue={initial?.connection_type ?? ""} name="connection_type" className="fg-input">
              <option value="">— Unspecified —</option>
              {CONN_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Media Type">
            <select defaultValue={initial?.media_type ?? ""} name="media_type" className="fg-input">
              <option value="">— Unspecified —</option>
              {MEDIA_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Capacity (bytes, numeric)">
            <input
              type="number"
              min={0}
              step="1"
              name="capacity_bytes"
              defaultValue={initial?.capacity_bytes ?? ""}
              className="fg-input font-mono"
            />
          </FormField>
          <FormField label="Health">
            <select defaultValue={initial?.health ?? ""} name="health" className="fg-input">
              <option value="">— Unknown —</option>
              {HEALTH_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select defaultValue={initial?.status ?? "CONNECTED"} name="status" className="fg-input">
              {STATUS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Notes / Chain of Custody">
              <textarea name="notes" defaultValue={initial?.notes ?? ""} rows={3} className="fg-input" />
            </FormField>
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={onClose} className="fg-btn" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="fg-btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : initial ? "Save Changes" : "Register Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
