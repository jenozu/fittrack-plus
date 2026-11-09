import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Card, Select, Input, LoadingSpinner } from '../components/ui';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Progress = () => {
  const [calorieData, setCalorieData] = useState([]);
  const [macroData, setMacroData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('7');
  const [weightDays, setWeightDays] = useState(30);
  const [unit, setUnit] = useState(() => localStorage.getItem('weightUnit') || 'kg');
  const [weightInput, setWeightInput] = useState('');
  const LB = 2.20462;
  const toUnit = (kg) => Math.round((unit === 'lb' ? kg * LB : kg) * 10) / 10;

  const loadWeights = async () => {
    const res = await dashboardAPI.getWeightLogs(weightDays);
    setWeightData(res.data);
  };
  useEffect(() => { loadWeights().catch(() => {}); }, [weightDays]);

  const saveWeight = async (e) => {
    e.preventDefault();
    const v = parseFloat(weightInput);
    if (!v) return;
    const today = new Date();
    const log_date = new Date(today - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    try {
      await dashboardAPI.logWeight({ weight_kg: unit === 'lb' ? v / LB : v, log_date });
      setWeightInput('');
      await loadWeights();
    } catch (err) {
      console.error('Failed to log weight:', err);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [timePeriod]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const [caloriesRes, macrosRes] = await Promise.all([
        dashboardAPI.getCalorieProgress(parseInt(timePeriod)),
        dashboardAPI.getMacroProgress(parseInt(timePeriod)),
      ]);

      setCalorieData(caloriesRes.data.data);
      setMacroData(macrosRes.data.data);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Weight chart data with trailing 7-day moving average (by calendar day)
  const weightChartData = weightData.map((log) => {
    const t = new Date(log.log_date).getTime();
    const win = weightData.filter((l) => {
      const d = (t - new Date(l.log_date).getTime()) / 86400000;
      return d >= 0 && d < 7;
    });
    return {
      date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: toUnit(log.weight_kg),
      average: toUnit(win.reduce((a, l) => a + l.weight_kg, 0) / win.length),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-pink to-primary-blue rounded-full flex items-center justify-center">
            <TrendingUp className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800">Progress & Analytics</h1>
        </div>

        <Select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          options={[
            { value: '7', label: 'Last 7 Days' },
            { value: '14', label: 'Last 14 Days' },
            { value: '30', label: 'Last 30 Days' },
            { value: '90', label: 'Last 90 Days' },
          ]}
          className="w-auto"
        />
      </div>

      {/* Weight Progress */}
      <Card title="Weight">
        <form onSubmit={saveWeight} className="flex gap-2 items-end mb-4">
          <Input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder={`Today's weight (${unit})`}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary-pink text-white font-semibold min-h-[44px]">Log</button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border-2 border-primary-blue min-h-[44px]"
            onClick={() => {
              const u = unit === 'kg' ? 'lb' : 'kg';
              localStorage.setItem('weightUnit', u);
              setUnit(u);
            }}
          >
            {unit}
          </button>
          <Select
            value={String(weightDays)}
            onChange={(e) => setWeightDays(parseInt(e.target.value))}
            options={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }]}
            className="w-auto"
          />
        </form>
        {weightChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="date" stroke="#737373" />
              <YAxis stroke="#737373" domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '2px solid #A7D9F0', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="weight" name={`Weight (${unit})`} stroke="#F0A7D9" strokeWidth={0} dot={{ fill: '#F0A7D9', r: 4 }} />
              <Line type="monotone" dataKey="average" name="7-day average" stroke="#D06CA0" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Calorie Trends */}
      <Card title="Calorie Trends">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={calorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="date"
              stroke="#737373"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="#737373" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #A7D9F0',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
            <Legend />
            <Bar dataKey="calories_consumed" fill="#F0A7D9" name="Consumed" radius={[8, 8, 0, 0]} />
            <Bar dataKey="calories_burned" fill="#A7D9F0" name="Burned" radius={[8, 8, 0, 0]} />
            <Line
              type="monotone"
              dataKey="target_calories"
              stroke="#D06CA0"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
              dot={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Macro Distribution */}
      <Card title="Macronutrient Trends">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={macroData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="date"
              stroke="#737373"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="#737373" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #A7D9F0',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="protein_g"
              stroke="#EF4444"
              strokeWidth={2}
              name="Protein (g)"
              dot={{ fill: '#EF4444' }}
            />
            <Line
              type="monotone"
              dataKey="carbs_g"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Carbs (g)"
              dot={{ fill: '#3B82F6' }}
            />
            <Line
              type="monotone"
              dataKey="fat_g"
              stroke="#FACC15"
              strokeWidth={2}
              name="Fat (g)"
              dot={{ fill: '#FACC15' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-pink/10 to-primary-pink/5">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm text-neutral-600">Avg. Daily Calories</p>
            <p className="text-3xl font-bold text-neutral-800">
              {Math.round(
                calorieData.reduce((sum, day) => sum + day.calories_consumed, 0) / calorieData.length || 0
              )}
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-primary-blue/10 to-primary-blue/5">
          <div className="text-center">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-sm text-neutral-600">Total Burned</p>
            <p className="text-3xl font-bold text-neutral-800">
              {Math.round(
                calorieData.reduce((sum, day) => sum + day.calories_burned, 0)
              )}
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-100/50 to-green-50/50">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm text-neutral-600">Tracking Days</p>
            <p className="text-3xl font-bold text-neutral-800">
              {calorieData.filter(day => day.calories_consumed > 0).length}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Progress;

