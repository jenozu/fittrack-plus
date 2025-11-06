import React, { useState, useEffect } from 'react';
import { measurementsAPI } from '../services/api';
import { Card, LoadingSpinner } from './ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const MeasurementCharts = ({ days = 90 }) => {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurements, setSelectedMeasurements] = useState({
    waist_cm: true,
    hips_cm: false,
    chest_cm: false,
    arms_cm: false,
    thighs_cm: false,
  });
  const [unit, setUnit] = useState('cm');
  const [timeRange, setTimeRange] = useState(90);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartRes, summaryRes] = await Promise.all([
        measurementsAPI.getChartData(timeRange),
        measurementsAPI.getSummary(),
      ]);
      setChartData(chartRes.data.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch measurement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cmToInches = (cm) => (cm / 2.54);

  const processedData = chartData.map(point => {
    const processed = {
      date: format(new Date(point.date), 'MMM d'),
      fullDate: point.date,
    };

    Object.keys(selectedMeasurements).forEach(key => {
      if (point[key] != null) {
        processed[key] = unit === 'inches' ? cmToInches(point[key]) : point[key];
      }
    });

    return processed;
  });

  const measurementOptions = [
    { key: 'waist_cm', label: 'Waist', color: '#EC4899' },
    { key: 'hips_cm', label: 'Hips', color: '#8B5CF6' },
    { key: 'chest_cm', label: 'Chest', color: '#3B82F6' },
    { key: 'arms_cm', label: 'Arms', color: '#10B981' },
    { key: 'thighs_cm', label: 'Thighs', color: '#F59E0B' },
  ];

  const toggleMeasurement = (key) => {
    setSelectedMeasurements(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
        <p className="font-semibold text-neutral-800 mb-2">
          {payload[0]?.payload?.fullDate && format(new Date(payload[0].payload.fullDate), 'MMM d, yyyy')}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-neutral-700">{entry.name}:</span>
            <span className="font-semibold text-neutral-800">
              {entry.value?.toFixed(1)} {unit === 'inches' ? '"' : 'cm'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card title="📊 Measurement Progress">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && summary.total_measurements > 0 && (
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <TrendingDown className="text-green-600" />
              Progress Summary
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Total Lost</p>
                <p className="text-2xl font-bold text-green-700">
                  {summary.total_cm_lost ? `${summary.total_cm_lost.toFixed(1)} cm` : '-'}
                </p>
                {summary.total_inches_lost && (
                  <p className="text-xs text-green-600 mt-1">
                    {summary.total_inches_lost.toFixed(1)} inches
                  </p>
                )}
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-600 font-medium">Measurements</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {summary.total_measurements}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {summary.first_date && format(new Date(summary.first_date), 'MMM d')} - {summary.latest_date && format(new Date(summary.latest_date), 'MMM d')}
                </p>
              </div>

              {summary.waist_change_cm && (
                <div className={`p-4 rounded-lg border ${
                  summary.waist_change_cm < 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    summary.waist_change_cm < 0 ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    Waist Change
                  </p>
                  <p className={`text-2xl font-bold ${
                    summary.waist_change_cm < 0 ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {summary.waist_change_cm > 0 ? '+' : ''}{summary.waist_change_cm.toFixed(1)} cm
                  </p>
                  <p className={`text-xs mt-1 ${
                    summary.waist_change_cm < 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {(summary.waist_change_cm / 2.54).toFixed(1)} inches
                  </p>
                </div>
              )}

              {summary.hips_change_cm && (
                <div className={`p-4 rounded-lg border ${
                  summary.hips_change_cm < 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    summary.hips_change_cm < 0 ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    Hips Change
                  </p>
                  <p className={`text-2xl font-bold ${
                    summary.hips_change_cm < 0 ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {summary.hips_change_cm > 0 ? '+' : ''}{summary.hips_change_cm.toFixed(1)} cm
                  </p>
                  <p className={`text-xs mt-1 ${
                    summary.hips_change_cm < 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {(summary.hips_change_cm / 2.54).toFixed(1)} inches
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-neutral-800">
              📈 Measurement Trends
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Unit Toggle */}
              <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setUnit('cm')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    unit === 'cm'
                      ? 'bg-white text-primary-blue shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-800'
                  }`}
                >
                  cm
                </button>
                <button
                  onClick={() => setUnit('inches')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    unit === 'inches'
                      ? 'bg-white text-primary-blue shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-800'
                  }`}
                >
                  inches
                </button>
              </div>

              {/* Time Range */}
              <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                {[30, 90, 180, 365].map(d => (
                  <button
                    key={d}
                    onClick={() => setTimeRange(d)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      timeRange === d
                        ? 'bg-white text-primary-blue shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Measurement Toggles */}
          <div className="flex flex-wrap gap-2">
            {measurementOptions.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => toggleMeasurement(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedMeasurements[key]
                    ? 'shadow-sm border-2'
                    : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
                }`}
                style={
                  selectedMeasurements[key]
                    ? { backgroundColor: `${color}15`, borderColor: color, color: color }
                    : {}
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Chart */}
          {hasData ? (
            <div className="mt-4" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: unit === 'inches' ? 'Inches' : 'Centimeters',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: '12px', fill: '#6b7280' }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {measurementOptions.map(({ key, label, color }) => (
                    selectedMeasurements[key] && (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={label}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="mx-auto text-neutral-300 mb-3" size={48} />
              <p className="text-neutral-500">
                No measurement data for the selected time range
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Start logging measurements to see your progress!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MeasurementCharts;

