"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ActivityPicker from "@/components/ActivityPicker";
import CityPicker from "@/components/CityPicker";
import ErrorText from "@/components/ErrorText";
import Modal from "@/components/Modal";
import RequireAuth from "@/components/RequireAuth";
import TripHeader from "@/components/TripHeader";
import TripTabs from "@/components/TripTabs";
import { Empty, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { duration, money2, nights, shortDate } from "@/lib/format";
import type { Activity, City, Stop, TripDetail } from "@/lib/types";

type StopForm = {
  city: City | null; start_date: string; end_date: string;
  transport_cost: string; accommodation_cost: string; meal_cost: string;
};

const emptyForm = (start: string, end: string): StopForm => ({
  city: null, start_date: start, end_date: end,
  transport_cost: "", accommodation_cost: "", meal_cost: "",
});

function StopCard({
  stop, index, count, onMove, onDelete, onEdit, onAddActivity, onRemoveActivity,
}: {
  stop: Stop; index: number; count: number;
  onMove: (dir: -1 | 1) => void; onDelete: () => void; onEdit: () => void;
  onAddActivity: () => void; onRemoveActivity: (linkId: number) => void;
}) {
  const activityTotal = stop.activities.reduce(
    (sum, l) => sum + Number(l.cost_override ?? l.activity.cost), 0);
  const stopTotal = Number(stop.transport_cost) + Number(stop.accommodation_cost)
    + Number(stop.meal_cost) + activityTotal;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full
                           bg-brand-600 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <div>
            <h3 className="font-semibold text-ink-900">
              {stop.city.name}
              <span className="ml-2 text-sm font-normal text-ink-500">{stop.city.country}</span>
            </h3>
            <p className="text-sm text-ink-500">
              {shortDate(stop.start_date)} – {shortDate(stop.end_date)} ·{" "}
              {nights(stop.start_date, stop.end_date)} nights · {money2(stopTotal)}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0}
                  className="btn-ghost px-2.5 py-1.5" title="Move up">↑</button>
          <button onClick={() => onMove(1)} disabled={index === count - 1}
                  className="btn-ghost px-2.5 py-1.5" title="Move down">↓</button>
          <button onClick={onEdit} className="btn-ghost px-3 py-1.5">Edit</button>
          <button onClick={onDelete} className="btn-ghost px-3 py-1.5 text-danger-600">Remove</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          ["Transport", stop.transport_cost],
          ["Stay", stop.accommodation_cost],
          ["Meals", stop.meal_cost],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg bg-ink-50 px-3 py-2">
            <p className="text-xs text-ink-500">{label}</p>
            <p className="text-sm font-medium text-ink-900">{money2(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-ink-700">
            Activities <span className="text-ink-400">({stop.activities.length})</span>
          </p>
          <button onClick={onAddActivity} className="text-sm font-medium text-brand-700 hover:underline cursor-pointer">
            + Add activity
          </button>
        </div>

        {stop.activities.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-3 text-sm text-ink-400">
            No activities yet — add something to do in {stop.city.name}.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {stop.activities.map((link) => (
              <li key={link.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink-900">{link.activity.name}</span>
                  <span className="text-xs text-ink-500">
                    {link.activity.category} · {duration(link.activity.duration_mins)} ·{" "}
                    {money2(Number(link.cost_override ?? link.activity.cost))}
                  </span>
                </span>
                <button onClick={() => onRemoveActivity(link.id)}
                        className="cursor-pointer text-sm text-ink-400 hover:text-danger-600">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BuilderBody() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [stopModal, setStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [cityModal, setCityModal] = useState(false);
  const [form, setForm] = useState<StopForm>(emptyForm("", ""));
  const [formError, setFormError] = useState<string | null>(null);
  const [activityStop, setActivityStop] = useState<Stop | null>(null);

  const load = useCallback(async () => {
    try {
      setTrip(await api.get<TripDetail>(`/api/trips/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load trip");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function openAddStop() {
    if (!trip) return;
    setEditingStop(null);
    setForm(emptyForm(trip.start_date, trip.end_date));
    setFormError(null);
    setStopModal(true);
  }

  function openEditStop(stop: Stop) {
    setEditingStop(stop);
    setForm({
      city: stop.city,
      start_date: stop.start_date,
      end_date: stop.end_date,
      transport_cost: String(stop.transport_cost),
      accommodation_cost: String(stop.accommodation_cost),
      meal_cost: String(stop.meal_cost),
    });
    setFormError(null);
    setStopModal(true);
  }

  async function saveStop(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    setFormError(null);

    if (!form.city) return setFormError("Pick a city first");
    if (form.end_date < form.start_date) return setFormError("End date cannot be before start date");
    if (form.start_date < trip.start_date || form.end_date > trip.end_date) {
      return setFormError("Stop dates must fall inside the trip dates");
    }

    const payload = {
      city_id: form.city.id,
      start_date: form.start_date,
      end_date: form.end_date,
      transport_cost: Number(form.transport_cost || 0),
      accommodation_cost: Number(form.accommodation_cost || 0),
      meal_cost: Number(form.meal_cost || 0),
    };

    try {
      if (editingStop) await api.patch(`/api/stops/${editingStop.id}`, payload);
      else await api.post(`/api/trips/${trip.id}/stops`, payload);
      setStopModal(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save stop");
    }
  }

  async function moveStop(index: number, dir: -1 | 1) {
    if (!trip) return;
    const ids = trip.stops.map((s) => s.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await api.post(`/api/trips/${trip.id}/reorder`, ids);
    await load();
  }

  async function deleteStop(stop: Stop) {
    if (!confirm(`Remove ${stop.city.name} from this trip?`)) return;
    await api.del(`/api/stops/${stop.id}`);
    await load();
  }

  async function addActivity(a: Activity) {
    if (!activityStop) return;
    try {
      await api.post(`/api/stops/${activityStop.id}/activities`, { activity_id: a.id });
      const fresh = await api.get<TripDetail>(`/api/trips/${id}`);
      setTrip(fresh);
      setActivityStop(fresh.stops.find((s) => s.id === activityStop.id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add activity");
    }
  }

  async function removeActivity(linkId: number) {
    await api.del(`/api/stop-activities/${linkId}`);
    await load();
  }

  async function shareTrip() {
    await api.post(`/api/trips/${id}/share`);
    await load();
  }

  async function deleteTrip() {
    if (!confirm("Delete this trip permanently?")) return;
    await api.del(`/api/trips/${id}`);
    router.push("/trips");
  }

  if (error) return <p className="text-danger-600">{error}</p>;
  if (!trip) return <Loading />;

  return (
    <div>
      <TripHeader trip={trip} onShare={shareTrip} onDelete={deleteTrip} />
      <TripTabs tripId={trip.id} />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">
          Stops <span className="text-ink-400">({trip.stops.length})</span>
        </h2>
        <button onClick={openAddStop} className="btn-primary">+ Add stop</button>
      </div>

      {trip.stops.length === 0 ? (
        <Empty
          title="No stops yet"
          hint="Add the first city you will visit, then attach activities to it."
          action={<button onClick={openAddStop} className="btn-primary mt-2">Add first stop</button>}
        />
      ) : (
        <div className="space-y-4">
          {trip.stops.map((stop, i) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={i}
              count={trip.stops.length}
              onMove={(dir) => moveStop(i, dir)}
              onEdit={() => openEditStop(stop)}
              onDelete={() => deleteStop(stop)}
              onAddActivity={() => setActivityStop(stop)}
              onRemoveActivity={removeActivity}
            />
          ))}
        </div>
      )}

      <Modal open={stopModal} title={editingStop ? "Edit stop" : "Add a stop"}
             onClose={() => setStopModal(false)}>
        <form onSubmit={saveStop} className="space-y-4" noValidate>
          <ErrorText message={formError} />

          <div>
            <span className="label">City *</span>
            <button type="button" onClick={() => setCityModal(true)}
                    className="input flex items-center justify-between text-left">
              <span className={form.city ? "text-ink-900" : "text-ink-400"}>
                {form.city ? `${form.city.name}, ${form.city.country}` : "Choose a city"}
              </span>
              <span className="text-ink-400">Change</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="s_start" className="label">Arrive *</label>
              <input id="s_start" type="date" required className="input"
                     min={trip.start_date} max={trip.end_date} value={form.start_date}
                     onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label htmlFor="s_end" className="label">Leave *</label>
              <input id="s_end" type="date" required className="input"
                     min={form.start_date || trip.start_date} max={trip.end_date} value={form.end_date}
                     onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["transport_cost", "Transport"],
              ["accommodation_cost", "Stay"],
              ["meal_cost", "Meals"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label htmlFor={key} className="label">{label}</label>
                <input id={key} type="number" min={0} step="1" className="input" placeholder="0"
                       value={form[key]}
                       onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary">
              {editingStop ? "Save changes" : "Add stop"}
            </button>
            <button type="button" onClick={() => setStopModal(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={cityModal} title="Choose a city" wide onClose={() => setCityModal(false)}>
        <CityPicker onPick={(city) => { setForm((f) => ({ ...f, city })); setCityModal(false); }} />
      </Modal>

      <Modal
        open={activityStop !== null}
        title={activityStop ? `Activities in ${activityStop.city.name}` : ""}
        wide
        onClose={() => setActivityStop(null)}
      >
        {activityStop && (
          <ActivityPicker
            cityId={activityStop.city_id}
            addedIds={activityStop.activities.map((l) => l.activity_id)}
            onPick={addActivity}
          />
        )}
      </Modal>
    </div>
  );
}

export default function TripPage() {
  return <RequireAuth><BuilderBody /></RequireAuth>;
}
