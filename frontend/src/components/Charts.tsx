"use client";

import { money } from "@/lib/format";

export type Slice = { label: string; value: number; color: string };

export function DonutChart({ slices, centerLabel, centerValue }: {
  slices: Slice[]; centerLabel: string; centerValue: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 60, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-ink-100)" strokeWidth="22" />
        {total > 0 && slices.map((s) => {
          const len = (s.value / total) * C;
          const el = (
            <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={s.color}
                    strokeWidth="22" strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
        <text x="80" y="74" transform="rotate(90 80 80)" textAnchor="middle"
              className="fill-ink-400 text-[9px]">{centerLabel}</text>
        <text x="80" y="90" transform="rotate(90 80 80)" textAnchor="middle"
              className="fill-ink-900 text-[15px] font-semibold">{centerValue}</text>
      </svg>

      <ul className="min-w-[180px] flex-1 space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-ink-600">{s.label}</span>
            <span className="font-medium text-ink-900">{money(s.value)}</span>
            <span className="w-10 text-right text-xs text-ink-400">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarChart({ bars, limit }: {
  bars: { label: string; value: number; danger?: boolean }[]; limit?: number | null;
}) {
  const max = Math.max(...bars.map((b) => b.value), limit ?? 0, 1);

  return (
    <div className="space-y-1.5">
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-ink-500">{b.label}</span>
          <div className="relative h-6 flex-1 overflow-hidden rounded bg-ink-50">
            <div
              className={`h-full rounded transition-all ${b.danger ? "bg-danger-500" : "bg-brand-500"}`}
              style={{ width: `${(b.value / max) * 100}%` }}
            />
            {limit != null && limit > 0 && (
              <div className="absolute inset-y-0 w-px bg-ink-400"
                   style={{ left: `${(limit / max) * 100}%` }} title={`Budget ${money(limit)}`} />
            )}
          </div>
          <span className={`w-20 shrink-0 text-right text-xs font-medium ${
            b.danger ? "text-danger-600" : "text-ink-700"}`}>
            {money(b.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
