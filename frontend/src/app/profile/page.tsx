"use client";

import { useEffect, useState } from "react";

import ErrorText from "@/components/ErrorText";
import RequireAuth from "@/components/RequireAuth";
import TripCard from "@/components/TripCard";
import { Loading } from "@/components/States";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";

function ProfileBody() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", city: "", country: "", photo_url: "",
  });
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name, last_name: user.last_name ?? "", phone: user.phone ?? "",
      city: user.city ?? "", country: user.country ?? "", photo_url: user.photo_url ?? "",
    });
  }, [user]);

  useEffect(() => {
    api.get<Trip[]>("/api/trips").then(setTrips).catch(() => setTrips([]));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!form.first_name.trim()) return setError("First name is required");

    setBusy(true);
    try {
      await api.patch("/api/auth/me", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        photo_url: form.photo_url.trim() || null,
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <Loading />;

  const preplanned = (trips ?? []).filter((t) => t.status !== "completed");
  const previous = (trips ?? []).filter((t) => t.status === "completed");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-ink-900">Profile</h1>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-100
                          text-xl font-semibold text-brand-700">
            {user.photo_url
              ? <img src={user.photo_url} alt="" className="h-full w-full object-cover" />
              : user.first_name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink-900">{user.first_name} {user.last_name}</p>
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ErrorText message={error} />
          {saved && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Profile updated.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="label">First name *</label>
              <input id="first_name" required value={form.first_name} onChange={set("first_name")} className="input" />
            </div>
            <div>
              <label htmlFor="last_name" className="label">Last name</label>
              <input id="last_name" value={form.last_name} onChange={set("last_name")} className="input" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" value={form.phone} onChange={set("phone")} className="input" />
            </div>
            <div>
              <label htmlFor="photo_url" className="label">Photo URL</label>
              <input id="photo_url" type="url" value={form.photo_url} onChange={set("photo_url")} className="input" />
            </div>
            <div>
              <label htmlFor="city" className="label">City</label>
              <input id="city" value={form.city} onChange={set("city")} className="input" />
            </div>
            <div>
              <label htmlFor="country" className="label">Country</label>
              <input id="country" value={form.country} onChange={set("country")} className="input" />
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">
          Preplanned trips <span className="text-ink-400">({preplanned.length})</span>
        </h2>
        {preplanned.length === 0 ? (
          <p className="text-sm text-ink-500">Nothing planned right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {preplanned.map((t) => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">
          Previous trips <span className="text-ink-400">({previous.length})</span>
        </h2>
        {previous.length === 0 ? (
          <p className="text-sm text-ink-500">No completed trips yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previous.map((t) => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return <RequireAuth><ProfileBody /></RequireAuth>;
}
