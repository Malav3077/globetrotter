"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import ActivityPicker from "@/components/ActivityPicker";
import CityPicker from "@/components/CityPicker";
import RequireAuth from "@/components/RequireAuth";
import { Loading } from "@/components/States";
import { api } from "@/lib/api";
import type { City } from "@/lib/types";

function ExploreBody() {
  const params = useSearchParams();
  const cityParam = params.get("city");
  const [city, setCity] = useState<City | null>(null);
  const [tab, setTab] = useState<"cities" | "activities">(cityParam ? "activities" : "cities");

  useEffect(() => {
    if (!cityParam) return;
    api.get<City>(`/api/cities/${cityParam}`).then((c) => { setCity(c); setTab("activities"); })
      .catch(() => setCity(null));
  }, [cityParam]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink-900">Explore</h1>
      <p className="mb-6 text-sm text-ink-500">
        Browse destinations and things to do, then add them to a trip from the Builder.
      </p>

      <div className="mb-5 flex gap-1 border-b border-ink-100">
        {(["cities", "activities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "cities" ? (
        <CityPicker onPick={(c) => { setCity(c); setTab("activities"); }} />
      ) : city ? (
        <div>
          <div className="mb-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
            <p className="text-sm text-brand-800">
              Showing activities in <strong>{city.name}</strong>, {city.country}
            </p>
            <button onClick={() => setTab("cities")}
                    className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
              Change city
            </button>
          </div>
          <ActivityPicker cityId={city.id} addedIds={[]} onPick={() => {}} />
        </div>
      ) : (
        <div className="card px-6 py-12 text-center">
          <p className="text-ink-600">Pick a city first to see its activities.</p>
          <button onClick={() => setTab("cities")} className="btn-primary mt-3">Browse cities</button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <RequireAuth>
      <Suspense fallback={<Loading />}>
        <ExploreBody />
      </Suspense>
    </RequireAuth>
  );
}
