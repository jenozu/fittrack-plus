import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Button, Input, Select, LoadingSpinner } from '../components/ui';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
            <h3 className="text-xl font-semibold text-neutral-800 mb-4">Physical Stats</h3>
            
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
              label="Goal Type"
              name="goal_type"
              value={formData.goal_type}
              onChange={handleChange}
              options={[
                { value: 'lose', label: 'Lose Weight' },
                { value: 'maintain', label: 'Maintain Weight' },
                { value: 'gain', label: 'Gain Weight' },
              ]}
              required
            />
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
                <ChevronLeft size={20} className="mr-2" />
                Back
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button variant="primary" onClick={handleNext} fullWidth={step === 1}>
                Next
                <ChevronRight size={20} className="ml-2" />
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

