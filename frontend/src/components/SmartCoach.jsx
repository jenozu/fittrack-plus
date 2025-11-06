import React, { useState, useEffect } from 'react';
import { coachingAPI, foodAPI } from '../services/api';
import { Card, Button, LoadingSpinner } from './ui';
import { Brain, TrendingUp, Lightbulb, Sparkles, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const SmartCoach = ({ selectedDate, onFoodAdded }) => {
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchCoachingData();
  }, [selectedDate]);

  const fetchCoachingData = async () => {
    try {
      const response = await coachingAPI.getDashboardSummary();
      setCoaching(response.data);
    } catch (error) {
      console.error('Failed to fetch coaching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogSuggestion = async (food) => {
    try {
      await foodAPI.createEntry({
        food_name: food.name,
        brand_name: food.brand,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        quantity: food.serving_qty,
        unit: food.serving_unit,
        meal_type: 'snack',
        entry_date: selectedDate,
        food_master_id: food.id,
      });
      
      if (onFoodAdded) {
        onFoodAdded();
      }
      
      // Refresh coaching after adding food
      await fetchCoachingData();
    } catch (error) {
      console.error('Failed to log suggested food:', error);
    }
  };

  if (loading) {
    return (
      <Card title="🧠 Your Smart Coach">
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (!coaching) {
    return null;
  }

  const { analysis, top_suggestions, encouragement } = coaching;
  const hasLowProtein = analysis.percentages.protein < 70;
  const hasHighCalories = analysis.percentages.calories > 100;

  return (
    <Card className="border-l-4 border-purple-500">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-neutral-800">Your Smart Coach</h2>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            {expanded ? 'Show Less' : 'Show More'}
            <ChevronRight size={16} className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Encouragement Messages */}
        {encouragement.messages.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="space-y-2">
              {encouragement.messages.map((message, index) => (
                <p key={index} className="text-purple-900 font-medium">
                  {message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Daily Progress Overview */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              analysis.percentages.calories >= 90 && analysis.percentages.calories <= 110
                ? 'text-green-600'
                : analysis.percentages.calories > 110
                ? 'text-orange-600'
                : 'text-blue-600'
            }`}>
              {Math.round(analysis.percentages.calories)}%
            </p>
            <p className="text-xs text-neutral-600">Calories</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              analysis.percentages.protein >= 80 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {Math.round(analysis.percentages.protein)}%
            </p>
            <p className="text-xs text-neutral-600">Protein</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              analysis.percentages.carbs >= 80 ? 'text-green-600' : 'text-blue-600'
            }`}>
              {Math.round(analysis.percentages.carbs)}%
            </p>
            <p className="text-xs text-neutral-600">Carbs</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              analysis.percentages.fat >= 80 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {Math.round(analysis.percentages.fat)}%
            </p>
            <p className="text-xs text-neutral-600">Fat</p>
          </div>
        </div>

        {/* Remaining Macros */}
        {(hasLowProtein || hasHighCalories) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              What You Need Today
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {analysis.remaining.calories > 0 && (
                <div>
                  <p className="font-semibold text-blue-700">
                    {Math.round(analysis.remaining.calories)} cal
                  </p>
                  <p className="text-xs text-neutral-600">remaining</p>
                </div>
              )}
              {analysis.remaining.protein_g > 0 && (
                <div>
                  <p className="font-semibold text-red-600">
                    {Math.round(analysis.remaining.protein_g)}g
                  </p>
                  <p className="text-xs text-neutral-600">protein left</p>
                </div>
              )}
              {analysis.remaining.carbs_g > 0 && (
                <div>
                  <p className="font-semibold text-blue-600">
                    {Math.round(analysis.remaining.carbs_g)}g
                  </p>
                  <p className="text-xs text-neutral-600">carbs left</p>
                </div>
              )}
              {analysis.remaining.fat_g > 0 && (
                <div>
                  <p className="font-semibold text-yellow-600">
                    {Math.round(analysis.remaining.fat_g)}g
                  </p>
                  <p className="text-xs text-neutral-600">fat left</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Food Suggestions */}
        {expanded && top_suggestions && top_suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-yellow-600" />
              Smart Suggestions
            </h3>
            <div className="space-y-2">
              {top_suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-600" />
                      <p className="font-medium text-neutral-800">{suggestion.food.name}</p>
                    </div>
                    {suggestion.food.brand && (
                      <p className="text-xs text-neutral-600 ml-5">{suggestion.food.brand}</p>
                    )}
                    <p className="text-xs text-purple-600 ml-5 mt-1">{suggestion.reason}</p>
                    <p className="text-xs text-neutral-500 ml-5">
                      {Math.round(suggestion.food.calories)} cal | {suggestion.food.protein_g}g protein
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickLogSuggestion(suggestion.food)}
                    className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    Quick Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {encouragement.tips.length > 0 && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              {encouragement.tips.map((tip, index) => (
                <p key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                  <span className="text-purple-600 font-bold">💡</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SmartCoach;

