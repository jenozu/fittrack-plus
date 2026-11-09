import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, ScanLine } from 'lucide-react';
import { dashboardAPI, foodAPI } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';
import CustomFoodForm from '../components/CustomFoodForm';
import PortionPicker, { defaultMeal } from '../components/PortionPicker';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const ymd = (d) => format(d, 'yyyy-MM-dd');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const num = (v) => Math.round(v || 0);

function portionText(e) {
  if (e.portion_label === 'g' || (!e.portion_label && e.grams)) return `${num(e.grams)} g`;
  return e.portion_label ? `${Math.round((e.quantity || 1) * 10) / 10} ${e.portion_label}` : '';
}

function Bar({ label, value, target }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><span>{num(value)} / {num(target)} g</span></div>
      <div className="h-2 rounded-full bg-neutral-200"><div className="h-2 rounded-full bg-pink-300" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const today = ymd(new Date());
  const [date, setDate] = useState(today);
  const [data, setData] = useState(null); // {entries, totals, target}
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [edit, setEdit] = useState(null); // {entry, food}
  const [scanning, setScanning] = useState(false);
  const [picked, setPicked] = useState(null);
  const [missing, setMissing] = useState(null);
  const [customForm, setCustomForm] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async (d, sig) => {
    try {
      const [day, sum] = await Promise.all([foodAPI.getEntries(d), dashboardAPI.getDailySummary(d)]);
      if (sig?.stale) return;
      setData({ entries: day.data.entries, totals: day.data.totals, target: sum.data });
      setError(false);
    } catch {
      if (!sig?.stale) setError(true);
    } finally {
      if (!sig?.stale) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sig = { stale: false };
    setLoading(true);
    load(date, sig);
    return () => { sig.stale = true; };
  }, [date, load]);

  useEffect(() => {
    foodAPI.recent().then((r) => setRecent(r.data.slice(0, 10))).catch(() => {});
  }, []);

  const refresh = () => { setEdit(null); setPicked(null); load(date); };
  const shift = (n) => setDate(ymd(addDays(parseISO(date), n)));

  async function openEdit(entry) {
    if (!entry.food_id) { // quick-add entries have no food to re-portion
      if (window.confirm(`Delete ${entry.food_name}?`)) { await foodAPI.deleteEntry(entry.id).catch(() => {}); refresh(); }
      return;
    }
    try {
      const r = await foodAPI.get(entry.food_id);
      setEdit({ entry, food: r.data });
    } catch { setNote("Couldn't open that entry."); }
  }

  async function quickAdd(u) {
    const body = { food_id: u.food.id, meal_type: defaultMeal(), entry_date: date,
      ...(u.portion_label && u.portion_label !== 'g' ? { portion_label: u.portion_label, quantity: u.quantity || 1 } : { grams: u.grams || 100 }) };
    try { await foodAPI.createEntry(body); load(date); } catch { setNote("Couldn't add that food."); }
  }

  async function copyYesterday(meal) {
    const from_date = ymd(addDays(parseISO(date), -1));
    try {
      const r = await foodAPI.copyEntries({ from_date, to_date: date, meal_type: meal });
      setNote(r.data.length ? '' : `Nothing logged for ${meal} yesterday.`);
      load(date);
    } catch { setNote("Couldn't copy."); }
  }

  async function onScan(code) {
    setScanning(false);
    try {
      setPicked((await foodAPI.byBarcode(code)).data);
    } catch (e) {
      if (e.response?.status === 404) setMissing(code); else setNote('Barcode lookup failed. Try again.');
    }
  }

  const t = data?.target;
  const tot = data?.totals;
  const iconBtn = 'flex h-11 w-11 items-center justify-center rounded-lg';

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Previous day" onClick={() => shift(-1)} className={iconBtn}><ChevronLeft /></button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">{date === today ? 'Today' : format(parseISO(date), 'EEE, MMM d')}</h1>
          {date !== today && <button type="button" onClick={() => setDate(today)} className="min-h-[44px] text-sm text-blue-600">Today</button>}
        </div>
        <button type="button" aria-label="Next day" onClick={() => shift(1)} className={iconBtn}><ChevronRight /></button>
      </div>

      {error && <p className="text-sm text-red-500">Couldn&apos;t load. <button type="button" className="underline" onClick={() => load(date)}>Retry</button></p>}
      {note && <p className="text-sm text-neutral-600">{note}</p>}

      <div className="min-h-[170px] space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        {loading || !data ? (
          <div className="flex h-[140px] items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-5xl font-bold" data-testid="remaining">{num(t.target_calories - tot.calories)}</div>
              <div className="text-sm text-neutral-500">kcal remaining · {num(tot.calories)} of {num(t.target_calories)}</div>
            </div>
            <Bar label="Protein" value={tot.protein_g} target={t.target_protein_g} />
            <Bar label="Carbs" value={tot.carbs_g} target={t.target_carbs_g} />
            <Bar label="Fat" value={tot.fat_g} target={t.target_fat_g} />
          </>
        )}
      </div>

      <button type="button" onClick={() => setScanning(true)}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 text-base text-white">
        <ScanLine size={20} /> Scan barcode
      </button>

      {recent.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {recent.map((u) => (
            <button key={u.food.id} type="button" onClick={() => quickAdd(u)}
              className="min-h-[44px] shrink-0 rounded-full border border-neutral-300 bg-white px-3 text-sm">
              + {u.food.name.length > 22 ? `${u.food.name.slice(0, 22)}…` : u.food.name}
            </button>
          ))}
        </div>
      )}

      {data && MEALS.map((m) => {
        const items = data.entries.filter((e) => e.meal_type === m);
        const kcal = items.reduce((s, e) => s + e.calories, 0);
        return (
          <section key={m} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{cap(m)}</h2>
              <span className="text-sm text-neutral-500">{num(kcal)} kcal</span>
            </div>
            {items.length === 0 && <p className="py-2 text-sm text-neutral-400">Nothing yet</p>}
            {items.map((e) => (
              <button key={e.id} type="button" onClick={() => openEdit(e)}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 border-b border-neutral-100 text-left last:border-0">
                <span className="min-w-0"><span className="block truncate">{e.food_name}</span>
                  <span className="block text-xs text-neutral-500">{portionText(e)}</span></span>
                <span className="shrink-0 text-sm">{num(e.calories)}</span>
              </button>
            ))}
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => navigate(`/food?meal=${m}&date=${date}`)}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg bg-pink-100 text-sm">
                <Plus size={16} /> Add
              </button>
              <button type="button" onClick={() => copyYesterday(m)}
                className="min-h-[44px] flex-1 rounded-lg border border-neutral-300 text-sm">Copy yesterday&apos;s {m}</button>
            </div>
          </section>
        );
      })}

      {edit && <PortionPicker food={edit.food} entry={edit.entry} date={date} onAdded={refresh} onDeleted={refresh} onClose={() => setEdit(null)} />}
      {picked && <PortionPicker food={picked} date={date} onAdded={refresh} onClose={() => setPicked(null)} />}
      {scanning && <BarcodeScanner onScan={onScan} onClose={() => setScanning(false)} />}
      {missing && !customForm && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-sm">No food found for {missing}.</p>
          <div className="flex gap-2">
            <button type="button" className="min-h-[44px] px-2 text-sm" onClick={() => setMissing(null)}>Dismiss</button>
            <button type="button" className="min-h-[44px] rounded-lg bg-pink-100 px-3 text-sm" onClick={() => setCustomForm(true)}>Add it</button>
          </div>
        </div>
      )}
      {customForm && (
        <CustomFoodForm barcode={missing || ''} onClose={() => { setCustomForm(false); setMissing(null); }}
          onCreated={(f) => { setCustomForm(false); setMissing(null); setPicked(f); }} />
      )}
    </div>
  );
};

export default Dashboard;
