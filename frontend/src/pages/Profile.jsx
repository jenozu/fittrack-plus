import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Card, Button, Input, Select, LoadingSpinner } from '../components/ui';
import { User, Target, Activity, Save, Calculator } from 'lucide-react';
import { calculateNutritionTargets, getGoalTypeOptions } from '../utils/nutritionCalculator';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useMetric, setUseMetric] = useState(false); // Default to imperial
  
  // Local state for imperial inputs to avoid conversion conflicts during typing
  const [imperialInputs, setImperialInputs] = useState({
    heightFeet: '',
    heightInches: '',
    currentWeightLbs: '',
    goalWeightLbs: '',
  });
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    gender: user?.gender || '',
    height_cm: user?.height_cm || '',
    current_weight_kg: user?.current_weight_kg || '',
    goal_weight_kg: user?.goal_weight_kg || '',
    activity_level: user?.activity_level || '',
    goal_type: user?.goal_type || '',
    target_calories: user?.target_calories || '',
    target_protein_g: user?.target_protein_g || '',
    target_carbs_g: user?.target_carbs_g || '',
    target_fat_g: user?.target_fat_g || '',
  });

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
  
  // Initialize imperial inputs when component mounts, user data changes, or when switching to imperial
  React.useEffect(() => {
    if (!useMetric && formData.height_cm) {
      const height = cmToFeetInches(formData.height_cm);
      setImperialInputs(prev => ({
        ...prev,
        heightFeet: height.feet,
        heightInches: height.inches,
        currentWeightLbs: formData.current_weight_kg ? kgToLbs(formData.current_weight_kg) : prev.currentWeightLbs,
        goalWeightLbs: formData.goal_weight_kg ? kgToLbs(formData.goal_weight_kg) : prev.goalWeightLbs,
      }));
    }
  }, [user, useMetric, formData.height_cm]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await usersAPI.updateProfile(formData);
      updateUser(response.data);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      gender: user?.gender || '',
      height_cm: user?.height_cm || '',
      current_weight_kg: user?.current_weight_kg || '',
      goal_weight_kg: user?.goal_weight_kg || '',
      activity_level: user?.activity_level || '',
      goal_type: user?.goal_type || '',
      target_calories: user?.target_calories || '',
      target_protein_g: user?.target_protein_g || '',
      target_carbs_g: user?.target_carbs_g || '',
      target_fat_g: user?.target_fat_g || '',
    });
    setEditing(false);
  };

  const handleCalculateNutrition = () => {
    // Check what's missing and provide helpful guidance
    const missing = [];
    
    if (!formData.gender) missing.push('Gender');
    if (!user?.date_of_birth) missing.push('Date of Birth');
    if (!formData.height_cm) missing.push('Height');
    if (!formData.current_weight_kg) missing.push('Current Weight');
    if (!formData.activity_level) missing.push('Activity Level');
    if (!formData.goal_type) missing.push('Fitness Goal');
    
    if (missing.length > 0) {
      alert(
        `📝 To calculate your personalized nutrition targets, please fill in:\n\n` +
        `${missing.map(field => `• ${field}`).join('\n')}\n\n` +
        `These help us calculate the exact calories and macros your body needs to reach your goals!`
      );
      return;
    }

    // Need to get date_of_birth from user object
    const userData = {
      ...formData,
      date_of_birth: user?.date_of_birth,
    };

    const nutritionTargets = calculateNutritionTargets(userData);
    
    if (nutritionTargets) {
      setFormData(prev => ({
        ...prev,
        target_calories: nutritionTargets.target_calories,
        target_protein_g: nutritionTargets.target_protein_g,
        target_carbs_g: nutritionTargets.target_carbs_g,
        target_fat_g: nutritionTargets.target_fat_g,
      }));
      
      // Show success message
      alert(
        `✨ Nutrition targets calculated!\n\n` +
        `Based on your profile, we recommend:\n` +
        `• ${nutritionTargets.target_calories} calories/day\n` +
        `• ${nutritionTargets.target_protein_g}g protein\n` +
        `• ${nutritionTargets.target_carbs_g}g carbs\n` +
        `• ${nutritionTargets.target_fat_g}g fat\n\n` +
        `These targets will help you achieve your goal! Click "Save Changes" to keep them.`
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-pink to-primary-blue rounded-full flex items-center justify-center">
          <User className="text-white" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-neutral-800">Profile Settings</h1>
      </div>

      {/* Account Info */}
      <Card
        title="Account Information"
        headerActions={
          !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={!editing}
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <Input
            label="Email"
            value={user?.email || ''}
            disabled
          />

          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={!editing}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>
      </Card>

      {/* Physical Stats */}
      <Card 
        title="Physical Stats" 
        className="border-l-4 border-primary-blue"
        headerActions={
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${!useMetric ? 'text-primary-blue' : 'text-neutral-400'}`}>
              Imperial
            </span>
            <button
              type="button"
              onClick={() => {
                const newMetricState = !useMetric;
                setUseMetric(newMetricState);
                // Sync imperial inputs when switching to imperial
                if (!newMetricState) {
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
        }
      >
        {useMetric ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Height (cm)"
              name="height_cm"
              type="number"
              value={formData.height_cm}
              onChange={handleChange}
              disabled={!editing}
            />
            <Input
              label="Current Weight (kg)"
              name="current_weight_kg"
              type="number"
              step="0.1"
              value={formData.current_weight_kg}
              onChange={handleChange}
              disabled={!editing}
            />
            <Input
              label="Goal Weight (kg)"
              name="goal_weight_kg"
              type="number"
              step="0.1"
              value={formData.goal_weight_kg}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Imperial Height - Feet and Inches */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Height
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
                  disabled={!editing}
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
                  disabled={!editing}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Current Weight (lbs)"
                type="number"
                value={imperialInputs.currentWeightLbs}
                onChange={(e) => {
                  setImperialInputs(prev => ({ ...prev, currentWeightLbs: e.target.value }));
                }}
                onBlur={(e) => {
                  const lbs = e.target.value.trim();
                  if (lbs && !isNaN(parseFloat(lbs))) {
                    const kg = lbsToKg(lbs);
                    if (kg) {
                      setFormData({ ...formData, current_weight_kg: kg });
                    }
                  }
                }}
                step="0.1"
                disabled={!editing}
              />
              <Input
                label="Goal Weight (lbs)"
                type="number"
                value={imperialInputs.goalWeightLbs}
                onChange={(e) => {
                  setImperialInputs(prev => ({ ...prev, goalWeightLbs: e.target.value }));
                }}
                onBlur={(e) => {
                  const lbs = e.target.value.trim();
                  if (lbs && !isNaN(parseFloat(lbs))) {
                    const kg = lbsToKg(lbs);
                    if (kg) {
                      setFormData({ ...formData, goal_weight_kg: kg });
                    }
                  }
                }}
                step="0.1"
                disabled={!editing}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Fitness Goals */}
      <Card title="Fitness Goals" className="border-l-4 border-primary-pink">
        <div className="space-y-4">
          <Select
            label="Activity Level"
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            disabled={!editing}
            options={[
              { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
              { value: 'light', label: 'Light (exercise 1-3 days/week)' },
              { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
              { value: 'active', label: 'Active (exercise 6-7 days/week)' },
              { value: 'very_active', label: 'Very Active (intense exercise daily)' },
            ]}
          />

          <Select
            label="Fitness Goal"
            name="goal_type"
            value={formData.goal_type}
            onChange={handleChange}
            disabled={!editing}
            options={getGoalTypeOptions()}
          />
        </div>
      </Card>

      {/* Nutrition Targets */}
      <Card 
        title="Nutrition Targets" 
        className="border-l-4 border-green-400"
        headerActions={
          editing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCalculateNutrition}
            >
              <Calculator size={16} className="mr-2" />
              Calculate for Me
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {editing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              💡 <strong>Don't know what your macros should be?</strong> Just fill in your Physical Stats and Fitness Goals above, then click "Calculate for Me" — we'll figure out the perfect calorie and macro targets for your body and goals!
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Target Calories"
              name="target_calories"
              type="number"
              value={formData.target_calories}
              onChange={handleChange}
              disabled={!editing}
            />
            <div />
            <Input
              label="Target Protein (g)"
              name="target_protein_g"
              type="number"
              step="0.1"
              value={formData.target_protein_g}
              onChange={handleChange}
              disabled={!editing}
            />
            <Input
              label="Target Carbs (g)"
              name="target_carbs_g"
              type="number"
              step="0.1"
              value={formData.target_carbs_g}
              onChange={handleChange}
              disabled={!editing}
            />
            <Input
              label="Target Fat (g)"
              name="target_fat_g"
              type="number"
              step="0.1"
              value={formData.target_fat_g}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      {editing && (
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Profile;

