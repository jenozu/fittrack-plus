import React, { useState, useEffect } from 'react';
import { recipeAPI } from '../services/api';
import { Button, LoadingSpinner, Input } from '../components/ui';
import RecipeBuilder from '../components/RecipeBuilder';
import RecipeList from '../components/RecipeList';
import RecipeDetail from '../components/RecipeDetail';
import { Plus, Search, ChefHat } from 'lucide-react';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, [searchQuery]);

  const fetchRecipes = async () => {
    try {
      const response = await recipeAPI.getAll(searchQuery);
      setRecipes(response.data);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipeData) => {
    setSubmitting(true);
    setError(null);

    try {
      if (editingRecipe) {
        await recipeAPI.update(editingRecipe.id, recipeData);
        setSuccess('Recipe updated successfully!');
      } else {
        await recipeAPI.create(recipeData);
        setSuccess('Recipe created successfully!');
      }

      setShowBuilder(false);
      setEditingRecipe(null);
      await fetchRecipes();

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      setError(error.response?.data?.detail?.message || 'Failed to save recipe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (recipe) => {
    if (!window.confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      return;
    }

    try {
      await recipeAPI.delete(recipe.id);
      setSuccess('Recipe deleted successfully!');
      await fetchRecipes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      setError('Failed to delete recipe');
    }
  };

  const handleDuplicateRecipe = async (recipe) => {
    try {
      const newName = prompt('Enter a name for the duplicate:', `${recipe.name} (Copy)`);
      if (!newName) return;

      await recipeAPI.duplicate(recipe.id, newName);
      setSuccess('Recipe duplicated successfully!');
      await fetchRecipes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to duplicate recipe:', error);
      setError('Failed to duplicate recipe');
    }
  };

  const handleSelectRecipe = async (recipe) => {
    try {
      const response = await recipeAPI.getById(recipe.id);
      setSelectedRecipe(response.data);
    } catch (error) {
      console.error('Failed to fetch recipe details:', error);
      setError('Failed to load recipe details');
    }
  };

  const handleEditRecipe = async (recipe) => {
    setSelectedRecipe(null);
    
    // Fetch full recipe details for editing
    try {
      const response = await recipeAPI.getById(recipe.id);
      setEditingRecipe(response.data);
      setShowBuilder(true);
    } catch (error) {
      console.error('Failed to fetch recipe for editing:', error);
      setError('Failed to load recipe for editing');
    }
  };

  const handleQuickLog = async (recipe) => {
    try {
      const response = await recipeAPI.getById(recipe.id);
      setSelectedRecipe(response.data);
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      setError('Failed to load recipe');
    }
  };

  const handleLogToDiary = async (logData) => {
    try {
      await recipeAPI.logToDiary(logData);
      setSuccess('Recipe logged to food diary!');
      setSelectedRecipe(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to log recipe:', error);
      setError('Failed to log recipe to diary');
    }
  };

  const handleNewRecipe = () => {
    setEditingRecipe(null);
    setShowBuilder(true);
  };

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingRecipe(null);
    setError(null);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-2">
            <ChefHat className="text-primary-pink" size={32} />
            My Recipes
          </h1>
          <p className="text-neutral-600 mt-1">
            Create custom recipes with automatic nutrition calculation
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleNewRecipe}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Create Recipe
        </Button>
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

      {/* Recipe Builder */}
      {showBuilder && (
        <RecipeBuilder
          onSave={handleSaveRecipe}
          onCancel={handleCancelBuilder}
          initialData={editingRecipe}
          isLoading={submitting}
        />
      )}

      {/* Search */}
      {!showBuilder && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by name..."
              icon={<Search size={18} />}
            />
          </div>
        </div>
      )}

      {/* Recipe List */}
      {!showBuilder && (
        <>
          {recipes.length === 0 && !searchQuery ? (
            <div className="text-center py-12">
              <div className="bg-neutral-50 rounded-lg p-8 max-w-md mx-auto">
                <ChefHat className="mx-auto text-neutral-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  Start Building Your Recipe Collection
                </h3>
                <p className="text-neutral-600 mb-6">
                  Create custom recipes and track nutrition automatically. Perfect for meal prep!
                </p>
                <Button variant="primary" onClick={handleNewRecipe}>
                  <Plus size={18} className="mr-2" />
                  Create Your First Recipe
                </Button>
              </div>
            </div>
          ) : recipes.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                No recipes found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <RecipeList
              recipes={recipes}
              onSelect={handleSelectRecipe}
              onDelete={handleDeleteRecipe}
              onDuplicate={handleDuplicateRecipe}
              onQuickLog={handleQuickLog}
            />
          )}
        </>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={handleEditRecipe}
          onLogToDiary={handleLogToDiary}
        />
      )}
    </div>
  );
};

export default Recipes;

