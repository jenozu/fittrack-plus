import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { Card, LoadingSpinner } from '../components/ui';
import { Flame, TrendingUp, Drumstick, Dumbbell, Award } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [summaryRes, streakRes] = await Promise.all([
        dashboardAPI.getDailySummary(today),
        dashboardAPI.getStreak(),
      ]);
      setSummary(summaryRes.data);
      setStreak(streakRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  const caloriesPercentage = summary ? (summary.total_calories / summary.target_calories) * 100 : 0;
  const caloriesColor = summary?.calories_remaining > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-pink to-primary-blue rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.first_name || 'there'}! 👋
        </h1>
        <p className="mt-2 text-white/90">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Streak Card */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Award className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-800">
                {streak?.current_streak || 0} Day Streak! 🔥
              </h3>
              <p className="text-neutral-600">
                Longest: {streak?.longest_streak || 0} days
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Calories Summary */}
      <Card title="Today's Calorie Summary">
        <div className="space-y-4">
          {/* Calories Remaining - Big Display */}
          <div className="text-center py-6 bg-gradient-to-br from-primary-blue/10 to-primary-pink/10 rounded-lg">
            <p className="text-sm text-neutral-600 mb-2">Calories Remaining</p>
            <h2 className={`text-5xl font-bold ${caloriesColor}`}>
              {summary?.calories_remaining || 0}
            </h2>
            <p className="text-sm text-neutral-600 mt-2">
              Target: {summary?.target_calories || 0} cal
            </p>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <Drumstick className="mx-auto mb-2 text-primary-pink" size={24} />
              <p className="text-2xl font-bold text-neutral-800">{summary?.total_calories || 0}</p>
              <p className="text-xs text-neutral-600">Consumed</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <Dumbbell className="mx-auto mb-2 text-primary-blue" size={24} />
              <p className="text-2xl font-bold text-neutral-800">{summary?.calories_burned || 0}</p>
              <p className="text-xs text-neutral-600">Burned</p>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <Flame className="mx-auto mb-2 text-orange-500" size={24} />
              <p className="text-2xl font-bold text-neutral-800">{summary?.target_calories || 0}</p>
              <p className="text-xs text-neutral-600">Goal</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>Daily Progress</span>
              <span>{Math.round(caloriesPercentage)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-pink to-primary-blue h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(caloriesPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Macros Summary */}
      <Card title="Macronutrients">
        <div className="grid grid-cols-3 gap-4">
          {/* Protein */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700">Protein</span>
              <span className="text-neutral-600">
                {Math.round(summary?.total_protein_g || 0)}g / {Math.round(summary?.target_protein_g || 0)}g
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full"
                style={{ 
                  width: `${Math.min((summary?.total_protein_g / summary?.target_protein_g) * 100 || 0, 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700">Carbs</span>
              <span className="text-neutral-600">
                {Math.round(summary?.total_carbs_g || 0)}g / {Math.round(summary?.target_carbs_g || 0)}g
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full"
                style={{ 
                  width: `${Math.min((summary?.total_carbs_g / summary?.target_carbs_g) * 100 || 0, 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-neutral-700">Fat</span>
              <span className="text-neutral-600">
                {Math.round(summary?.total_fat_g || 0)}g / {Math.round(summary?.target_fat_g || 0)}g
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ 
                  width: `${Math.min((summary?.total_fat_g / summary?.target_fat_g) * 100 || 0, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/food')}
            className="p-4 bg-gradient-to-br from-primary-pink/20 to-primary-pink/10 hover:from-primary-pink/30 hover:to-primary-pink/20 rounded-lg transition-all"
          >
            <Drumstick className="mx-auto mb-2 text-primary-pink" size={32} />
            <p className="text-sm font-medium text-neutral-800">Log Food</p>
          </button>
          <button
            onClick={() => navigate('/exercise')}
            className="p-4 bg-gradient-to-br from-primary-blue/20 to-primary-blue/10 hover:from-primary-blue/30 hover:to-primary-blue/20 rounded-lg transition-all"
          >
            <Dumbbell className="mx-auto mb-2 text-primary-blue" size={32} />
            <p className="text-sm font-medium text-neutral-800">Log Exercise</p>
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="p-4 bg-gradient-to-br from-green-200/50 to-green-100/50 hover:from-green-200/70 hover:to-green-100/70 rounded-lg transition-all"
          >
            <TrendingUp className="mx-auto mb-2 text-green-600" size={32} />
            <p className="text-sm font-medium text-neutral-800">View Progress</p>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-4 bg-gradient-to-br from-purple-200/50 to-purple-100/50 hover:from-purple-200/70 hover:to-purple-100/70 rounded-lg transition-all"
          >
            <Award className="mx-auto mb-2 text-purple-600" size={32} />
            <p className="text-sm font-medium text-neutral-800">Profile</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

