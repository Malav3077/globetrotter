"use client";

import { useState } from "react";

import { dateRange, money, STATUS_STYLES } from "@/lib/format";
import type { Trip } from "@/lib/types";

export default function TripHeader({
  trip, total, onShare, onDelete,
}: {
  trip: Trip; total?: number;
  onShare?: () => Promise<void>; onDelete?: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = trip.share_slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${trip.share_slug}`
    : null;

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink-900">{trip.name}</h1>
            <span className={`chip ${STATUS_STYLES[trip.status]}`}>{trip.status}</span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {dateRange(trip.start_date, trip.end_date)}
            {total !== undefined && <> · <span className="font-medium text-ink-700">{money(total)}</span></>}
            {trip.daily_budget && <> · budget {money(Number(trip.daily_budget))}/day</>}
          </p>
          {trip.description && <p className="mt-2 max-w-2xl text-sm text-ink-500">{trip.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {shareUrl ? (
            <button onClick={copyLink} className="btn-ghost">
              {copied ? "Link copied" : "Copy share link"}
            </button>
          ) : (
            onShare && <button onClick={onShare} className="btn-ghost">Share trip</button>
          )}
          {onDelete && <button onClick={onDelete} className="btn-danger">Delete</button>}
        </div>
      </div>
    </div>
  );
}
