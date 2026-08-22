"use client";

import { useEffect, useState } from "react";

import ListToolbar from "@/components/ListToolbar";
import { Empty, GroupBadges, Loading } from "@/components/States";
import { api, qs } from "@/lib/api";
import { duration, money2 } from "@/lib/format";
import type { Activity, Page } from "@/lib/types";

export default function ActivityPicker({
  cityId, addedIds, onPick,
}: { cityId: number; addedIds: number[]; onPick: (a: Activity) => void }) {
  const [data, setData] = useState<Page<Activity> | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("cost");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    api.get<string[]>("/api/activities/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<Page<Activity>>(`/api/activities${qs({
          city_id: cityId, q: search, category, sort_by: sortBy, order,
          group_by: "category", page_size: 30,
        })}`)
        .then(setData)
        .catch(() => setData(null));
    }, 220);
    return () => clearTimeout(t);
  }, [cityId, search, category, sortBy, order]);

  return (
    <div>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search activities…"
        total={data?.total}
        filters={[{
          key: "Category", value: category, onChange: setCategory,
          options: [{ value: "", label: "All categories" },
                    ...categories.map((c) => ({ value: c, label: c }))],
        }]}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "cost", label: "Cost" },
            { value: "duration", label: "Duration" },
            { value: "name", label: "Name" },
          ],
        }}
        order={{ value: order, onChange: setOrder }}
      />

      {data && <GroupBadges groups={data.groups} />}

      {!data ? <Loading /> : data.items.length === 0 ? (
        <Empty title="No activities found" hint="Try clearing the category filter." />
      ) : (
        <div className="space-y-2">
          {data.items.map((a) => {
            const added = addedIds.includes(a.id);
            return (
              <div key={a.id}
                   className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{a.name}</p>
                  <p className="text-xs text-ink-500">
                    {a.category} · {duration(a.duration_mins)} · {money2(Number(a.cost))}
                  </p>
                </div>
                <button
                  onClick={() => onPick(a)}
                  disabled={added}
                  className={added ? "btn-ghost shrink-0" : "btn-primary shrink-0"}
                >
                  {added ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
