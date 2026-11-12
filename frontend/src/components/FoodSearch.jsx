import { useEffect, useRef, useState } from 'react';
import { foodAPI } from '../services/api';

const SOURCES = { usda_foundation: 'USDA', usda_sr: 'USDA', usda_branded: 'USDA', cnf: 'Health Canada', off: 'Open Food Facts', custom: 'Mine' };

function kcalFor(f) {
  return f.serving_g && f.serving_label
    ? `${Math.round((f.kcal_100g * f.serving_g) / 100)} kcal / ${f.serving_label}`
    : `${Math.round(f.kcal_100g)} kcal / 100 g`;
}

// onSelect(food) is called with the FoodOut row; onCreate() opens the custom food form.
export default function FoodSearch({ onSelect, onCreate }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const ctrl = useRef(null);

  useEffect(() => {
    foodAPI.recent().then((r) => setRecent(r.data.map((u) => u.food))).catch(() => {});
  }, []);

  useEffect(() => {
    ctrl.current?.abort();
    const term = q.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const t = setTimeout(() => {
      const c = new AbortController();
      ctrl.current = c;
      foodAPI.search(term, { signal: c.signal })
        .then((r) => { setResults(r.data); setError(false); setLoading(false); })
        .catch(() => {
          if (c.signal.aborted) return; // superseded; the newer request owns the state
          setError(true); setLoading(false);
        });
    }, 200);
    return () => { clearTimeout(t); ctrl.current?.abort(); };
  }, [q]);

  const list = q.trim() ? results : recent;

  return (
    <div className="flex flex-col gap-2">
      <input
        autoFocus
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search foods"
        className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
      />
      {!q.trim() && recent.length > 0 && <p className="text-xs text-neutral-500">Recent</p>}
      {error && <p className="text-sm text-danger-600">Search failed. Try again.</p>}
      <ul>
        {list.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => onSelect?.(f)}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 py-2 text-left">
              <span className="min-w-0">
                <span className="block truncate">
                  {f.name}{f.quality === 'suspect' && <span title="Data may be unreliable" aria-label="suspect data"> ⚠️</span>}
                </span>
                {f.brand && <span className="block truncate text-sm text-neutral-500">{f.brand}</span>}
              </span>
              <span className="shrink-0 text-right text-sm">
                {kcalFor(f)}
                <span className="block text-xs text-neutral-500">{SOURCES[f.source] || f.source}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {q.trim() && !loading && !error && results.length === 0 && <p className="text-sm text-neutral-500">No matches.</p>}
      {q.trim() && !loading && (
        <button type="button" onClick={onCreate} className="min-h-[44px] text-left text-sm underline">
          Can&apos;t find it? Create a food
        </button>
      )}
    </div>
  );
}
