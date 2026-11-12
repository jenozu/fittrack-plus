import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { foodAPI, dashboardAPI } from '../services/api';
import { Card, Button, Input, Select, Modal, LoadingSpinner } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';
import FoodSearch from '../components/FoodSearch';
import PortionPicker from '../components/PortionPicker';
import CustomFoodForm from '../components/CustomFoodForm';
import { Search, Plus, Trash2, Coffee, Sun, Moon, Cookie, Camera } from 'lucide-react';
import { format } from 'date-fns';

const FoodLog = () => {
  const [params] = useSearchParams(); // ?date=YYYY-MM-DD&meal=lunch from the Today screen
  const meal = params.get('meal') || undefined;
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [selectedDate, setSelectedDate] = useState(params.get('date') || format(new Date(), 'yyyy-MM-dd'));
  const [showSearchModal, setShowSearchModal] = useState(!!meal);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [missing, setMissing] = useState(null); // barcode with no match
  const [customForm, setCustomForm] = useState(null); // {barcode}
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

  const fetchEntries = useCallback(async () => {
    try {
      const response = await foodAPI.getEntries(selectedDate);
      setEntries(response.data.entries);
    } catch (error) {
      console.error('Failed to fetch food entries:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await dashboardAPI.getDailySummary(selectedDate);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, [fetchEntries, fetchSummary]);

  const handleAdded = () => {
    fetchEntries();
    fetchSummary();
    setPicked(null);
    setShowSearchModal(false);
  };

  const handleBarcodeScan = useCallback(async (barcode) => {
    setShowBarcodeScanner(false);
    try {
      const response = await foodAPI.byBarcode(barcode);
      setPicked(response.data);
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      if (error.response?.status === 404) setMissing(barcode);
      else alert('Barcode lookup failed. Try again.');
    }
  }, []);

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
      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          onClick={() => setShowSearchModal(true)}
        >
          <Search size={18} className="mr-2" />
          Search Food
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowBarcodeScanner(true)}
        >
          <Camera size={18} className="mr-2" />
          Scan Barcode
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
        <FoodSearch
          onSelect={setPicked}
          onCreate={() => { setShowSearchModal(false); setCustomForm({ barcode: '' }); }}
        />
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

      {missing && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">No food found for {missing}.</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMissing(null)}>Dismiss</Button>
              <Button variant="secondary" onClick={() => { setCustomForm({ barcode: missing }); setMissing(null); }}>
                Not found - add it
              </Button>
            </div>
          </div>
        </Card>
      )}

      {customForm && (
        <CustomFoodForm
          barcode={customForm.barcode}
          onClose={() => setCustomForm(null)}
          onCreated={(food) => { setCustomForm(null); setPicked(food); }}
        />
      )}

      {picked && (
        <PortionPicker
          food={picked}
          date={selectedDate}
          meal={meal}
          onAdded={handleAdded}
          onClose={() => setPicked(null)}
        />
      )}

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      <p className="text-xs text-neutral-400 text-center">
        Food data: USDA FoodData Central, Canadian Nutrient File (Health Canada), Open Food Facts (ODbL)
      </p>
    </div>
  );
};

export default FoodLog;

