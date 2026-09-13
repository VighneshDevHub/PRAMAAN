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

  return (
    <article className="fg-panel overflow-hidden transition-all hover:border-govt-blue/40">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="truncate font-mono text-xs font-semibold text-typeblue">
            {device.serial_number}
          </div>
          <h3 className="mt-1 truncate font-display text-lg font-semibold text-main">
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
          <div className="mt-1 text-main font-medium">{device.media_type.replaceAll("_", " ")}</div>
        </div>
        <div>
          <div className="fg-label">Capacity</div>
          <div className="mt-1 font-mono text-xs text-main">{bytesHuman(device.capacity_bytes)}</div>
        </div>
        <div>
          <div className="fg-label">Connection</div>
          <div className="mt-1 text-main">{device.connection_type}</div>
        </div>
        <div>
          <div className="fg-label">Health</div>
          <div className="mt-1">
            <span className={HEALTH_VARIANT[device.health]}>{device.health}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line bg-field/40 px-5 py-3">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
          Available operations
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={query("RECOVERY")} className="fg-btn !px-2.5 !py-1 text-[11px]">
            Recover
          </Link>
          <Link href={query("FILE_ERASE")} className="fg-btn !px-2.5 !py-1 text-[11px]">
            Erase folder
          </Link>
          <Link href={query("DRIVE_ERASE")} className="fg-btn-primary !px-2.5 !py-1 text-[11px]">
            Erase drive
          </Link>
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
