"use client";

import { useEffect, useState } from "react";

import ListToolbar from "@/components/ListToolbar";
import { Empty, Loading } from "@/components/States";
import { api, qs } from "@/lib/api";
import type { City, Page } from "@/lib/types";

export default function CityPicker({ onPick }: { onPick: (city: City) => void }) {
  const [data, setData] = useState<Page<City> | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    api.get<string[]>("/api/cities/countries").then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<Page<City>>(`/api/cities${qs({ q: search, country, sort_by: sortBy, order, page_size: 24 })}`)
        .then(setData)
        .catch(() => setData(null));
    }, 220);
    return () => clearTimeout(t);
  }, [search, country, sortBy, order]);

  return (
    <div>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search a city…"
        total={data?.total}
        filters={[{
          key: "Country", value: country, onChange: setCountry,
          options: [{ value: "", label: "All countries" },
                    ...countries.map((c) => ({ value: c, label: c }))],
        }]}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "popularity", label: "Popularity" },
            { value: "cost_index", label: "Cost" },
            { value: "name", label: "Name" },
          ],
        }}
        order={{ value: order, onChange: setOrder }}
      />

      {!data ? <Loading /> : data.items.length === 0 ? (
        <Empty title="No cities found" hint="Try a different name or clear the country filter." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.items.map((city) => (
            <button
              key={city.id}
              onClick={() => onPick(city)}
              className="flex cursor-pointer items-center justify-between rounded-lg border
                         border-ink-200 px-3.5 py-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <span>
                <span className="block text-sm font-medium text-ink-900">{city.name}</span>
                <span className="block text-xs text-ink-500">{city.country}</span>
              </span>
              <span className="text-xs text-ink-400">
                cost {Number(city.cost_index).toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
