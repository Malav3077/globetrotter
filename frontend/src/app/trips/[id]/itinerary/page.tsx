"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import RequireAuth from "@/components/RequireAuth";
import TripHeader from "@/components/TripHeader";
import TripTabs from "@/components/TripTabs";
import { Empty, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { duration, longDate, money2 } from "@/lib/format";
import type { Itinerary, Trip } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  Sightseeing: "bg-brand-100 text-brand-700",
  Food: "bg-sun-50 text-sun-600",
  Culture: "bg-ink-100 text-ink-700",
  Adventure: "bg-brand-200 text-brand-800",
  Nature: "bg-brand-50 text-brand-700",
  Nightlife: "bg-ink-200 text-ink-800",
  Shopping: "bg-sun-50 text-sun-600",
  Relaxation: "bg-brand-100 text-brand-700",
};

function ItineraryBody() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [data, setData] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Trip>(`/api/trips/${id}`),
      api.get<Itinerary>(`/api/trips/${id}/itinerary`),
    ])
      .then(([t, i]) => { setTrip(t); setData(i); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-danger-600">{error}</p>;
  if (!trip || !data) return <Loading />;

  const planned = data.days.filter((d) => d.city);

  return (
    <div>
      <TripHeader trip={trip} />
      <TripTabs tripId={trip.id} />

      {planned.length === 0 ? (
        <Empty title="Nothing planned yet" hint="Add a stop in the Builder tab to see your day-by-day plan." />
      ) : (
        <ol className="relative space-y-4 border-l-2 border-ink-100 pl-6">
          {data.days.map((day) => (
            <li key={day.day} className="relative">
              <span className={`absolute -left-[1.9rem] top-1.5 grid h-6 w-6 place-items-center
                                rounded-full text-[10px] font-semibold ${
                day.city ? "bg-brand-600 text-white" : "bg-ink-200 text-ink-500"}`}>
                {day.day_number}
              </span>

              <div className={`card p-4 ${day.city ? "" : "border-dashed bg-transparent shadow-none"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">
                      {day.city ?? "Unplanned day"}
                      {day.country && <span className="ml-2 text-sm font-normal text-ink-500">{day.country}</span>}
                    </p>
                    <p className="text-xs text-ink-500">{longDate(day.day)}</p>
                  </div>
                  {day.day_cost > 0 && (
                    <span className="text-sm font-medium text-ink-700">{money2(day.day_cost)}</span>
                  )}
                </div>

                {day.activities.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {day.activities.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`chip ${CATEGORY_COLORS[a.category] ?? "bg-ink-100 text-ink-600"}`}>
                            {a.category}
                          </span>
                          <span className="truncate text-sm text-ink-900">{a.name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-ink-500">
                          {duration(a.duration_mins)} · {money2(Number(a.cost))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {!day.city && (
                  <p className="mt-1 text-sm text-ink-400">No city booked for this day yet.</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function ItineraryPage() {
  return <RequireAuth><ItineraryBody /></RequireAuth>;
}
