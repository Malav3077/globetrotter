"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import RequireAuth from "@/components/RequireAuth";
import TripCard from "@/components/TripCard";
import { Empty, Loading } from "@/components/States";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function DashboardBody() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Dashboard>("/api/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-danger-600">{error}</p>;
  if (!data) return <Loading />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Hi {user?.first_name} 👋</h1>
          <p className="mt-1 text-sm text-ink-500">Here is what your travel plan looks like.</p>
        </div>
        <Link href="/trips/new" className="btn-primary">+ Plan a trip</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Trips planned" value={String(data.total_trips)} />
        <Stat label="Upcoming" value={String(data.upcoming_trips.length)} />
        <Stat label="Total planned cost" value={money(data.total_planned_cost)} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Upcoming trips</h2>
        {data.upcoming_trips.length === 0 ? (
          <Empty
            title="No upcoming trips yet"
            hint="Create your first trip and start adding cities to it."
            action={<Link href="/trips/new" className="btn-primary mt-2">Plan a trip</Link>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcoming_trips.map((t) => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Popular destinations</h2>
          <Link href="/explore" className="text-sm font-medium text-brand-700 hover:underline">
            Explore all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.popular_cities.map((c) => (
            <Link key={c.id} href={`/explore?city=${c.id}`}
                  className="card overflow-hidden transition-shadow hover:shadow-md">
              <div className="h-24 bg-ink-100" style={{
                backgroundImage: c.image_url ? `url(${c.image_url})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
              }} />
              <div className="p-4">
                <p className="font-medium text-ink-900">{c.name}</p>
                <p className="text-sm text-ink-500">{c.country}</p>
                <p className="mt-1 text-xs text-ink-400">Cost index {Number(c.cost_index).toFixed(0)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {data.recent_trips.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Recent trips</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent_trips.map((t) => <TripCard key={t.id} trip={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth><DashboardBody /></RequireAuth>;
}
