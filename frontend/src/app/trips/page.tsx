"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ListToolbar from "@/components/ListToolbar";
import RequireAuth from "@/components/RequireAuth";
import TripCard from "@/components/TripCard";
import { Empty, Loading } from "@/components/States";
import { api, qs } from "@/lib/api";
import type { Trip, TripStatus } from "@/lib/types";

const STATUS_ORDER: TripStatus[] = ["ongoing", "upcoming", "completed"];

function TripsBody() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [grouped, setGrouped] = useState("status");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setError(null);
      api
        .get<Trip[]>(`/api/trips${qs({ q: search, trip_status: statusFilter, sort_by: sortBy, order })}`)
        .then(setTrips)
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter, sortBy, order]);

  const groups = useMemo(() => {
    if (!trips) return [];
    if (grouped !== "status") return [{ key: "All trips", items: trips }];
    return STATUS_ORDER.map((s) => ({
      key: s[0].toUpperCase() + s.slice(1),
      items: trips.filter((t) => t.status === s),
    })).filter((g) => g.items.length > 0);
  }, [trips, grouped]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink-900">My Trips</h1>
        <Link href="/trips/new" className="btn-primary">+ Plan a trip</Link>
      </div>

      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search trips by name…"
        total={trips?.length}
        groupBy={{
          value: grouped,
          onChange: setGrouped,
          options: [
            { value: "status", label: "Status" },
            { value: "none", label: "None" },
          ],
        }}
        filters={[{
          key: "Status",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: "", label: "All statuses" },
            { value: "ongoing", label: "Ongoing" },
            { value: "upcoming", label: "Upcoming" },
            { value: "completed", label: "Completed" },
          ],
        }]}
        sort={{
          value: sortBy,
          onChange: setSortBy,
          options: [
            { value: "start_date", label: "Start date" },
            { value: "end_date", label: "End date" },
            { value: "name", label: "Name" },
            { value: "created_at", label: "Created" },
          ],
        }}
        order={{ value: order, onChange: setOrder }}
      />

      {error && <p className="text-danger-600">{error}</p>}
      {!trips ? (
        <Loading />
      ) : trips.length === 0 ? (
        <Empty
          title={search ? "No trips match your search" : "No trips yet"}
          hint={search ? "Try a different name." : "Plan your first multi-city trip."}
          action={!search ? <Link href="/trips/new" className="btn-primary mt-2">Plan a trip</Link> : undefined}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
                {g.key}
                <span className="chip bg-ink-100 text-ink-600">{g.items.length}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((t) => <TripCard key={t.id} trip={t} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  return <RequireAuth><TripsBody /></RequireAuth>;
}
