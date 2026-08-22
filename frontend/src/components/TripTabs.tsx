"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { seg: "", label: "Builder" },
  { seg: "itinerary", label: "Itinerary" },
  { seg: "budget", label: "Budget" },
  { seg: "calendar", label: "Calendar" },
];

export default function TripTabs({ tripId }: { tripId: number }) {
  const pathname = usePathname();
  const base = `/trips/${tripId}`;

  return (
    <div className="mb-6 flex gap-1 border-b border-ink-100">
      {TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        const active = pathname === href;
        return (
          <Link
            key={t.label}
            href={href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
