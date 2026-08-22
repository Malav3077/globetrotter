"use client";

export type SelectOption = { value: string; label: string };

type Props = {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  groupBy?: { value: string; options: SelectOption[]; onChange: (v: string) => void };
  filters?: { key: string; value: string; options: SelectOption[]; onChange: (v: string) => void }[];
  sort?: { value: string; options: SelectOption[]; onChange: (v: string) => void };
  order?: { value: "asc" | "desc"; onChange: (v: "asc" | "desc") => void };
  total?: number;
};

function Select({ value, options, onChange, prefix }: {
  value: string; options: SelectOption[]; onChange: (v: string) => void; prefix: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{prefix}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-lg border border-ink-200 bg-white
                   py-2.5 pl-3 pr-8 text-sm text-ink-700 outline-none
                   focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value === "" ? o.label : `${prefix}: ${o.label}`}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400">▾</span>
    </label>
  );
}

export default function ListToolbar({
  search, onSearch, placeholder = "Search…", groupBy, filters, sort, order, total,
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="input pl-9"
          aria-label="Search"
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">⌕</span>
      </div>

      {groupBy && (
        <Select prefix="Group by" value={groupBy.value} options={groupBy.options} onChange={groupBy.onChange} />
      )}
      {filters?.map((f) => (
        <Select key={f.key} prefix={f.key} value={f.value} options={f.options} onChange={f.onChange} />
      ))}
      {sort && <Select prefix="Sort by" value={sort.value} options={sort.options} onChange={sort.onChange} />}
      {order && (
        <button
          type="button"
          onClick={() => order.onChange(order.value === "asc" ? "desc" : "asc")}
          className="btn-ghost px-3"
          title={order.value === "asc" ? "Ascending" : "Descending"}
        >
          {order.value === "asc" ? "↑" : "↓"}
        </button>
      )}

      {total !== undefined && (
        <span className="ml-auto text-sm text-ink-500">{total} result{total === 1 ? "" : "s"}</span>
      )}
    </div>
  );
}
