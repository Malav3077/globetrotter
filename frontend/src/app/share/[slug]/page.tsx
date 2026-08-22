"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DonutChart } from "@/components/Charts";
import { Empty, Loading } from "@/components/States";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { dateRange, duration, money, money2, nights } from "@/lib/format";
import type { PublicTrip } from "@/lib/types";

const COLORS = {
  transport: "var(--color-brand-500)",
  accommodation: "var(--color-ink-500)",
  meals: "var(--color-sun-500)",
  activities: "var(--color-brand-300)",
};

export default function SharedTripPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PublicTrip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    api.get<PublicTrip>(`/api/public/trips/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [slug]);

  async function copyTrip() {
    if (!user) return router.push("/login");
    setCopying(true);
    try {
      const trip = await api.post<{ id: number }>(`/api/public/trips/${slug}/copy`);
      router.push(`/trips/${trip.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not copy trip");
      setCopying(false);
    }
  }

  if (error) {
    return (
      <Empty
        title="This itinerary is not available"
        hint="The link may be wrong, or the owner stopped sharing it."
        action={<Link href="/" className="btn-primary mt-2">Go home</Link>}
      />
    );
  }
  if (!data || authLoading) return <Loading />;

  const { trip, owner_name, budget } = data;
  const slices = [
    { label: "Transport", value: budget.breakdown.transport, color: COLORS.transport },
    { label: "Stay", value: budget.breakdown.accommodation, color: COLORS.accommodation },
    { label: "Meals", value: budget.breakdown.meals, color: COLORS.meals },
    { label: "Activities", value: budget.breakdown.activities, color: COLORS.activities },
  ];

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-32 bg-brand-600" style={{
          backgroundImage: trip.cover_photo ? `url(${trip.cover_photo})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div className="flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <span className="chip bg-brand-50 text-brand-700">Shared itinerary</span>
            <h1 className="mt-2 text-2xl font-semibold text-ink-900">{trip.name}</h1>
            <p className="mt-1 text-sm text-ink-500">
              by {owner_name} · {dateRange(trip.start_date, trip.end_date)} ·{" "}
              {trip.stops.length} {trip.stops.length === 1 ? "city" : "cities"} · {money(budget.total)}
            </p>
            {trip.description && <p className="mt-2 max-w-2xl text-sm text-ink-500">{trip.description}</p>}
          </div>

          <button onClick={copyTrip} disabled={copying} className="btn-primary">
            {copying ? "Copying…" : user ? "Copy this trip" : "Log in to copy"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-semibold text-ink-900">The route</h2>
          {trip.stops.length === 0 ? (
            <p className="text-sm text-ink-500">No cities in this itinerary yet.</p>
          ) : (
            trip.stops.map((stop, i) => (
              <div key={stop.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full
                                   bg-brand-600 text-xs font-semibold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink-900">
                      {stop.city.name}
                      <span className="ml-2 text-sm font-normal text-ink-500">{stop.city.country}</span>
                    </h3>
                    <p className="text-sm text-ink-500">
                      {nights(stop.start_date, stop.end_date)} nights ·{" "}
                      {money2(Number(stop.transport_cost) + Number(stop.accommodation_cost) + Number(stop.meal_cost))}
                    </p>

                    {stop.activities.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {stop.activities.map((link) => (
                          <li key={link.id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2">
                            <span className="truncate text-sm text-ink-900">{link.activity.name}</span>
                            <span className="shrink-0 text-xs text-ink-500">
                              {duration(link.activity.duration_mins)} ·{" "}
                              {money2(Number(link.cost_override ?? link.activity.cost))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-ink-900">Cost breakdown</h2>
          <div className="card p-5">
            <DonutChart slices={slices} centerLabel="Total" centerValue={money(budget.total)} />
            <p className="mt-4 border-t border-ink-100 pt-3 text-sm text-ink-500">
              {money(budget.average_per_day)} per day across {budget.total_days} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
