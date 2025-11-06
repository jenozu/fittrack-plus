import React, { useState, useEffect } from 'react';
import { gamificationAPI } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import LevelProgress from '../components/LevelProgress';
import BadgeDisplay from '../components/BadgeDisplay';
import { Award, RefreshCw } from 'lucide-react';

const Achievements = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await gamificationAPI.getProgress();
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBadges = async () => {
    setChecking(true);
    try {
      const response = await gamificationAPI.checkBadges();
      
      if (response.data.newly_earned_badges.length > 0) {
        setNewBadges(response.data.newly_earned_badges);
        
        // Show celebration
        setTimeout(() => {
          setNewBadges([]);
        }, 5000);
      }
      
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Failed to check badges:', error);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-2">
            <Award className="text-yellow-500" size={32} />
            Achievements & Badges
          </h1>
          <p className="text-neutral-600 mt-1">
            Track your progress and unlock rewards
          </p>
        </div>
        
        <button
          onClick={handleCheckBadges}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
        >
          <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking...' : 'Check for New Badges'}
        </button>
      </div>

      {/* New Badges Celebration */}
      {newBadges.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 p-6 rounded-xl shadow-2xl animate-pulse">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-2">🎉 New Badge{newBadges.length > 1 ? 's' : ''} Earned! 🎉</h2>
            <div className="flex justify-center gap-4 mt-4">
              {newBadges.map(badge => (
                <div key={badge.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-5xl mb-2">{badge.icon}</div>
                  <p className="font-bold">{badge.name}</p>
                  <p className="text-sm opacity-90">+{badge.xp_reward} XP</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Level Progress */}
      <LevelProgress progress={progress} />

      {/* Badges */}
      <BadgeDisplay
        earnedBadges={progress?.earned_badges || []}
        availableBadges={progress?.available_badges || []}
      />

      {/* XP Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-800">
            How to Earn XP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <span className="text-neutral-700"><strong>+10 XP</strong> - Log a food entry</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💪</span>
              <span className="text-neutral-700"><strong>+15 XP</strong> - Log exercise</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💧</span>
              <span className="text-neutral-700"><strong>+20 XP</strong> - Meet water goal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥩</span>
              <span className="text-neutral-700"><strong>+25 XP</strong> - Hit protein goal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="text-neutral-700"><strong>+50 XP</strong> - Hit all macros</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-neutral-700"><strong>+30 XP</strong> - Maintain streak</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍🍳</span>
              <span className="text-neutral-700"><strong>+40 XP</strong> - Create a recipe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏅</span>
              <span className="text-neutral-700"><strong>+100 XP</strong> - Earn a badge</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Achievements;

