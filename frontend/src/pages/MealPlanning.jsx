import React, { useState, useEffect } from 'react';
import { mealPlanAPI, recipeAPI } from '../services/api';
import { Button, LoadingSpinner, Input, Card } from '../components/ui';
import MealPlanner from '../components/MealPlanner';
import GroceryList from '../components/GroceryList';
import { Plus, Calendar, ShoppingCart, Trash2 } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

const MealPlanning = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, recipesRes] = await Promise.all([
        mealPlanAPI.getAll(true),
        recipeAPI.getAll(),
      ]);
      
      setMealPlans(plansRes.data);
      setRecipes(recipesRes.data);
      
      // Set current plan to the most recent active plan
      if (plansRes.data.length > 0) {
        setCurrentPlan(plansRes.data[0]);
        await fetchGroceryList(plansRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroceryList = async (planId) => {
    try {
      const response = await mealPlanAPI.getGroceryList(planId);
      setGroceryList(response.data);
    } catch (error) {
      // Grocery list might not exist yet
      setGroceryList(null);
    }
  };

  const handleCreatePlan = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const planName = `Week of ${format(weekStart, 'MMM d')}`;

    try {
      const response = await mealPlanAPI.create({
        name: planName,
        week_start_date: format(weekStart, 'yyyy-MM-dd'),
        planned_meals: []
      });
      
      setCurrentPlan(response.data);
      await fetchData();
      setSuccess('Meal plan created!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to create meal plan:', error);
      setError('Failed to create meal plan');
    }
  };

  const handleAddMeal = async (mealData) => {
    if (!currentPlan) return;

    try {
      await mealPlanAPI.addMeal(currentPlan.id, mealData);
      await fetchData();
      
      // Refresh current plan
      const updatedPlan = await mealPlanAPI.getById(currentPlan.id);
      setCurrentPlan(updatedPlan.data);
      setSuccess('Meal added to plan!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Failed to add meal:', error);
      setError('Failed to add meal');
    }
  };

  const handleRemoveMeal = async (planId, mealId) => {
    try {
      await mealPlanAPI.deleteMeal(planId, mealId);
      
      // Refresh current plan
      const updatedPlan = await mealPlanAPI.getById(planId);
      setCurrentPlan(updatedPlan.data);
      setSuccess('Meal removed!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Failed to remove meal:', error);
      setError('Failed to remove meal');
    }
  };

  const handleGenerateGroceryList = async () => {
    if (!currentPlan) return;

    try {
      const response = await mealPlanAPI.generateGroceryList(currentPlan.id);
      setGroceryList(response.data);
      setSuccess('Grocery list generated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to generate grocery list:', error);
      setError('Failed to generate grocery list');
    }
  };

  const handleToggleItem = async (itemId, isChecked) => {
    try {
      await mealPlanAPI.updateGroceryItem(itemId, { is_checked: isChecked });
      
      // Update local state
      setGroceryList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, is_checked: isChecked } : item
        ),
        checked_items: isChecked ? prev.checked_items + 1 : prev.checked_items - 1
      }));
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleCopyList = () => {
    setSuccess('Grocery list copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleDeletePlan = async () => {
    if (!currentPlan) return;
    
    if (!window.confirm(`Delete meal plan "${currentPlan.name}"?`)) return;

    try {
      await mealPlanAPI.delete(currentPlan.id);
      setCurrentPlan(null);
      setGroceryList(null);
      await fetchData();
      setSuccess('Meal plan deleted!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete plan:', error);
      setError('Failed to delete plan');
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
            <Calendar className="text-primary-blue" size={32} />
            Meal Planning
          </h1>
          <p className="text-neutral-600 mt-1">
            Plan your week and generate grocery lists automatically
          </p>
        </div>

        <div className="flex gap-2">
          {currentPlan && (
            <>
              <Button
                variant="secondary"
                onClick={handleGenerateGroceryList}
                className="flex items-center gap-2"
              >
                <ShoppingCart size={18} />
                Generate Grocery List
              </Button>
              <Button
                variant="danger"
                onClick={handleDeletePlan}
                className="flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Plan
              </Button>
            </>
          )}
          <Button
            variant="primary"
            onClick={handleCreatePlan}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            New Meal Plan
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Current Meal Plan */}
      {currentPlan ? (
        <>
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-blue/10 to-primary-pink/10 p-4 rounded-lg border border-primary-blue/30">
            <div>
              <h2 className="text-lg font-bold text-neutral-800">{currentPlan.name}</h2>
              <p className="text-sm text-neutral-600">
                {format(new Date(currentPlan.week_start_date), 'MMM d')} - 
                {format(new Date(currentPlan.week_end_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-600">
                {currentPlan.total_meals} meals planned
              </p>
              <p className="text-sm text-neutral-600">
                {currentPlan.recipes_used} recipes used
              </p>
            </div>
          </div>

          <MealPlanner
            mealPlan={currentPlan}
            recipes={recipes}
            onAddMeal={handleAddMeal}
            onRemoveMeal={handleRemoveMeal}
          />

          {groceryList && (
            <GroceryList
              groceryList={groceryList}
              onToggleItem={handleToggleItem}
              onCopyList={handleCopyList}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-neutral-50 rounded-lg p-8 max-w-md mx-auto">
            <Calendar className="mx-auto text-neutral-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-neutral-800 mb-2">
              Start Planning Your Meals
            </h3>
            <p className="text-neutral-600 mb-6">
              Create a weekly meal plan, add your recipes, and generate a grocery list automatically!
            </p>
            <Button variant="primary" onClick={handleCreatePlan}>
              <Plus size={18} className="mr-2" />
              Create Your First Meal Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanning;

