"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import RequireAuth from "@/components/RequireAuth";
import TripHeader from "@/components/TripHeader";
import TripTabs from "@/components/TripTabs";
import { Empty, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { money2 } from "@/lib/format";
import type { Itinerary, Trip } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Splits the trip into calendar months, padded so each week starts on Monday. */
function buildMonths(days: Itinerary["days"]) {
  const byMonth = new Map<string, Itinerary["days"]>();
  for (const d of days) {
    const key = d.day.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(d);
  }

  return [...byMonth.entries()].map(([key, monthDays]) => {
    const first = new Date(`${key}-01T00:00:00`);
    const label = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;

    const cells: (Itinerary["days"][number] | number | null)[] = Array(leading).fill(null);
    for (let n = 1; n <= daysInMonth; n++) {
      const iso = `${key}-${String(n).padStart(2, "0")}`;
      cells.push(monthDays.find((d) => d.day === iso) ?? n);
    }
    return { key, label, cells };
  });
}

function CalendarBody() {
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

  const months = useMemo(() => (data ? buildMonths(data.days) : []), [data]);

  if (error) return <p className="text-danger-600">{error}</p>;
  if (!trip || !data) return <Loading />;

  return (
    <div>
      <TripHeader trip={trip} />
      <TripTabs tripId={trip.id} />

      {data.days.length === 0 ? (
        <Empty title="Nothing on the calendar" hint="Add stops to see them laid out by date." />
      ) : (
        <div className="space-y-6">
          {months.map((m) => (
            <section key={m.key} className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-900">{m.label}</h2>

              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="pb-1 text-center text-xs font-medium text-ink-400">{w}</div>
                ))}

                {m.cells.map((cell, i) => {
                  if (cell === null) return <div key={i} />;

                  if (typeof cell === "number") {
                    return (
                      <div key={i} className="min-h-[72px] rounded-lg border border-ink-100 p-1.5 text-ink-300">
                        <span className="text-xs">{cell}</span>
                      </div>
                    );
                  }

                  const dayNum = Number(cell.day.slice(-2));
                  return (
                    <div key={i}
                         className={`min-h-[72px] rounded-lg border p-1.5 ${
                           cell.city ? "border-brand-300 bg-brand-50" : "border-ink-100"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink-700">{dayNum}</span>
                        {cell.day_cost > 0 && (
                          <span className="text-[10px] text-ink-500">{money2(cell.day_cost)}</span>
                        )}
                      </div>
                      {cell.city && (
                        <p className="mt-0.5 truncate text-[11px] font-medium text-brand-700">{cell.city}</p>
                      )}
                      {cell.activities.slice(0, 2).map((a) => (
                        <p key={a.id} className="truncate text-[10px] text-ink-500">• {a.name}</p>
                      ))}
                      {cell.activities.length > 2 && (
                        <p className="text-[10px] text-ink-400">+{cell.activities.length - 2} more</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return <RequireAuth><CalendarBody /></RequireAuth>;
}
