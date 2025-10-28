import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Card, Select, LoadingSpinner } from '../components/ui';
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

  useEffect(() => {
    fetchProgressData();
  }, [timePeriod]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const [caloriesRes, macrosRes, weightsRes] = await Promise.all([
        dashboardAPI.getCalorieProgress(parseInt(timePeriod)),
        dashboardAPI.getMacroProgress(parseInt(timePeriod)),
        dashboardAPI.getWeightLogs(parseInt(timePeriod)),
      ]);

      setCalorieData(caloriesRes.data.data);
      setMacroData(macrosRes.data.data);
      setWeightData(weightsRes.data);
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

  // Prepare weight chart data
  const weightChartData = weightData.map((log) => ({
    date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight_kg,
  }));

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
      {weightChartData.length > 0 && (
        <Card title="Weight Progress">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="date" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #A7D9F0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#F0A7D9"
                strokeWidth={3}
                dot={{ fill: '#F0A7D9', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

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

