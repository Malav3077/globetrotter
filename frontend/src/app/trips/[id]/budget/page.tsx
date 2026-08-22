"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BarChart, DonutChart } from "@/components/Charts";
import RequireAuth from "@/components/RequireAuth";
import TripHeader from "@/components/TripHeader";
import TripTabs from "@/components/TripTabs";
import { Empty, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { money, money2, shortDate } from "@/lib/format";
import type { Budget, Trip } from "@/lib/types";

const COLORS = {
  transport: "var(--color-brand-500)",
  accommodation: "var(--color-ink-500)",
  meals: "var(--color-sun-500)",
  activities: "var(--color-brand-300)",
};

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold ${danger ? "text-danger-600" : "text-ink-900"}`}>
        {value}
      </p>
    </div>
  );
}

function BudgetBody() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Trip>(`/api/trips/${id}`),
      api.get<Budget>(`/api/trips/${id}/budget`),
    ])
      .then(([t, b]) => { setTrip(t); setBudget(b); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-danger-600">{error}</p>;
  if (!trip || !budget) return <Loading />;

  const slices = [
    { label: "Transport", value: budget.breakdown.transport, color: COLORS.transport },
    { label: "Stay", value: budget.breakdown.accommodation, color: COLORS.accommodation },
    { label: "Meals", value: budget.breakdown.meals, color: COLORS.meals },
    { label: "Activities", value: budget.breakdown.activities, color: COLORS.activities },
  ];

  return (
    <div>
      <TripHeader trip={trip} total={budget.total} />
      <TripTabs tripId={trip.id} />

      {budget.total === 0 ? (
        <Empty title="Nothing to budget yet"
               hint="Add stops and activities — costs will show up here automatically." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total cost" value={money(budget.total)} />
            <Stat label="Average per day" value={money(budget.average_per_day)} />
            <Stat label="Daily budget"
                  value={budget.daily_budget ? money(budget.daily_budget) : "Not set"} />
            <Stat label="Over-budget days"
                  value={budget.daily_budget ? String(budget.over_budget_days) : "—"}
                  danger={budget.over_budget_days > 0} />
          </div>

          {budget.over_budget_days > 0 && (
            <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">
              <strong>{budget.over_budget_days}</strong> day
              {budget.over_budget_days === 1 ? " goes" : "s go"} over your{" "}
              {money(budget.daily_budget ?? 0)} daily budget. Trim activities or move them to a lighter day.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-900">Where the money goes</h2>
              <DonutChart slices={slices} centerLabel="Total" centerValue={money(budget.total)} />
            </section>

            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-ink-900">Cost by city</h2>
              <BarChart bars={budget.by_city.map((c) => ({ label: c.city, value: c.total }))} />
              <p className="mt-3 text-xs text-ink-400">
                {budget.by_city.map((c) => `${c.city} · ${c.nights}n`).join("   ")}
              </p>
            </section>
          </div>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Day-by-day spend</h2>
              {budget.daily_budget && (
                <span className="text-xs text-ink-500">
                  vertical line = {money2(budget.daily_budget)} budget
                </span>
              )}
            </div>
            <BarChart
              limit={budget.daily_budget}
              bars={budget.daily.map((d) => ({
                label: shortDate(d.day), value: d.cost, danger: d.over_budget,
              }))}
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  return <RequireAuth><BudgetBody /></RequireAuth>;
}
