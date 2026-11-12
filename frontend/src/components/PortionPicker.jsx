import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { foodAPI } from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export function defaultMeal(d = new Date()) {
  const m = d.getHours() * 60 + d.getMinutes();
  if (m < 630) return 'breakfast';
  if (m < 900) return 'lunch';
  if (m < 1260) return 'dinner';
  return 'snack';
}

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const r = (v, d) => Math.round(v * 10 ** d) / 10 ** d; // same rounding as services/nutrition.py

// food: FoodOut; date: 'YYYY-MM-DD'; onAdded(entry) / onClose() callbacks.
// meal: optional preselected meal. entry: edit mode (update/delete that diary entry); onAdded fires after save, onDeleted after delete.
export default function PortionPicker({ food, date, meal: mealProp, entry, onAdded, onDeleted, onClose }) {
  const portions = food.portions || [];
  const editLabel = entry && (entry.portion_label === 'g' || portions.some((p) => p.label === entry.portion_label)) ? entry.portion_label : null;
  const first = food.serving_label && portions.find((p) => p.label === food.serving_label) ? food.serving_label : portions[0]?.label;
  const [label, setLabel] = useState(editLabel || first || 'g');
  const [qty, setQty] = useState(editLabel ? String(editLabel === 'g' ? entry.grams ?? entry.quantity : entry.quantity) : first ? '1' : '100');
  const [meal, setMeal] = useState(entry?.meal_type || mealProp || defaultMeal());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [fav, setFav] = useState(false);
  useEffect(() => {
    foodAPI.favourites().then((r) => setFav(r.data.some((f) => f.id === food.id))).catch(() => {});
  }, [food.id]);
  function toggleFav() {
    const on = fav;
    setFav(!on);
    (on ? foodAPI.removeFavourite(food.id) : foodAPI.addFavourite(food.id)).catch(() => setFav(on));
  }

  const q = parseFloat(qty);
  const valid = q > 0;
  const per = label === 'g' ? 1 : portions.find((p) => p.label === label)?.grams ?? 0;
  const grams = valid ? per * q : 0;
  const show = (k, d) => (food[k] == null ? '-' : r((food[k] * grams) / 100, d));

  async function add() {
    setBusy(true); setError(false);
    const body = { food_id: food.id, meal_type: meal, entry_date: date,
      ...(label === 'g' ? { grams: q } : { portion_label: label, quantity: q }) };
    try {
      const res = entry ? await foodAPI.updateEntry(entry.id, body) : await foodAPI.createEntry(body);
      onAdded?.(res.data);
    } catch {
      setError(true); setBusy(false);
    }
  }

  async function del() {
    setBusy(true); setError(false);
    try {
      await foodAPI.deleteEntry(entry.id);
      onDeleted?.();
    } catch {
      setError(true); setBusy(false);
    }
  }

  const field = 'min-h-[44px] rounded-lg border border-neutral-300 px-3 text-base';
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div role="dialog" aria-label={food.name} onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-lg font-semibold">{food.name}</h2>
          <button type="button" onClick={toggleFav} aria-pressed={fav} aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
            className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Star size={22} className={fav ? 'fill-amber-400 text-amber-500' : 'text-neutral-400'} />
          </button>
        </div>
        <div className="flex gap-2">
          <input type="text" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)}
            aria-label="Quantity" className={`${field} w-24`} />
          <select value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Portion" className={`${field} min-w-0 flex-1`}>
            {portions.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
            <option value="g">g</option>
          </select>
        </div>
        <select value={meal} onChange={(e) => setMeal(e.target.value)} aria-label="Meal" className={field}>
          {MEALS.map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}
        </select>
        <p className="text-sm" data-testid="preview">
          <strong>{show('kcal_100g', 1)} kcal</strong> · P {show('protein_100g', 1)} · C {show('carbs_100g', 1)} · F {show('fat_100g', 1)}
        </p>
        {error && <p className="text-sm text-danger-600">Couldn&apos;t add. Try again.</p>}
        <button type="button" disabled={!valid || busy} onClick={add}
          className="min-h-[44px] rounded-lg bg-brand-600 hover:bg-brand-700 text-base text-white disabled:opacity-50">{entry ? 'Save' : 'Add'}</button>
        {entry && (
          <button type="button" disabled={busy} onClick={del}
            className="min-h-[44px] rounded-lg border border-danger-600 text-base text-danger-600 disabled:opacity-50">Delete</button>
        )}
      </div>
    </div>
  );
}
