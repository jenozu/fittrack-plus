import React, { useState } from 'react';
import { Card, Button } from './ui';
import { Award, Lock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const BadgeDisplay = ({ earnedBadges = [], availableBadges = [] }) => {
  const [showAvailable, setShowAvailable] = useState(false);

  const categoryColors = {
    streak: 'from-red-500 to-orange-500',
    consistency: 'from-blue-500 to-indigo-500',
    milestone: 'from-purple-500 to-pink-500',
    recipes: 'from-green-500 to-emerald-500',
    measurements: 'from-yellow-500 to-orange-500',
    level: 'from-cyan-500 to-blue-500',
  };

  const getBadgeGradient = (category) => {
    return categoryColors[category] || 'from-neutral-400 to-neutral-500';
  };

  const groupBadgesByCategory = (badges) => {
    const grouped = {};
    badges.forEach(badge => {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    });
    return grouped;
  };

  const earnedByCategory = groupBadgesByCategory(earnedBadges);
  const availableByCategory = groupBadgesByCategory(availableBadges);

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Award className="text-yellow-500" size={24} />
              Your Badges ({earnedBadges.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAvailable(!showAvailable)}
            >
              {showAvailable ? 'Hide' : 'Show'} Available Badges
            </Button>
          </div>

          {earnedBadges.length === 0 ? (
            <div className="text-center py-8">
              <Lock className="mx-auto text-neutral-300 mb-3" size={48} />
              <p className="text-neutral-600">
                No badges earned yet. Keep logging to unlock achievements!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(earnedByCategory).map(category => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3 uppercase">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {earnedByCategory[category].map(badge => (
                      <div
                        key={badge.id}
                        className="group relative"
                      >
                        <div className={`aspect-square bg-gradient-to-br ${getBadgeGradient(badge.category)} rounded-xl p-4 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <div className="text-white text-center">
                            <p className="text-xs font-bold">{badge.name}</p>
                          </div>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <p className="font-semibold">{badge.name}</p>
                          <p className="text-neutral-300">{badge.description}</p>
                          {badge.earned_at && (
                            <p className="text-neutral-400 mt-1">
                              Earned: {format(new Date(badge.earned_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Available Badges */}
      {showAvailable && availableBadges.length > 0 && (
        <Card className="border-2 border-dashed border-neutral-300">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Lock className="text-neutral-400" size={24} />
              Available Badges ({availableBadges.length})
            </h2>

            <div className="space-y-6">
              {Object.keys(availableByCategory).map(category => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3 uppercase">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableByCategory[category].map(badge => (
                      <div
                        key={badge.id}
                        className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                      >
                        <div className="flex-shrink-0 w-16 h-16 bg-neutral-200 rounded-xl flex items-center justify-center text-3xl opacity-50">
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-neutral-800 mb-1">{badge.name}</h4>
                          <p className="text-sm text-neutral-600 mb-2">{badge.description}</p>
                          
                          {/* Progress */}
                          {badge.progress && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                                <span>
                                  {badge.progress.current} / {badge.progress.required}
                                </span>
                                <span>{Math.round(badge.progress.percentage)}%</span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                  className={`bg-gradient-to-r ${getBadgeGradient(badge.category)} h-2 rounded-full transition-all`}
                                  style={{ width: `${badge.progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Zap size={12} className="text-yellow-600" />
                            <span className="text-xs text-yellow-700 font-medium">
                              +{badge.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const Zap = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default BadgeDisplay;

