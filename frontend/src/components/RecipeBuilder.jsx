import React, { useState } from 'react';
import { foodAPI, recipeAPI } from '../services/api';
import { Card, Button, Input, LoadingSpinner } from './ui';
import { Plus, X, Search, Save, ChefHat } from 'lucide-react';

const RecipeBuilder = ({ onSave, onCancel, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    servings: initialData?.servings || 1,
    prep_time_minutes: initialData?.prep_time_minutes || '',
    cook_time_minutes: initialData?.cook_time_minutes || '',
    ingredients: initialData?.ingredients || [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await foodAPI.search(searchQuery);
      setSearchResults(response.data.foods || []);
      setShowSearch(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddIngredient = (food) => {
    const ingredient = {
      food_master_id: food.id,
      food_name: food.food_name,
      brand_name: food.brand_name,
      quantity: 1,
      unit: food.serving_unit || 'serving',
      notes: '',
      // Store nutrition for display
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
    };

    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, ingredient],
    });
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUpdateIngredient = (index, field, value) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const calculateTotalNutrition = () => {
    const total = formData.ingredients.reduce(
      (acc, ing) => {
        const multiplier = ing.quantity / 1; // Simplified - assumes quantity matches serving
        return {
          calories: acc.calories + (ing.calories || 0) * multiplier,
          protein_g: acc.protein_g + (ing.protein_g || 0) * multiplier,
          carbs_g: acc.carbs_g + (ing.carbs_g || 0) * multiplier,
          fat_g: acc.fat_g + (ing.fat_g || 0) * multiplier,
        };
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    const servings = formData.servings || 1;
    return {
      total,
      perServing: {
        calories: total.calories / servings,
        protein_g: total.protein_g / servings,
        carbs_g: total.carbs_g / servings,
        fat_g: total.fat_g / servings,
      },
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    // Format ingredients for API (remove display-only fields)
    const ingredientsForAPI = formData.ingredients.map(ing => ({
      food_master_id: ing.food_master_id,
      quantity: parseFloat(ing.quantity),
      unit: ing.unit,
      notes: ing.notes || null,
    }));

    const recipeData = {
      name: formData.name,
      description: formData.description || null,
      servings: parseFloat(formData.servings),
      prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes) : null,
      cook_time_minutes: formData.cook_time_minutes ? parseInt(formData.cook_time_minutes) : null,
      is_public: false,
      ingredients: ingredientsForAPI,
    };

    onSave(recipeData);
  };

  const nutrition = calculateTotalNutrition();

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ChefHat className="text-primary-pink" size={24} />
          <h2 className="text-xl font-bold text-neutral-800">
            {initialData ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Recipe Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Grilled Chicken Salad"
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your recipe..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Servings"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
              required
            />
            <Input
              label="Prep Time (minutes)"
              type="number"
              min="0"
              value={formData.prep_time_minutes}
              onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
            />
            <Input
              label="Cook Time (minutes)"
              type="number"
              min="0"
              value={formData.cook_time_minutes}
              onChange={(e) => setFormData({ ...formData, cook_time_minutes: e.target.value })}
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Ingredients</h3>

          {/* Add Ingredient */}
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Search for food to add..."
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? <LoadingSpinner size="sm" /> : <Search size={18} />}
              </Button>
            </div>

            {/* Search Results */}
            {showSearch && searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-neutral-200 rounded-lg">
                {searchResults.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleAddIngredient(food)}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-neutral-800">{food.food_name}</div>
                    {food.brand_name && (
                      <div className="text-sm text-neutral-600">{food.brand_name}</div>
                    )}
                    <div className="text-xs text-neutral-500 mt-1">
                      {food.calories} cal | {food.protein_g}g protein
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ingredient List */}
          {formData.ingredients.length === 0 ? (
            <p className="text-neutral-500 text-center py-6 bg-neutral-50 rounded-lg">
              No ingredients added yet. Search and add ingredients above.
            </p>
          ) : (
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2">
                      <div className="font-medium text-neutral-800">{ingredient.food_name}</div>
                      {ingredient.brand_name && (
                        <div className="text-xs text-neutral-600">{ingredient.brand_name}</div>
                      )}
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={ingredient.quantity}
                      onChange={(e) => handleUpdateIngredient(index, 'quantity', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      value={ingredient.unit}
                      onChange={(e) => handleUpdateIngredient(index, 'unit', e.target.value)}
                      placeholder="unit"
                      className="text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutrition Summary */}
        {formData.ingredients.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Nutrition Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">Per Serving</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-primary-blue">
                    {Math.round(nutrition.perServing.calories)} cal
                  </p>
                  <p className="text-sm text-neutral-700">
                    P: {nutrition.perServing.protein_g.toFixed(1)}g | 
                    C: {nutrition.perServing.carbs_g.toFixed(1)}g | 
                    F: {nutrition.perServing.fat_g.toFixed(1)}g
                  </p>
                </div>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">Total Recipe</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-neutral-800">
                    {Math.round(nutrition.total.calories)} cal
                  </p>
                  <p className="text-sm text-neutral-700">
                    P: {nutrition.total.protein_g.toFixed(1)}g | 
                    C: {nutrition.total.carbs_g.toFixed(1)}g | 
                    F: {nutrition.total.fat_g.toFixed(1)}g
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || formData.ingredients.length === 0}
            className="flex-1"
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Saving...' : initialData ? 'Update Recipe' : 'Save Recipe'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default RecipeBuilder;

