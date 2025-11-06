import React, { useState } from 'react';
import { Card, Button, Modal, Select } from './ui';
import { Plus, X, ChefHat } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const MealPlanner = ({ mealPlan, recipes, onAddMeal, onRemoveMeal }) => {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState('');

  const weekDates = Array.from({ length: 7 }, (_, i) => 
    addDays(new Date(mealPlan.week_start_date), i)
  );

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  const getMealsForSlot = (date, mealType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mealPlan.planned_meals.filter(
      m => format(new Date(m.meal_date), 'yyyy-MM-dd') === dateStr && m.meal_type === mealType
    );
  };

  const handleAddClick = (date, mealType) => {
    setSelectedSlot({ date: format(date, 'yyyy-MM-dd'), mealType });
    setShowAddMeal(true);
  };

  const handleSaveAddMeal = () => {
    if (!selectedRecipe || !selectedSlot) return;

    const recipeId = parseInt(selectedRecipe);
    onAddMeal({
      meal_date: selectedSlot.date,
      meal_type: selectedSlot.mealType,
      recipe_id: recipeId,
    });

    setShowAddMeal(false);
    setSelectedRecipe('');
    setSelectedSlot(null);
  };

  const getMealTypeIcon = (type) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-neutral-200 bg-neutral-50 p-2 text-left text-sm font-semibold text-neutral-700 w-24">
                  Meal
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={i}
                    className="border border-neutral-200 bg-neutral-50 p-2 text-center text-sm font-semibold text-neutral-700"
                  >
                    <div>{format(date, 'EEE')}</div>
                    <div className="text-xs font-normal text-neutral-600">
                      {format(date, 'MMM d')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mealTypes.map((mealType) => (
                <tr key={mealType}>
                  <td className="border border-neutral-200 bg-neutral-50 p-2 font-medium text-neutral-700 capitalize">
                    <div className="flex items-center gap-2">
                      <span>{getMealTypeIcon(mealType)}</span>
                      <span className="text-sm">{mealType}</span>
                    </div>
                  </td>
                  {weekDates.map((date, i) => {
                    const meals = getMealsForSlot(date, mealType);
                    
                    return (
                      <td
                        key={i}
                        className="border border-neutral-200 p-2 align-top bg-white hover:bg-neutral-50"
                      >
                        <div className="min-h-[80px] space-y-1">
                          {meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="bg-gradient-to-r from-primary-blue/10 to-primary-pink/10 border border-primary-blue/30 rounded p-2 text-xs group relative"
                            >
                              <div className="font-medium text-neutral-800 pr-6">
                                {meal.recipe_name || meal.custom_meal_name}
                              </div>
                              {meal.recipe_calories && (
                                <div className="text-neutral-600">
                                  {Math.round(meal.recipe_calories)} cal
                                </div>
                              )}
                              <button
                                onClick={() => onRemoveMeal(mealPlan.id, meal.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                              >
                                <X size={12} className="text-red-600" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddClick(date, mealType)}
                            className="w-full p-2 border border-dashed border-neutral-300 rounded text-neutral-400 hover:border-primary-blue hover:text-primary-blue hover:bg-blue-50 transition-all text-xs flex items-center justify-center gap-1"
                          >
                            <Plus size={14} />
                            Add
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <Modal
          isOpen={showAddMeal}
          onClose={() => setShowAddMeal(false)}
          title="Add Meal to Plan"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Adding to <strong>{selectedSlot?.mealType}</strong> on{' '}
              <strong>{selectedSlot && format(new Date(selectedSlot.date), 'MMMM d')}</strong>
            </p>

            <Select
              label="Choose Recipe"
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              options={[
                { value: '', label: '-- Select a recipe --' },
                ...recipes.map(r => ({
                  value: r.id.toString(),
                  label: `${r.name} (${Math.round(r.calories_per_serving)} cal)`
                }))
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSaveAddMeal}
                disabled={!selectedRecipe}
                className="flex-1"
              >
                Add to Plan
              </Button>
              <Button variant="secondary" onClick={() => setShowAddMeal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MealPlanner;

