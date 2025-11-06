import React, { useState, useEffect } from 'react';
import { aiMealAPI } from '../services/api';
import { Button, LoadingSpinner, Modal, Select, Input } from './ui';
import { Camera, Upload, Sparkles, X, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const AIMealScanner = ({ onClose, onFoodsLogged, selectedDate }) => {
  const [step, setStep] = useState('upload'); // 'upload', 'analyzing', 'results', 'confirm'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [mealType, setMealType] = useState('lunch');
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await aiMealAPI.getUsage();
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setAnalyzing(true);
    setError(null);
    setStep('analyzing');

    try {
      const response = await aiMealAPI.analyzeMeal(imageFile);
      setAiResults(response.data);
      
      // Pre-select all foods with database matches
      const preSelected = response.data.foods
        .filter(f => f.database_match)
        .map(f => ({
          food_master_id: f.database_match.food_master_id,
          quantity: f.suggested_quantity,
          unit: f.suggested_unit,
        }));
      
      setSelectedFoods(preSelected);
      setUsage(response.data.usage);
      setStep('results');
    } catch (error) {
      console.error('AI analysis failed:', error);
      const detail = error.response?.data?.detail;
      if (detail?.message) {
        setError(detail.message);
      } else {
        setError('AI analysis failed. Please try again.');
      }
      setStep('upload');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleFood = (food, index) => {
    const foodId = food.database_match?.food_master_id;
    if (!foodId) return;

    const exists = selectedFoods.find(f => f.food_master_id === foodId);
    
    if (exists) {
      setSelectedFoods(selectedFoods.filter(f => f.food_master_id !== foodId));
    } else {
      setSelectedFoods([
        ...selectedFoods,
        {
          food_master_id: foodId,
          quantity: food.suggested_quantity,
          unit: food.suggested_unit,
        }
      ]);
    }
  };

  const handleUpdateQuantity = (foodId, quantity) => {
    setSelectedFoods(selectedFoods.map(f => 
      f.food_master_id === foodId ? { ...f, quantity: parseFloat(quantity) } : f
    ));
  };

  const handleConfirm = async () => {
    if (selectedFoods.length === 0) {
      setError('Please select at least one food item');
      return;
    }

    setLogging(true);
    setError(null);

    try {
      await aiMealAPI.confirmFoods(selectedFoods, mealType, selectedDate);
      onFoodsLogged();
      onClose();
    } catch (error) {
      console.error('Failed to log foods:', error);
      setError('Failed to log foods. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  const isFoodSelected = (food) => {
    return selectedFoods.some(f => f.food_master_id === food.database_match?.food_master_id);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="AI Meal Recognition" maxWidth="4xl">
      <div className="space-y-4">
        {/* Usage Info */}
        {usage && (
          <div className={`p-3 rounded-lg ${
            usage.scans_remaining > 0 
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={usage.scans_remaining > 0 ? 'text-blue-600' : 'text-orange-600'} size={20} />
                <span className="text-sm font-medium">
                  {usage.scans_remaining > 0 
                    ? `${usage.scans_remaining} AI scans remaining this month`
                    : 'No AI scans remaining this month'
                  }
                </span>
              </div>
              <span className="text-xs text-neutral-600">
                Resets: {usage.reset_date && format(new Date(usage.reset_date), 'MMM d')}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Meal preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Choose Different Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Camera className="text-neutral-400" size={64} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-neutral-800 mb-2">
                      Upload a photo of your meal
                    </p>
                    <p className="text-sm text-neutral-600">
                      AI will identify foods and estimate portions
                    </p>
                  </div>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button variant="primary" as="span">
                      <Upload size={18} className="mr-2" />
                      Choose Image
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {imageFile && (
              <Button
                variant="primary"
                onClick={handleAnalyze}
                disabled={usage && usage.scans_remaining === 0}
                className="w-full"
              >
                <Sparkles size={18} className="mr-2" />
                Analyze with AI
              </Button>
            )}
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg font-semibold text-neutral-800">
              Analyzing your meal...
            </p>
            <p className="text-sm text-neutral-600 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && aiResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-800">
                Identified Foods ({aiResults.total_identified})
              </h3>
              <Select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                options={[
                  { value: 'breakfast', label: 'Breakfast' },
                  { value: 'lunch', label: 'Lunch' },
                  { value: 'dinner', label: 'Dinner' },
                  { value: 'snack', label: 'Snack' },
                ]}
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {aiResults.foods.map((food, index) => {
                const isSelected = isFoodSelected(food);
                const hasMatch = food.database_match;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary-blue bg-blue-50'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleFood(food, index)}
                        disabled={!hasMatch}
                        className="mt-1 w-5 h-5 text-primary-blue rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-neutral-800">
                              {food.ai_identification.food_name}
                            </h4>
                            {hasMatch ? (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check size={14} />
                                Matched: {food.database_match.food_name}
                                {food.database_match.brand_name && ` (${food.database_match.brand_name})`}
                              </p>
                            ) : (
                              <p className="text-sm text-orange-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                No database match found
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            food.confidence >= 80 ? 'bg-green-100 text-green-700' :
                            food.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {food.confidence}% confident
                          </span>
                        </div>

                        {hasMatch && isSelected && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={selectedFoods.find(f => f.food_master_id === food.database_match.food_master_id)?.quantity || food.suggested_quantity}
                              onChange={(e) => handleUpdateQuantity(food.database_match.food_master_id, e.target.value)}
                              className="text-sm"
                            />
                            <Input
                              value={food.suggested_unit}
                              disabled
                              className="text-sm bg-neutral-50"
                            />
                          </div>
                        )}

                        {hasMatch && (
                          <div className="text-xs text-neutral-600 mt-2">
                            {Math.round(food.database_match.calories)} cal | 
                            {' '}{food.database_match.protein_g.toFixed(1)}g protein
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setStep('upload')}>
                Try Another Image
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={selectedFoods.length === 0 || logging}
                className="flex-1"
              >
                {logging ? <LoadingSpinner size="sm" /> : `Log ${selectedFoods.length} Food${selectedFoods.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AIMealScanner;

