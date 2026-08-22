"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BarChart } from "@/components/Charts";
import ListToolbar from "@/components/ListToolbar";
import RequireAuth from "@/components/RequireAuth";
import { Empty, Loading } from "@/components/States";
import { useAuth } from "@/components/AuthProvider";
import { api, qs } from "@/lib/api";
import { longDate, money } from "@/lib/format";
import type { AdminStats, AdminUser } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function AdminBody() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !user.is_admin) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    if (!user?.is_admin) return;
    api.get<AdminStats>("/api/admin/stats").then(setStats).catch((e) => setError(e.message));
  }, [user]);

  useEffect(() => {
    if (!user?.is_admin || tab !== "users") return;
    const t = setTimeout(() => {
      api.get<AdminUser[]>(`/api/admin/users${qs({ q: search })}`).then(setUsers).catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [user, tab, search]);

  if (!user?.is_admin) return <Loading />;
  if (error) return <p className="text-danger-600">{error}</p>;
  if (!stats) return <Loading />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink-900">Admin</h1>
      <p className="mb-5 text-sm text-ink-500">Platform usage across all users.</p>

      <div className="mb-6 flex gap-1 border-b border-ink-100">
        {(["overview", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
                  className={`-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800"
                  }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Users" value={String(stats.total_users)} />
            <Stat label="Trips created" value={String(stats.total_trips)} />
            <Stat label="City stops" value={String(stats.total_stops)} />
            <Stat label="Activities booked" value={String(stats.total_activities_booked)} />
            <Stat label="Public itineraries" value={String(stats.public_trips)} />
            <Stat label="Avg trip length" value={`${stats.avg_trip_days} days`} />
            <Stat label="Total planned cost" value={money(stats.total_planned_cost)} />
            <Stat label="Trips per user"
                  value={stats.total_users ? (stats.total_trips / stats.total_users).toFixed(1) : "0"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-900">Most visited cities</h2>
              {stats.popular_cities.length === 0 ? (
                <p className="text-sm text-ink-400">No stops booked yet.</p>
              ) : (
                <BarChart bars={stats.popular_cities.map((c) => ({ label: c.name, value: c.count }))}
                          format={(n) => `${n} visit${n === 1 ? "" : "s"}`} />
              )}
            </section>

            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-900">Most booked activities</h2>
              {stats.popular_activities.length === 0 ? (
                <p className="text-sm text-ink-400">No activities booked yet.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.popular_activities.map((a) => (
                    <li key={a.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate text-ink-800">{a.name}</span>
                        <span className="text-xs text-ink-400">{a.extra}</span>
                      </span>
                      <span className="chip bg-brand-50 text-brand-700">{a.count}×</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-ink-900">Trips created per month</h2>
            <BarChart bars={stats.trips_per_month.map((m) => ({ label: m.month, value: m.count }))}
                       format={(n) => `${n} trip${n === 1 ? "" : "s"}`} />
          </section>
        </div>
      ) : (
        <div>
          <ListToolbar search={search} onSearch={setSearch}
                       placeholder="Search by name or email…" total={users?.length} />
          {!users ? <Loading /> : users.length === 0 ? (
            <Empty title="No users match" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Trips</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-ink-50 last:border-0">
                      <td className="px-4 py-3 text-ink-900">
                        {u.first_name} {u.last_name}
                        {u.is_admin && <span className="chip ml-2 bg-sun-50 text-sun-600">admin</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{u.email}</td>
                      <td className="px-4 py-3 text-ink-500">
                        {[u.city, u.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{u.trip_count}</td>
                      <td className="px-4 py-3 text-ink-500">{longDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return <RequireAuth><AdminBody /></RequireAuth>;
}
