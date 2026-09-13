"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCase, listCases, UnauthorizedError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { CaseSummary } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { CaseRegisterTable, CreateCaseFormPanel } from "@/components/modules/CasesUI";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  async function loadCases() {
    try {
      setCases(await listCases());
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load cases");
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void loadCases();
  }, [router]);

  async function handleCreateCase(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const created = await createCase({ title, description });
      setTitle("");
      setDescription("");
      router.push(`/dashboard/cases/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell
      eyebrow="Case Management"
      title="Investigation Cases"
      subtitle="Create government-style case files and attach evidence, investigators, and certificates."
    >
      {error && (
        <div className="mb-6 rounded-md border border-govt-red/25 bg-govt-redLight px-4 py-3 text-sm text-govt-red">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr,1.6fr]">
        <CreateCaseFormPanel
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          creating={creating}
          onSubmit={handleCreateCase}
        />

        <CaseRegisterTable cases={cases} loading={cases === null} />
      </div>
    </AppShell>
  );
}

