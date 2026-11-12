import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Card, Button, Input, LoadingSpinner } from '../components/ui';
import { Check, X } from 'lucide-react';
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PERIODS = [7, 14, 30, 90];
const LB = 2.20462;

// 'YYYY-MM-DD' -> local Date (new Date(str) parses as UTC and shows the day before)
const parseLocal = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmtDay = (s) => parseLocal(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const tooltipStyle = { backgroundColor: '#FFFFFF', border: '1px solid #D4D4D4', borderRadius: '8px', fontSize: '0.875rem' };

// Trailing 7-day average by calendar day, over logs sorted ascending
const withAverages = (logs) =>
  logs.map((log) => {
    const t = parseLocal(log.log_date).getTime();
    const win = logs.filter((l) => {
      const d = (t - parseLocal(l.log_date).getTime()) / 86400000;
      return d >= 0 && d < 7;
    });
    return { date: log.log_date, kg: log.weight_kg, avgKg: win.reduce((a, l) => a + l.weight_kg, 0) / win.length };
  });

const Cell = ({ value, ok }) => (
  <div className="flex items-center gap-1 justify-end">
    <span className={ok ? 'text-neutral-800' : 'text-neutral-500'}>
      {Math.round(value)}
    </span>
    {ok
      ? <Check size={14} className="text-brand-600 shrink-0" aria-label="hit" />
      : <X size={14} className="text-neutral-500 shrink-0" aria-label="missed" />}
  </div>
);

const Progress = () => {
  const [period, setPeriod] = useState(7);
  const [calorieData, setCalorieData] = useState([]);
  const [macroData, setMacroData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(() => localStorage.getItem('weightUnit') || 'kg');
  const [weightInput, setWeightInput] = useState('');
  const toUnit = (kg) => Math.round((unit === 'lb' ? kg * LB : kg) * 10) / 10;

  const load = async () => {
    setLoading(true);
    try {
      const [c, m, w] = await Promise.all([
        dashboardAPI.getCalorieProgress(period),
        dashboardAPI.getMacroProgress(period),
        dashboardAPI.getWeightLogs(period),
      ]);
      setCalorieData(c.data.data);
      setMacroData(m.data.data);
      setWeightData(w.data);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveWeight = async (e) => {
    e.preventDefault();
    const v = parseFloat(weightInput);
    if (!v) return;
    const today = new Date();
    const log_date = new Date(today - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    try {
      await dashboardAPI.logWeight({ weight_kg: unit === 'lb' ? v / LB : v, log_date });
      setWeightInput('');
      await load();
    } catch (err) {
      console.error('Failed to log weight:', err);
    }
  };

  const weightChart = withAverages(weightData).map((p) => ({
    date: p.date, weight: toUnit(p.kg), average: toUnit(p.avgKg),
  }));
  const latest = weightChart[weightChart.length - 1];
  const change = weightChart.length > 1 ? Math.round((latest.average - weightChart[0].average) * 10) / 10 : null;

  // Macros by day, newest first
  const days = calorieData.map((c, i) => ({ ...c, ...macroData[i] })).reverse();
  const logged = days.filter((d) => d.calories_consumed > 0);
  const avgCal = logged.length ? Math.round(logged.reduce((s, d) => s + d.calories_consumed, 0) / logged.length) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-display text-neutral-800">Progress</h1>
        <div className="flex gap-2 sm:max-w-sm" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === period ? 'primary' : 'secondary'}
              onClick={() => setPeriod(p)}
              className="flex-1"
            >
              {p}d
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <Card title="Weight">
            <form onSubmit={saveWeight} className="flex gap-2 mb-4">
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                aria-label={`Weight in ${unit}`}
                placeholder={`Weight (${unit})`}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
              />
              <Button type="submit">Log</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const u = unit === 'kg' ? 'lb' : 'kg';
                  localStorage.setItem('weightUnit', u);
                  setUnit(u);
                }}
              >
                {unit}
              </Button>
            </form>
            {weightChart.length === 0 ? (
              <p className="text-small text-neutral-600">No weigh-ins in this period. Log today&apos;s weight above to start the trend.</p>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-caption text-neutral-600">7-day average</p>
                  <p className="text-display text-neutral-800">{latest.average} {unit}</p>
                  <p className="text-small text-neutral-600">
                    {change === null
                      ? 'Log more weigh-ins to see the change.'
                      : `${change > 0 ? '+' : ''}${change} ${unit} over ${period} days`}
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="date" stroke="#737373" tickFormatter={fmtDay} fontSize={12} minTickGap={24} />
                    <YAxis stroke="#737373" fontSize={12} width={40} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} />
                    <Line dataKey="weight" name="Weigh-in" stroke="#BE185D" strokeWidth={0} dot={{ fill: '#BE185D', fillOpacity: 0.35, r: 3, strokeWidth: 0 }} activeDot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="average" name="7-day average" stroke="#BE185D" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>

          {logged.length === 0 ? (
            <Card title="Calories and macros">
              <p className="text-small text-neutral-600">No food logged in this period. Add something from Today and your days will show up here.</p>
            </Card>
          ) : (
            <>
              <Card title="Calories" subtitle={`${logged.length} of ${days.length} days logged, average ${avgCal} kcal`}>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={calorieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="date" stroke="#737373" tickFormatter={fmtDay} fontSize={12} minTickGap={24} />
                    <YAxis stroke="#737373" fontSize={12} width={40} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} />
                    <Bar dataKey="calories_consumed" fill="#BE185D" fillOpacity={0.5} name="Eaten" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Line type="stepAfter" dataKey="target_calories" stroke="#404040" strokeWidth={2} strokeDasharray="5 5" name="Target" dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Macros by day" subtitle="Target under each heading. Hit = calories within 10%, protein 90%+, carbs and fat at most 110%." noPadding>
                <div className="grid grid-cols-[3.5rem_1fr_1fr_1fr_1fr] gap-x-2 px-4 py-2 text-caption text-neutral-600 border-b border-neutral-200">
                  <span>Day</span>
                  {[['kcal', 'target_calories'], ['Protein', 'target_protein_g'], ['Carbs', 'target_carbs_g'], ['Fat', 'target_fat_g']].map(([label, key]) => (
                    <span key={label} className="text-right">{label}<br />{Math.round(days[0][key])}{key === 'target_calories' ? '' : ' g'}</span>
                  ))}
                </div>
                <ul>
                  {days.map((d) => {
                    if (!(d.calories_consumed > 0)) {
                      return (
                        <li key={d.date} className="grid grid-cols-[3.5rem_1fr] gap-x-2 px-4 py-2 text-small border-b border-neutral-100 last:border-0">
                          <span className="text-neutral-800">{fmtDay(d.date)}</span>
                          <span className="text-neutral-500">Nothing logged</span>
                        </li>
                      );
                    }
                    const cal = Math.abs(d.calories_consumed - d.target_calories) <= d.target_calories * 0.1;
                    return (
                      <li key={d.date} className="grid grid-cols-[3.5rem_1fr_1fr_1fr_1fr] gap-x-2 px-4 py-2 text-small border-b border-neutral-100 last:border-0">
                        <span className="text-neutral-800">{fmtDay(d.date)}</span>
                        <Cell value={d.calories_consumed} ok={cal} />
                        <Cell value={d.protein_g} ok={d.protein_g >= d.target_protein_g * 0.9} />
                        <Cell value={d.carbs_g} ok={d.carbs_g <= d.target_carbs_g * 1.1} />
                        <Cell value={d.fat_g} ok={d.fat_g <= d.target_fat_g * 1.1} />
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Progress;
