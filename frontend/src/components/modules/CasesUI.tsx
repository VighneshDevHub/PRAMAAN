"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import type { CaseStatus, CaseSummary } from "@/lib/types";

export const STATUS_VARIANT: Record<CaseStatus, string> = {
  OPEN: "fg-badge fg-badge--blue",
  IN_PROGRESS: "fg-badge fg-badge--gold",
  UNDER_REVIEW: "fg-badge fg-badge--navy",
  CLOSED: "fg-badge fg-badge--green",
};

export function CaseStatusBadge({ status }: { status: CaseSummary["status"] }) {
  return (
    <span className={STATUS_VARIANT[status] ?? "fg-badge"}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function CreateCaseFormPanel({
  title,
  setTitle,
  description,
  setDescription,
  creating,
  onSubmit,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  creating: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fg-panel">
      <div className="fg-panel-header">
        <div className="fg-panel-title">Create Case</div>
        <div className="text-xs text-muted">Register new investigation</div>
      </div>
      <form className="space-y-4 p-5" onSubmit={onSubmit}>
        <div>
          <label className="fg-label" htmlFor="case-title">
            Case Title
          </label>
          <input
            id="case-title"
            type="text"
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. FIR-2026-0014 USB Media Recovery"
            className="fg-input"
          />
        </div>
        <div>
          <label className="fg-label" htmlFor="case-desc">
            Description / Scope
          </label>
          <textarea
            id="case-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Investigation scope, source of evidence, legal authorisation notes…"
            rows={5}
            className="fg-input"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="fg-btn-primary w-full"
        >
          {creating ? "Registering case…" : "Register Case"}
        </button>
        <p className="text-xs text-muted leading-relaxed">
          A case number is assigned automatically upon creation and is used for all linked evidence, jobs, and certificates.
        </p>
      </form>
    </div>
  );
}

export function CaseRegisterTable({
  cases,
  loading,
}: {
  cases: CaseSummary[] | null;
  loading: boolean;
}) {
  return (
    <div className="fg-panel overflow-hidden">
      <div className="fg-panel-header">
        <div>
          <div className="fg-panel-title">Case Register</div>
          <p className="mt-1 text-xs text-muted">
            Active and closed investigation files with summary counts.
          </p>
        </div>
        <div className="font-mono text-[11px] text-muted">
          {cases !== null ? `${cases.length} files` : "—"}
        </div>
      </div>

      {loading && cases === null && (
        <div className="p-10 text-center text-sm text-muted">
          Loading case register…
        </div>
      )}

      {cases !== null && cases.length === 0 && (
        <div className="p-10 text-center text-sm text-muted">
          No cases registered yet. Use the form to open the first file.
        </div>
      )}

      {cases !== null && cases.length > 0 && (
        <div className="overflow-x-auto">
          <table className="fg-table min-w-[780px]">
            <thead>
              <tr>
                <th>Case</th>
                <th>Status</th>
                <th>Lead Investigator</th>
                <th className="text-center">Evidence</th>
                <th className="text-center">Certificates</th>
                <th className="text-right">Workspace</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-mono text-xs font-semibold text-typeblue">
                      {item.case_number}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-main">
                      {item.title}
                    </div>
                  </td>

                  <td>
                    <CaseStatusBadge status={item.status} />
                  </td>
                  <td className="text-sm text-main">
                    {item.lead_investigator_email ? (
                      <span className="font-mono text-xs">
                        {item.lead_investigator_email}
                      </span>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="text-center font-mono text-xs text-main">
                    {item.evidence_count}
                  </td>
                  <td className="text-center font-mono text-xs text-main">
                    {item.linked_operation_count}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/dashboard/cases/${item.id}`}
                      className="fg-btn !px-2.5 !py-1.5 text-xs"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
