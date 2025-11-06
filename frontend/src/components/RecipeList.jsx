import React from 'react';
import { Card, Button } from './ui';
import { Clock, Users, Utensils, Trash2, Copy, FileText } from 'lucide-react';

const RecipeList = ({ recipes, onSelect, onDelete, onDuplicate, onQuickLog }) => {
  if (recipes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Utensils className="mx-auto text-neutral-300 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Recipes Yet</h3>
          <p className="text-neutral-600">
            Create your first recipe to get started!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
          <div className="space-y-3">
            {/* Recipe Header */}
            <div>
              <button
                onClick={() => onSelect(recipe)}
                className="text-left w-full group"
              >
                <h3 className="text-lg font-bold text-neutral-800 group-hover:text-primary-blue transition-colors">
                  {recipe.name}
                </h3>
                {recipe.description && (
                  <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
              </button>
            </div>

            {/* Recipe Meta */}
            <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Utensils size={16} />
                <span>{recipe.ingredient_count} ingredients</span>
              </div>
              {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>
                    {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                  </span>
                </div>
              )}
            </div>

            {/* Nutrition */}
            {recipe.calories_per_serving && (
              <div className="bg-gradient-to-r from-primary-blue/10 to-primary-pink/10 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-blue">
                    {Math.round(recipe.calories_per_serving)}
                  </p>
                  <p className="text-xs text-neutral-600">calories per serving</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onQuickLog(recipe)}
                className="text-sm"
              >
                <FileText size={14} className="mr-1" />
                Log
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelect(recipe)}
                className="text-sm"
              >
                View Details
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(recipe)}
                className="text-sm"
              >
                <Copy size={14} className="mr-1" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(recipe)}
                className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RecipeList;

