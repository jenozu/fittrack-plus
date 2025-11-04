import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Button, Input, Select, LoadingSpinner } from '../components/ui';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { calculateNutritionTargets, getGoalTypeOptions } from '../utils/nutritionCalculator';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMetric, setUseMetric] = useState(false); // Default to imperial
  
  // Local state for imperial inputs to avoid conversion conflicts during typing
  const [imperialInputs, setImperialInputs] = useState({
    heightFeet: '',
    heightInches: '',
    currentWeightLbs: '',
    goalWeightLbs: '',
  });
  
  const [formData, setFormData] = useState({
    gender: '',
    date_of_birth: '',
    height_cm: '',
    current_weight_kg: '',
    goal_weight_kg: '',
    activity_level: '',
    goal_type: '',
  });
  
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const totalSteps = 3;

  // Conversion functions
  const cmToFeetInches = (cm) => {
    if (!cm || cm === '') return { feet: '', inches: '' };
    const numCm = parseFloat(cm);
    if (isNaN(numCm)) return { feet: '', inches: '' };
    const totalInches = numCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet: feet.toString(), inches: inches.toString() };
  };

  const feetInchesToCm = (feet, inches) => {
    const feetNum = parseFloat(feet) || 0;
    const inchesNum = parseFloat(inches) || 0;
    if (feetNum === 0 && inchesNum === 0) return '';
    const totalInches = feetNum * 12 + inchesNum;
    return Math.round(totalInches * 2.54).toString();
  };

  const kgToLbs = (kg) => {
    if (!kg || kg === '') return '';
    const numKg = parseFloat(kg);
    if (isNaN(numKg)) return '';
    return (numKg * 2.20462).toFixed(1);
  };

  const lbsToKg = (lbs) => {
    if (!lbs || lbs === '') return '';
    const numLbs = parseFloat(lbs);
    if (isNaN(numLbs)) return '';
    return (numLbs / 2.20462).toFixed(1);
  };
  
  // Sync imperial inputs when formData changes (e.g., when switching units)
  useEffect(() => {
    if (!useMetric && formData.height_cm) {
      const height = cmToFeetInches(formData.height_cm);
      setImperialInputs(prev => ({
        ...prev,
        heightFeet: height.feet,
        heightInches: height.inches,
      }));
    }
    if (!useMetric && formData.current_weight_kg) {
      setImperialInputs(prev => ({
        ...prev,
        currentWeightLbs: kgToLbs(formData.current_weight_kg),
      }));
    }
    if (!useMetric && formData.goal_weight_kg) {
      setImperialInputs(prev => ({
        ...prev,
        goalWeightLbs: kgToLbs(formData.goal_weight_kg),
      }));
    }
  }, [useMetric]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await usersAPI.completeOnboarding(formData);
      updateUser(response.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate nutrition targets when relevant fields change
  useEffect(() => {
    const {
      gender,
      date_of_birth,
      height_cm,
      current_weight_kg,
      activity_level,
      goal_type,
    } = formData;

    // Only calculate if all required fields are filled
    if (gender && date_of_birth && height_cm && current_weight_kg && activity_level && goal_type) {
      const nutritionTargets = calculateNutritionTargets(formData);
      
      if (nutritionTargets) {
        setFormData(prev => ({
          ...prev,
          target_calories: nutritionTargets.target_calories,
          target_protein_g: nutritionTargets.target_protein_g,
          target_carbs_g: nutritionTargets.target_carbs_g,
          target_fat_g: nutritionTargets.target_fat_g,
        }));
      }
    }
  }, [
    formData.gender,
    formData.date_of_birth,
    formData.height_cm,
    formData.current_weight_kg,
    formData.activity_level,
    formData.goal_type,
  ]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-neutral-800 mb-4">Personal Information</h3>
            
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              required
            />
            
            <Input
              label="Date of Birth"
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-neutral-800">Physical Stats</h3>
              
              {/* Unit Toggle */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${!useMetric ? 'text-primary-blue' : 'text-neutral-400'}`}>
                  Imperial
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUseMetric(!useMetric);
                    // Sync imperial inputs when switching to imperial
                    if (!useMetric) {
                      const height = cmToFeetInches(formData.height_cm);
                      setImperialInputs({
                        heightFeet: height.feet,
                        heightInches: height.inches,
                        currentWeightLbs: formData.current_weight_kg ? kgToLbs(formData.current_weight_kg) : '',
                        goalWeightLbs: formData.goal_weight_kg ? kgToLbs(formData.goal_weight_kg) : '',
                      });
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 ${
                    useMetric ? 'bg-primary-blue' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useMetric ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${useMetric ? 'text-primary-blue' : 'text-neutral-400'}`}>
                  Metric
                </span>
              </div>
            </div>
            
            {useMetric ? (
              <>
                <Input
                  label="Height (cm)"
                  type="number"
                  name="height_cm"
                  value={formData.height_cm}
                  onChange={handleChange}
                  placeholder="170"
                  required
                />
                
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  name="current_weight_kg"
                  value={formData.current_weight_kg}
                  onChange={handleChange}
                  placeholder="70"
                  step="0.1"
                  required
                />
                
                <Input
                  label="Goal Weight (kg)"
                  type="number"
                  name="goal_weight_kg"
                  value={formData.goal_weight_kg}
                  onChange={handleChange}
                  placeholder="65"
                  step="0.1"
                />
              </>
            ) : (
              <>
                {/* Imperial Height - Feet and Inches */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Height <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="5"
                      value={imperialInputs.heightFeet}
                      onChange={(e) => {
                        setImperialInputs(prev => ({ ...prev, heightFeet: e.target.value }));
                      }}
                      onBlur={() => {
                        const cm = feetInchesToCm(imperialInputs.heightFeet, imperialInputs.heightInches);
                        if (cm) {
                          setFormData({ ...formData, height_cm: cm });
                        }
                      }}
                      label="Feet"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="10"
                      value={imperialInputs.heightInches}
                      onChange={(e) => {
                        setImperialInputs(prev => ({ ...prev, heightInches: e.target.value }));
                      }}
                      onBlur={() => {
                        const cm = feetInchesToCm(imperialInputs.heightFeet, imperialInputs.heightInches);
                        if (cm) {
                          setFormData({ ...formData, height_cm: cm });
                        }
                      }}
                      label="Inches"
                      required
                    />
                  </div>
                </div>
                
                <Input
                  label="Current Weight (lbs)"
                  type="number"
                  value={imperialInputs.currentWeightLbs}
                  onChange={(e) => {
                    // Allow typing without conversion interference
                    setImperialInputs(prev => ({ ...prev, currentWeightLbs: e.target.value }));
                  }}
                  onBlur={(e) => {
                    // Convert to kg when user finishes typing
                    const lbs = e.target.value.trim();
                    if (lbs && !isNaN(parseFloat(lbs))) {
                      const kg = lbsToKg(lbs);
                      if (kg) {
                        setFormData({ ...formData, current_weight_kg: kg });
                      }
                    }
                  }}
                  placeholder="154"
                  step="0.1"
                  required
                />
                
                <Input
                  label="Goal Weight (lbs)"
                  type="number"
                  value={imperialInputs.goalWeightLbs}
                  onChange={(e) => {
                    // Allow typing without conversion interference
                    setImperialInputs(prev => ({ ...prev, goalWeightLbs: e.target.value }));
                  }}
                  onBlur={(e) => {
                    // Convert to kg when user finishes typing
                    const lbs = e.target.value.trim();
                    if (lbs && !isNaN(parseFloat(lbs))) {
                      const kg = lbsToKg(lbs);
                      if (kg) {
                        setFormData({ ...formData, goal_weight_kg: kg });
                      }
                    }
                  }}
                  placeholder="143"
                  step="0.1"
                />
              </>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-neutral-800 mb-4">Fitness Goals</h3>
            
            <Select
              label="Activity Level"
              name="activity_level"
              value={formData.activity_level}
              onChange={handleChange}
              options={[
                { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
                { value: 'light', label: 'Light (exercise 1-3 days/week)' },
                { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
                { value: 'active', label: 'Active (exercise 6-7 days/week)' },
                { value: 'very_active', label: 'Very Active (intense exercise daily)' },
              ]}
              required
            />
            
            <Select
              label="Fitness Goal"
              name="goal_type"
              value={formData.goal_type}
              onChange={handleChange}
              options={getGoalTypeOptions()}
              required
            />

            {/* Show calculated nutrition targets preview if available */}
            {formData.target_calories && (
              <div className="mt-6 p-4 bg-gradient-to-br from-primary-blue/10 to-primary-pink/10 rounded-lg border border-primary-blue/20">
                <p className="text-sm font-medium text-neutral-700 mb-3">
                  ✨ Your personalized nutrition targets:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-neutral-600">Calories:</span>
                    <span className="ml-2 font-semibold text-primary-blue">{formData.target_calories}</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Protein:</span>
                    <span className="ml-2 font-semibold text-primary-pink">{formData.target_protein_g}g</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Carbs:</span>
                    <span className="ml-2 font-semibold text-yellow-600">{formData.target_carbs_g}g</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Fat:</span>
                    <span className="ml-2 font-semibold text-green-600">{formData.target_fat_g}g</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-3">
                  These targets are calculated based on your physical stats and goals using proven nutrition science.
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-blue via-neutral-50 to-primary-pink px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600">Step {step} of {totalSteps}</span>
              <span className="text-sm font-medium text-primary-blue">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-pink to-primary-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-neutral-800 mb-6">Complete Your Profile</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="mb-8">
            {renderStep()}
          </div>
          
          <div className="flex justify-between gap-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <span className="flex items-center">
                  <ChevronLeft size={20} className="mr-2" />
                  Back
                </span>
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button variant="primary" onClick={handleNext} fullWidth={step === 1}>
                <span className="flex items-center justify-center">
                  Next
                  <ChevronRight size={20} className="ml-2" />
                </span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={loading}
                fullWidth
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

