import React, { useState } from 'react';
import { Card, Button, Input } from './ui';
import { Ruler, Save } from 'lucide-react';

const MeasurementForm = ({ onSubmit, onCancel, initialData = null, isLoading = false }) => {
  const [unit, setUnit] = useState('cm'); // 'cm' or 'inches'
  const [formData, setFormData] = useState({
    measurement_date: initialData?.measurement_date || new Date().toISOString().split('T')[0],
    waist_cm: initialData?.waist_cm || '',
    hips_cm: initialData?.hips_cm || '',
    chest_cm: initialData?.chest_cm || '',
    arms_cm: initialData?.arms_cm || '',
    thighs_cm: initialData?.thighs_cm || '',
    calves_cm: initialData?.calves_cm || '',
    neck_cm: initialData?.neck_cm || '',
    shoulders_cm: initialData?.shoulders_cm || '',
    body_fat_percentage: initialData?.body_fat_percentage || '',
    muscle_mass_kg: initialData?.muscle_mass_kg || '',
    notes: initialData?.notes || '',
  });

  const cmToInches = (cm) => (cm / 2.54).toFixed(1);
  const inchesToCm = (inches) => (inches * 2.54).toFixed(1);

  const handleInputChange = (field, value) => {
    if (value === '') {
      setFormData({ ...formData, [field]: '' });
      return;
    }

    let cmValue = value;
    if (unit === 'inches' && field.endsWith('_cm')) {
      cmValue = inchesToCm(parseFloat(value));
    }
    setFormData({ ...formData, [field]: cmValue });
  };

  const getDisplayValue = (field, value) => {
    if (!value) return '';
    if (unit === 'inches' && field.endsWith('_cm')) {
      return cmToInches(parseFloat(value));
    }
    return value;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty values and convert to proper types
    const submitData = {
      measurement_date: formData.measurement_date,
    };

    Object.keys(formData).forEach(key => {
      if (key !== 'measurement_date' && key !== 'notes' && formData[key] !== '') {
        submitData[key] = parseFloat(formData[key]);
      }
    });

    if (formData.notes) {
      submitData.notes = formData.notes;
    }

    onSubmit(submitData);
  };

  const measurementFields = [
    { key: 'waist_cm', label: 'Waist', icon: '⭕' },
    { key: 'hips_cm', label: 'Hips', icon: '⭕' },
    { key: 'chest_cm', label: 'Chest', icon: '💪' },
    { key: 'arms_cm', label: 'Arms/Biceps', icon: '💪' },
    { key: 'thighs_cm', label: 'Thighs', icon: '🦵' },
    { key: 'calves_cm', label: 'Calves', icon: '🦵' },
    { key: 'neck_cm', label: 'Neck', icon: '👔' },
    { key: 'shoulders_cm', label: 'Shoulders', icon: '💪' },
  ];

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="text-primary-pink" size={24} />
            <h2 className="text-xl font-bold text-neutral-800">
              {initialData ? 'Edit' : 'Log'} Body Measurements
            </h2>
          </div>
          
          {/* Unit Toggle */}
          <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                unit === 'cm'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setUnit('inches')}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                unit === 'inches'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              inches
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Date
          </label>
          <Input
            type="date"
            value={formData.measurement_date}
            onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Measurements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {measurementFields.map(({ key, label, icon }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {icon} {label} ({unit})
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={getDisplayValue(key, formData[key])}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        {/* Body Composition */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">
            Body Composition (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                📊 Body Fat Percentage (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.body_fat_percentage}
                onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                placeholder="e.g., 18.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                💪 Muscle Mass (kg)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.muscle_mass_kg}
                onChange={(e) => setFormData({ ...formData, muscle_mass_kg: e.target.value })}
                placeholder="e.g., 45.0"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            📝 Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g., Morning measurement, before breakfast"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
          />
          <p className="text-xs text-neutral-500 mt-1">
            {formData.notes.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Saving...' : initialData ? 'Update Measurements' : 'Save Measurements'}
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

export default MeasurementForm;

