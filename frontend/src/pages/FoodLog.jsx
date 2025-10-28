import React, { useState, useEffect } from 'react';
import { foodAPI, dashboardAPI } from '../services/api';
import { Card, Button, Input, Select, Modal, LoadingSpinner } from '../components/ui';
import { Search, Plus, Edit2, Trash2, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { format } from 'date-fns';

const FoodLog = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    food_name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    quantity: 1,
    unit: 'serving',
    meal_type: 'breakfast',
  });

  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, [selectedDate]);

  const fetchEntries = async () => {
    try {
      const response = await foodAPI.getEntries(selectedDate);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch food entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await dashboardAPI.getDailySummary(selectedDate);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await foodAPI.search(searchQuery);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFromSearch = async (food) => {
    try {
      await foodAPI.createEntry({
        food_name: food.food_name,
        brand_name: food.brand_name,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        quantity: food.serving_qty,
        unit: food.serving_unit,
        meal_type: 'breakfast',
        entry_date: selectedDate,
        food_master_id: food.id,
      });
      fetchEntries();
      fetchSummary();
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add food entry:', error);
    }
  };

  const handleManualAdd = async () => {
    try {
      await foodAPI.createEntry({
        ...manualEntry,
        calories: parseFloat(manualEntry.calories),
        protein_g: parseFloat(manualEntry.protein_g) || 0,
        carbs_g: parseFloat(manualEntry.carbs_g) || 0,
        fat_g: parseFloat(manualEntry.fat_g) || 0,
        quantity: parseFloat(manualEntry.quantity),
        entry_date: selectedDate,
      });
      fetchEntries();
      fetchSummary();
      setShowManualModal(false);
      setManualEntry({
        food_name: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        quantity: 1,
        unit: 'serving',
        meal_type: 'breakfast',
      });
    } catch (error) {
      console.error('Failed to add manual entry:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food entry?')) return;
    
    try {
      await foodAPI.deleteEntry(id);
      fetchEntries();
      fetchSummary();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return <Coffee size={20} className="text-orange-500" />;
      case 'lunch': return <Sun size={20} className="text-yellow-500" />;
      case 'dinner': return <Moon size={20} className="text-blue-500" />;
      case 'snack': return <Cookie size={20} className="text-pink-500" />;
      default: return <Coffee size={20} className="text-neutral-500" />;
    }
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    const meal = entry.meal_type || 'other';
    if (!acc[meal]) acc[meal] = [];
    acc[meal].push(entry);
    return acc;
  }, {});

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-800">Food Log</h1>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary Card */}
      {summary && (
        <Card className="bg-gradient-to-br from-primary-pink/10 to-primary-blue/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-600">Calories</p>
              <p className="text-2xl font-bold text-neutral-800">
                {Math.round(summary.total_calories)}
              </p>
              <p className="text-xs text-neutral-500">of {summary.target_calories}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Protein</p>
              <p className="text-2xl font-bold text-neutral-800">
                {Math.round(summary.total_protein_g)}g
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Carbs</p>
              <p className="text-2xl font-bold text-neutral-800">
                {Math.round(summary.total_carbs_g)}g
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Fat</p>
              <p className="text-2xl font-bold text-neutral-800">
                {Math.round(summary.total_fat_g)}g
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => setShowSearchModal(true)}
        >
          <Search size={18} className="mr-2" />
          Search Food
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowManualModal(true)}
        >
          <Plus size={18} className="mr-2" />
          Add Manually
        </Button>
      </div>

      {/* Food Entries by Meal */}
      {Object.keys(groupedEntries).length === 0 ? (
        <Card>
          <div className="text-center py-12 text-neutral-500">
            <p>No food entries for this day.</p>
            <p className="text-sm mt-2">Start by searching for food or adding manually!</p>
          </div>
        </Card>
      ) : (
        ['breakfast', 'lunch', 'dinner', 'snack', 'other'].map((mealType) => {
          const mealEntries = groupedEntries[mealType];
          if (!mealEntries || mealEntries.length === 0) return null;

          const mealTotal = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);

          return (
            <Card key={mealType} title={
              <div className="flex items-center space-x-2">
                {getMealIcon(mealType)}
                <span className="capitalize">{mealType}</span>
                <span className="text-sm text-neutral-500 ml-2">
                  ({Math.round(mealTotal)} cal)
                </span>
              </div>
            }>
              <div className="space-y-3">
                {mealEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-800">
                        {entry.food_name}
                        {entry.brand_name && (
                          <span className="text-sm text-neutral-500 ml-2">({entry.brand_name})</span>
                        )}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        {entry.quantity} {entry.unit} • {Math.round(entry.calories)} cal • 
                        P: {Math.round(entry.protein_g)}g • C: {Math.round(entry.carbs_g)}g • F: {Math.round(entry.fat_g)}g
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}

      {/* Search Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Search Food"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <LoadingSpinner size="sm" /> : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin">
              {searchResults.map((food, index) => (
                <div
                  key={index}
                  className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary-blue transition-colors cursor-pointer"
                  onClick={() => handleAddFromSearch(food)}
                >
                  <h4 className="font-medium text-neutral-800">
                    {food.food_name}
                    {food.brand_name && (
                      <span className="text-sm text-neutral-500 ml-2">({food.brand_name})</span>
                    )}
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    {food.serving_qty} {food.serving_unit} • {Math.round(food.calories)} cal •
                    P: {Math.round(food.protein_g)}g • C: {Math.round(food.carbs_g)}g • F: {Math.round(food.fat_g)}g
                  </p>
                  <p className="text-xs text-primary-blue mt-1">Click to add</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Add Food Manually"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowManualModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleManualAdd}>
              Add Entry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Food Name"
            value={manualEntry.food_name}
            onChange={(e) => setManualEntry({ ...manualEntry, food_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={manualEntry.quantity}
              onChange={(e) => setManualEntry({ ...manualEntry, quantity: e.target.value })}
            />
            <Input
              label="Unit"
              value={manualEntry.unit}
              onChange={(e) => setManualEntry({ ...manualEntry, unit: e.target.value })}
            />
          </div>

          <Input
            label="Calories"
            type="number"
            value={manualEntry.calories}
            onChange={(e) => setManualEntry({ ...manualEntry, calories: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Protein (g)"
              type="number"
              value={manualEntry.protein_g}
              onChange={(e) => setManualEntry({ ...manualEntry, protein_g: e.target.value })}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={manualEntry.carbs_g}
              onChange={(e) => setManualEntry({ ...manualEntry, carbs_g: e.target.value })}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={manualEntry.fat_g}
              onChange={(e) => setManualEntry({ ...manualEntry, fat_g: e.target.value })}
            />
          </div>

          <Select
            label="Meal Type"
            value={manualEntry.meal_type}
            onChange={(e) => setManualEntry({ ...manualEntry, meal_type: e.target.value })}
            options={[
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
              { value: 'snack', label: 'Snack' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default FoodLog;

