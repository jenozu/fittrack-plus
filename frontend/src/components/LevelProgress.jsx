import React from 'react';
import { Card } from './ui';
import { TrendingUp, Award, Zap } from 'lucide-react';

const LevelProgress = ({ progress }) => {
  if (!progress) return null;

  const { level, xp, xp_to_next_level, xp_progress_percentage } = progress;

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Award className="text-white" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-800">
                Level {level}
              </h3>
              <p className="text-sm text-neutral-600 flex items-center gap-1">
                <Zap size={14} className="text-yellow-600" />
                {xp.toLocaleString()} XP
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Next Level</p>
            <p className="text-lg font-bold text-orange-600">
              {xp_to_next_level.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>Progress to Level {level + 1}</span>
            <span>{Math.round(xp_progress_percentage)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 h-4 rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${Math.min(xp_progress_percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Badge Count */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-4xl">{progress.earned_badges?.length || 0}</span>
          <span className="text-sm text-neutral-600">
            Badge{progress.earned_badges?.length !== 1 ? 's' : ''} Earned
          </span>
        </div>
      </div>
    </Card>
  );
};

export default LevelProgress;

