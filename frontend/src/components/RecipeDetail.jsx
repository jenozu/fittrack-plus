import React, { useState } from 'react';
import { Card, Button, Input, Select, Modal } from './ui';
import { Clock, Users, Utensils, FileText, Edit, X } from 'lucide-react';
import { format } from 'date-fns';

const RecipeDetail = ({ recipe, onClose, onEdit, onLogToDiary }) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logData, setLogData] = useState({
    meal_type: 'lunch',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    servings_consumed: 1,
  });

  if (!recipe) return null;

  const nutrition = recipe.nutrition_per_serving;

  const handleLog = () => {
    onLogToDiary({
      recipe_id: recipe.id,
      ...logData,
      servings_consumed: parseFloat(logData.servings_consumed),
    });
    setShowLogModal(false);
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={recipe.name}
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit(recipe)}>
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowLogModal(true)}>
              <FileText size={16} className="mr-1" />
              Log to Diary
            </Button>
          </div>

          {/* Description */}
          {recipe.description && (
            <div>
              <p className="text-neutral-700">{recipe.description}</p>
            </div>
          )}

          {/* Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-50 p-4 rounded-lg text-center">
              <Users className="mx-auto mb-2 text-primary-blue" size={24} />
              <p className="text-2xl font-bold text-neutral-800">{recipe.servings}</p>
              <p className="text-xs text-neutral-600">Servings</p>
            </div>
            {recipe.prep_time_minutes && (
              <div className="bg-neutral-50 p-4 rounded-lg text-center">
                <Clock className="mx-auto mb-2 text-green-600" size={24} />
                <p className="text-2xl font-bold text-neutral-800">{recipe.prep_time_minutes}</p>
                <p className="text-xs text-neutral-600">Prep (min)</p>
              </div>
            )}
            {recipe.cook_time_minutes && (
              <div className="bg-neutral-50 p-4 rounded-lg text-center">
                <Clock className="mx-auto mb-2 text-orange-600" size={24} />
                <p className="text-2xl font-bold text-neutral-800">{recipe.cook_time_minutes}</p>
                <p className="text-xs text-neutral-600">Cook (min)</p>
              </div>
            )}
            <div className="bg-neutral-50 p-4 rounded-lg text-center">
              <Utensils className="mx-auto mb-2 text-primary-pink" size={24} />
              <p className="text-2xl font-bold text-neutral-800">{recipe.ingredients.length}</p>
              <p className="text-xs text-neutral-600">Ingredients</p>
            </div>
          </div>

          {/* Nutrition Information */}
          {nutrition && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Nutrition Per Serving
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-blue">
                    {Math.round(nutrition.calories)}
                  </p>
                  <p className="text-sm text-neutral-600">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">
                    {nutrition.protein_g.toFixed(1)}g
                  </p>
                  <p className="text-sm text-neutral-600">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">
                    {nutrition.carbs_g.toFixed(1)}g
                  </p>
                  <p className="text-sm text-neutral-600">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">
                    {nutrition.fat_g.toFixed(1)}g
                  </p>
                  <p className="text-sm text-neutral-600">Fat</p>
                </div>
              </div>
            </Card>
          )}

          {/* Ingredients List */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Ingredients</h3>
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <div
                  key={ingredient.id || index}
                  className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-neutral-800">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                      <span className="text-neutral-700">{ingredient.food_name}</span>
                      {ingredient.brand_name && (
                        <span className="text-sm text-neutral-500">({ingredient.brand_name})</span>
                      )}
                    </div>
                    {ingredient.notes && (
                      <p className="text-sm text-neutral-600 mt-1">{ingredient.notes}</p>
                    )}
                    {ingredient.calories && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {Math.round(ingredient.calories * ingredient.quantity)} cal | 
                        {' '}{(ingredient.protein_g * ingredient.quantity).toFixed(1)}g protein
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Log to Diary Modal */}
      {showLogModal && (
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title="Log Recipe to Food Diary"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-neutral-600">
              Log <strong>{recipe.name}</strong> to your food diary
            </p>

            <Input
              label="Date"
              type="date"
              value={logData.entry_date}
              onChange={(e) => setLogData({ ...logData, entry_date: e.target.value })}
              max={format(new Date(), 'yyyy-MM-dd')}
            />

            <Select
              label="Meal Type"
              value={logData.meal_type}
              onChange={(e) => setLogData({ ...logData, meal_type: e.target.value })}
              options={[
                { value: 'breakfast', label: 'Breakfast' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'dinner', label: 'Dinner' },
                { value: 'snack', label: 'Snack' },
              ]}
            />

            <Input
              label="Servings Consumed"
              type="number"
              step="0.5"
              min="0.5"
              value={logData.servings_consumed}
              onChange={(e) => setLogData({ ...logData, servings_consumed: e.target.value })}
            />

            {/* Nutrition Preview */}
            {nutrition && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 mb-2">
                  You'll be logging:
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary-blue">
                      {Math.round(nutrition.calories * logData.servings_consumed)}
                    </p>
                    <p className="text-xs text-neutral-600">cal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-500">
                      {(nutrition.protein_g * logData.servings_consumed).toFixed(1)}g
                    </p>
                    <p className="text-xs text-neutral-600">protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-500">
                      {(nutrition.carbs_g * logData.servings_consumed).toFixed(1)}g
                    </p>
                    <p className="text-xs text-neutral-600">carbs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-500">
                      {(nutrition.fat_g * logData.servings_consumed).toFixed(1)}g
                    </p>
                    <p className="text-xs text-neutral-600">fat</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="primary" onClick={handleLog} className="flex-1">
                <FileText size={18} className="mr-2" />
                Log to Diary
              </Button>
              <Button variant="secondary" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default RecipeDetail;

