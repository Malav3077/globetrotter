export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const money2 = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "USD" }).format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const dateRange = (a: string, b: string) => `${shortDate(a)} – ${longDate(b)}`;

export const nights = (a: string, b: string) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

export const duration = (mins: number) =>
  mins >= 60 ? `${Math.round((mins / 60) * 10) / 10}h` : `${mins}m`;

export const STATUS_STYLES: Record<string, string> = {
  ongoing: "bg-brand-100 text-brand-700",
  upcoming: "bg-sun-50 text-sun-600",
  completed: "bg-ink-100 text-ink-600",
};
