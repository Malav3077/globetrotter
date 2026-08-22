"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ErrorText from "@/components/ErrorText";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function NewTripBody() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", description: "", start_date: today(), end_date: today(),
    cover_photo: "", daily_budget: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Trip name is required");
    if (form.end_date < form.start_date) return setError("End date cannot be before start date");

    setBusy(true);
    try {
      const trip = await api.post<Trip>("/api/trips", {
        name: form.name.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date,
        cover_photo: form.cover_photo.trim() || null,
        daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create trip");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink-900">Plan a new trip</h1>
      <p className="mb-6 text-sm text-ink-500">Give it a name and dates — you can add cities next.</p>

      <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
        <ErrorText message={error} />

        <div>
          <label htmlFor="name" className="label">Trip name *</label>
          <input id="name" required value={form.name} onChange={set("name")}
                 className="input" placeholder="Europe Summer 2026" />
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" rows={3} value={form.description} onChange={set("description")}
                    className="input resize-none" placeholder="What is this trip about?" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className="label">Start date *</label>
            <input id="start_date" type="date" required value={form.start_date}
                   onChange={set("start_date")} className="input" />
          </div>
          <div>
            <label htmlFor="end_date" className="label">End date *</label>
            <input id="end_date" type="date" required min={form.start_date} value={form.end_date}
                   onChange={set("end_date")} className="input" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="daily_budget" className="label">Daily budget</label>
            <input id="daily_budget" type="number" min={0} step="1" value={form.daily_budget}
                   onChange={set("daily_budget")} className="input" placeholder="e.g. 150" />
            <p className="mt-1 text-xs text-ink-400">Used to flag over-budget days.</p>
          </div>
          <div>
            <label htmlFor="cover_photo" className="label">Cover photo URL</label>
            <input id="cover_photo" type="url" value={form.cover_photo}
                   onChange={set("cover_photo")} className="input" placeholder="https://…" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Creating…" : "Create trip"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function NewTripPage() {
  return <RequireAuth><NewTripBody /></RequireAuth>;
}
