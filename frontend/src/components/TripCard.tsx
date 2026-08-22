import Link from "next/link";

import { dateRange, nights, STATUS_STYLES } from "@/lib/format";
import type { Trip } from "@/lib/types";

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link href={`/trips/${trip.id}`} className="card block p-5 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink-900">{trip.name}</h3>
        <span className={`chip ${STATUS_STYLES[trip.status]}`}>{trip.status}</span>
      </div>
      <p className="text-sm text-ink-500">{dateRange(trip.start_date, trip.end_date)}</p>
      {trip.description && (
        <p className="mt-2 line-clamp-2 text-sm text-ink-500">{trip.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
        <span>{nights(trip.start_date, trip.end_date)} nights</span>
        {trip.is_public && <span className="chip bg-brand-50 text-brand-700">Shared</span>}
      </div>
    </Link>
  );
}
