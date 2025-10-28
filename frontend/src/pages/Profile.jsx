import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Card, Button, Input, Select, LoadingSpinner } from '../components/ui';
import { User, Target, Activity, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
      <Card title="Physical Stats" className="border-l-4 border-primary-blue">
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
            label="Goal Type"
            name="goal_type"
            value={formData.goal_type}
            onChange={handleChange}
            disabled={!editing}
            options={[
              { value: 'lose', label: 'Lose Weight' },
              { value: 'maintain', label: 'Maintain Weight' },
              { value: 'gain', label: 'Gain Weight' },
            ]}
          />
        </div>
      </Card>

      {/* Nutrition Targets */}
      <Card title="Nutrition Targets" className="border-l-4 border-green-400">
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

