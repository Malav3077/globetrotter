"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CityTile from "@/components/CityTile";
import ListToolbar from "@/components/ListToolbar";
import RequireAuth from "@/components/RequireAuth";
import { Empty, Loading } from "@/components/States";
import { api, qs } from "@/lib/api";
import { dateRange, money } from "@/lib/format";
import type { CommunityTrip } from "@/lib/types";

function CommunityBody() {
  const [trips, setTrips] = useState<CommunityTrip[] | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<CommunityTrip[]>(`/api/public/community${qs({ q: search, sort_by: sortBy, order })}`)
        .then(setTrips)
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search, sortBy, order]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink-900">Community</h1>
      <p className="mb-6 text-sm text-ink-500">
        Itineraries other travellers shared publicly. Open one and copy it into your own trips.
      </p>

      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search shared itineraries…"
        total={trips?.length}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "created_at", label: "Newest" },
            { value: "start_date", label: "Travel date" },
            { value: "name", label: "Name" },
          ],
        }}
        order={{ value: order, onChange: setOrder }}
      />

      {error && <p className="text-danger-600">{error}</p>}
      {!trips ? (
        <Loading />
      ) : trips.length === 0 ? (
        <Empty
          title={search ? "No shared itineraries match" : "Nothing shared yet"}
          hint="Share one of your own trips and it will show up here for everyone."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <Link key={t.slug} href={`/share/${t.slug}`}
                  className="card overflow-hidden transition-shadow hover:shadow-md">
              <CityTile name={t.cities[0] ?? t.name} className="h-20" />
              <div className="p-4">
                <h3 className="font-semibold text-ink-900">{t.name}</h3>
                <p className="text-sm text-ink-500">by {t.owner_name}</p>
                <p className="mt-1 text-xs text-ink-400">{dateRange(t.start_date, t.end_date)}</p>

                {t.cities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.cities.map((c) => (
                      <span key={c} className="chip bg-brand-50 text-brand-700">{c}</span>
                    ))}
                    {t.city_count > t.cities.length && (
                      <span className="chip bg-ink-100 text-ink-600">
                        +{t.city_count - t.cities.length}
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-3 text-sm font-medium text-ink-700">{money(t.total_cost)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  return <RequireAuth><CommunityBody /></RequireAuth>;
}
