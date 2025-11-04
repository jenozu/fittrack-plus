import React, { useState, useEffect } from 'react';
import { waterAPI } from '../services/api';
import { Card, Button, LoadingSpinner } from './ui';
import { Droplet, Plus, Undo, Settings } from 'lucide-react';
import { format } from 'date-fns';

const WaterWidget = ({ selectedDate = format(new Date(), 'yyyy-MM-dd') }) => {
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    fetchWaterData();
  }, [selectedDate]);

  const fetchWaterData = async () => {
    try {
      const response = await waterAPI.getSummary(selectedDate);
      setWaterData(response.data);
      setGoalInput(response.data.goal_cups);
    } catch (error) {
      console.error('Failed to fetch water data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (cups) => {
    if (adding) return;
    
    setAdding(true);
    try {
      await waterAPI.logWater({
        cups: cups,
        log_date: selectedDate,
      });
      await fetchWaterData();
    } catch (error) {
      console.error('Failed to log water:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateGoal = async () => {
    try {
      await waterAPI.updateGoal(parseFloat(goalInput));
      await fetchWaterData();
      setShowGoalEdit(false);
    } catch (error) {
      console.error('Failed to update water goal:', error);
    }
  };

  if (loading) {
    return (
      <Card title="💧 Water Intake">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const percentageComplete = waterData?.percentage_complete || 0;
  const totalCups = waterData?.total_cups || 0;
  const goalCups = waterData?.goal_cups || 8;
  const isGoalAchieved = waterData?.goal_achieved || false;

  // Calculate how many glasses to show as filled
  const glassesToShow = 8;
  const cupsPerGlass = goalCups / glassesToShow;
  const filledGlasses = Math.min(Math.floor(totalCups / cupsPerGlass), glassesToShow);

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className={`${isGoalAchieved ? 'text-blue-500' : 'text-neutral-400'}`} size={24} />
            <h3 className="text-lg font-semibold text-neutral-800">Water Intake</h3>
          </div>
          <button
            onClick={() => setShowGoalEdit(!showGoalEdit)}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Goal Edit Section */}
        {showGoalEdit && (
          <div className="bg-neutral-50 p-4 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Daily Goal (cups)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                step="0.5"
                min="1"
                max="20"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
              <Button onClick={handleUpdateGoal} size="sm">
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Progress Display */}
        <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
          <p className="text-sm text-neutral-600 mb-1">Today's Progress</p>
          <h2 className={`text-4xl font-bold ${isGoalAchieved ? 'text-blue-600' : 'text-neutral-700'}`}>
            {totalCups.toFixed(1)} / {goalCups}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            cups ({(totalCups * 236.588).toFixed(0)} ml)
          </p>
          {isGoalAchieved && (
            <p className="text-sm font-medium text-blue-600 mt-2">🎉 Goal Achieved!</p>
          )}
        </div>

        {/* Glass Visualization */}
        <div className="flex justify-center items-end gap-2">
          {Array.from({ length: glassesToShow }).map((_, index) => (
            <div
              key={index}
              className="relative"
              title={`Glass ${index + 1}`}
            >
              {/* Glass container */}
              <div className="w-8 h-12 border-2 border-blue-300 rounded-b-lg relative overflow-hidden">
                {/* Water fill */}
                {index < filledGlasses && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-300 animate-pulse"
                       style={{ height: '100%' }}>
                  </div>
                )}
                {/* Partial fill for last glass */}
                {index === filledGlasses && totalCups % cupsPerGlass > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-300"
                       style={{ height: `${((totalCups % cupsPerGlass) / cupsPerGlass) * 100}%` }}>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(percentageComplete)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentageComplete, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => handleAddWater(1)}
            disabled={adding}
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1"
          >
            <Plus size={16} />
            1 cup
          </Button>
          <Button
            onClick={() => handleAddWater(2)}
            disabled={adding}
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1"
          >
            <Plus size={16} />
            2 cups
          </Button>
          <Button
            onClick={() => handleAddWater(0.5)}
            disabled={adding}
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1"
          >
            <Plus size={16} />
            ½ cup
          </Button>
        </div>

        {/* Custom Amount */}
        <div className="flex gap-2">
          <input
            type="number"
            id="custom-cups"
            step="0.25"
            min="0"
            placeholder="Custom amount"
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                handleAddWater(parseFloat(e.target.value));
                e.target.value = '';
              }
            }}
          />
          <Button
            onClick={() => {
              const input = document.getElementById('custom-cups');
              if (input.value) {
                handleAddWater(parseFloat(input.value));
                input.value = '';
              }
            }}
            disabled={adding}
            size="sm"
          >
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default WaterWidget;

