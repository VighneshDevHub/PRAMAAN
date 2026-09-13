"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createDevice,
  detectDevices,
  listDevices,
  UnauthorizedError,
  updateDevice,
} from "@/lib/api";
import { getStoredRole, getToken } from "@/lib/auth";
import type {
  DeviceConnectionType,
  DeviceCreateIn,
  DeviceHealth,
  DeviceMediaType,
  DeviceOut,
  DeviceStatus,
  DeviceUpdateIn,
} from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import {
  bytesHuman,
  CONN_OPTIONS,
  DeviceCard,
  DeviceFormModal,
  FormField,
  HEALTH_OPTIONS,
  HEALTH_VARIANT,
  MEDIA_OPTIONS,
  STATUS_OPTIONS,
  STATUS_VARIANT,
} from "@/components/modules/DeviceInventoryUI";

function fmt(ts: string | null | undefined): string {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function DeviceInventoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DeviceOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(false);

  // filters
  const [fStatus, setFStatus] = useState<string>("");
  const [fConn, setFConn] = useState<string>("");
  const [fMedia, setFMedia] = useState<string>("");
  const [fSerial, setFSerial] = useState<string>("");

  // create/edit modal state
  const [editing, setEditing] = useState<DeviceOut | "NEW" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const next = await listDevices({
        connection_type: fConn || undefined,
        status: fStatus || undefined,
        media_type: fMedia || undefined,
        serial_contains: fSerial || undefined,
      });
      setRows(next);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;

    const role = getStoredRole();
    const canDetect = role === "ADMINISTRATOR" || role === "INVESTIGATOR" || role === "SUPERVISOR";
    let active = true;

    async function monitorHost() {
      if (!active) return;
      setMonitoring(true);
      try {
        if (canDetect) {
          await detectDevices();
        }
        await reload();
      } catch {
        // Monitoring is best-effort; manual controls continue to expose errors.
      } finally {
        if (active) setMonitoring(false);
      }
    }

    const interval = window.setInterval(() => void monitorHost(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const form = e.currentTarget.elements as typeof e.currentTarget.elements & {
        serial_number: HTMLInputElement;
        manufacturer: HTMLInputElement;
        model: HTMLInputElement;
        connection_type: HTMLSelectElement;
        media_type: HTMLSelectElement;
        capacity_bytes: HTMLInputElement;
        health: HTMLSelectElement;
        status: HTMLSelectElement;
        firmware_version: HTMLInputElement;
        notes: HTMLTextAreaElement;
      };
      const cap = Number(form.capacity_bytes.value);
      const base: DeviceCreateIn = {
        serial_number: form.serial_number.value.trim(),
        manufacturer: form.manufacturer.value.trim() || undefined,
        model: form.model.value.trim() || undefined,
        connection_type: (form.connection_type.value as DeviceConnectionType) || undefined,
        media_type: (form.media_type.value as DeviceMediaType) || undefined,
        capacity_bytes: Number.isFinite(cap) && cap > 0 ? cap : undefined,
        health: (form.health.value as DeviceHealth) || undefined,
        status: (form.status.value as DeviceStatus) || undefined,
        firmware_version: form.firmware_version.value.trim() || undefined,
        notes: form.notes.value.trim() || undefined,
      };
      if (editing === "NEW") {
        await createDevice(base);
      } else if (editing) {
        const payload: DeviceUpdateIn = base;
        await updateDevice(editing.id, payload);
      }
      setEditing(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save device");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDetect() {
    setDetecting(true);
    setDetectionMessage(null);
    setError(null);
    try {
      const result = await detectDevices();
      setDetectionMessage(
        `${result.detected_count} host device${result.detected_count === 1 ? "" : "s"} detected and synchronized.`
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Automatic device detection failed");
    } finally {
      setDetecting(false);
    }
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void handleDetect()}
        className="fg-btn !py-1.5 !px-3 text-xs"
        disabled={detecting}
      >
        {detecting ? "Detecting..." : "Detect Host Devices"}
      </button>
      <button
        type="button"
        onClick={() => reload()}
        className="fg-btn !py-1.5 !px-3 text-xs"
      >
        ↻ Refresh
      </button>
      <button
        type="button"
        onClick={() => setEditing("NEW")}
        className="fg-btn-primary !py-1.5 !px-3 text-xs"
      >
        + Register Device
      </button>
    </div>
  );

  return (
    <AppShell
      eyebrow="Asset Management"
      title="Device Inventory"
      subtitle="Enumeration and lifecycle management of all storage media processed through the Digital Forensics Unit. Data is pulled in real time from /api/v1/devices."
      actions={actions}
    >
      {error && (
        <div className="mb-6 rounded-md border border-govt-red/25 bg-govt-redLight px-4 py-3 text-sm text-govt-red">
          {error}
        </div>
      )}

      {detectionMessage && (
        <div className="mb-6 rounded-md border border-govt-green/25 bg-govt-greenLight px-4 py-3 text-sm text-govt-green">
          {detectionMessage}
        </div>
      )}

      {/* ========== FILTER STRIP ========== */}
      <div className="fg-panel mb-6 overflow-hidden">
        <div className="fg-panel-header">
          <div className="fg-panel-title">Filter Inventory</div>
          <div className="font-mono text-[11px] text-muted">
            {rows ? `${rows.length} devices` : "—"}
          </div>
        </div>
        <div className="flex items-center gap-2 border-b border-line bg-field/40 px-5 py-2.5 text-xs text-muted">
          <span
            className={`h-2 w-2 rounded-full ${monitoring ? "bg-govt-gold animate-pulse" : "bg-govt-green"}`}
            aria-hidden="true"
          />
          Automatic host monitoring active · checks every 5 seconds
        </div>
        <form
          className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            void reload();
          }}
        >
          <FormField label="Serial contains">
            <input
              type="text"
              value={fSerial}
              onChange={(e) => setFSerial(e.target.value)}
              placeholder="e.g. 0418"
              className="fg-input"
            />
          </FormField>
          <FormField label="Connection Type">
            <select value={fConn} onChange={(e) => setFConn(e.target.value)} className="fg-input">
              <option value="">All</option>
              {CONN_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Media Type">
            <select value={fMedia} onChange={(e) => setFMedia(e.target.value)} className="fg-input">
              <option value="">All</option>
              {MEDIA_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="fg-input">
              <option value="">All</option>
              {STATUS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex items-end gap-2">
            <button type="submit" className="fg-btn-primary flex-1" disabled={loading}>
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setFConn("");
                setFMedia("");
                setFStatus("");
                setFSerial("");
                void reload();
              }}
              className="fg-btn flex-1"
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {rows && rows.length > 0 && (
        <section aria-labelledby="connected-devices-heading" className="mb-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
                Connected Devices
              </div>
              <h2 id="connected-devices-heading" className="mt-1 font-display text-2xl font-semibold text-main">
                Device command surface
              </h2>
            </div>
            <span className="font-mono text-xs text-muted">{rows.length} detected</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {rows.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      {/* ========== TABLE ========== */}
      <div className="fg-panel overflow-hidden">
        {loading && !rows && (
          <div className="p-10 text-center text-sm text-muted">Loading device inventory…</div>
        )}
        {!loading && rows && rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted">
            No devices found matching the current filters. Click “Register Device” to add a new entry.
          </div>
        )}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="fg-table min-w-[1100px]">
              <thead>
                <tr>
                  <th>Serial / Model</th>
                  <th>Manufacturer</th>
                  <th>Media / Connection</th>
                  <th className="text-right">Capacity</th>
                  <th>Health</th>
                  <th>Status</th>
                  <th>Last Operation</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="font-mono text-xs font-semibold text-typeblue">
                        {d.serial_number}
                      </div>
                      <div className="text-sm text-main">{d.model || "-"}</div>
                    </td>

                    <td className="text-sm text-main">{d.manufacturer || "-"}</td>
                    <td>
                      <span className="fg-badge mr-1.5">{d.media_type.replace("_", " ")}</span>
                      <span className="fg-badge fg-badge--navy">{d.connection_type}</span>
                    </td>
                    <td className="text-right font-mono text-xs text-main">
                      {bytesHuman(d.capacity_bytes)}
                    </td>
                    <td>
                      <span className={HEALTH_VARIANT[d.health]}>{d.health}</span>
                    </td>
                    <td>
                      <span className={STATUS_VARIANT[d.status]}>
                        {d.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {d.last_operation_at ? (
                        <div>
                          <div className="text-xs text-main">{fmt(d.last_operation_at)}</div>
                          <div className="font-mono text-[10px] text-muted truncate max-w-[180px]">
                            {d.last_operation_record_id ?? ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">No prior ops</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(d)}
                        className="fg-btn !px-2.5 !py-1 text-[11px]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========== CREATE / EDIT MODAL ========== */}
      {editing && (
        <DeviceFormModal
          initial={editing === "NEW" ? null : editing}
          submitting={submitting}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
        />
      )}
    </AppShell>
  );
}

