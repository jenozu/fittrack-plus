import React, { useState, useEffect } from 'react';
import { measurementsAPI } from '../services/api';
import { Button, LoadingSpinner, Modal } from '../components/ui';
import MeasurementForm from '../components/MeasurementForm';
import MeasurementCard from '../components/MeasurementCard';
import MeasurementCharts from '../components/MeasurementCharts';
import { Plus, Trash2, Edit } from 'lucide-react';

const Measurements = () => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      const response = await measurementsAPI.getComparison();
      setComparison(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        // No measurements yet, that's ok
        setComparison(null);
      } else {
        console.error('Failed to fetch measurements:', error);
        setError('Failed to load measurements');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError(null);
    
    try {
      if (editingMeasurement) {
        await measurementsAPI.update(editingMeasurement.id, data);
        setSuccess('Measurement updated successfully!');
      } else {
        await measurementsAPI.create(data);
        setSuccess('Measurement saved successfully!');
      }
      
      setShowForm(false);
      setEditingMeasurement(null);
      await fetchComparison();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save measurement:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to save measurement. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (comparison?.current) {
      setEditingMeasurement(comparison.current);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    if (!comparison?.current) return;
    
    if (!window.confirm('Are you sure you want to delete this measurement?')) {
      return;
    }

    try {
      await measurementsAPI.delete(comparison.current.id);
      setSuccess('Measurement deleted successfully!');
      await fetchComparison();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      setError('Failed to delete measurement');
    }
  };

  const handleNewMeasurement = () => {
    setEditingMeasurement(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMeasurement(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            📏 Body Measurements
          </h1>
          <p className="text-neutral-600 mt-1">
            Track your body composition and see your progress over time
          </p>
        </div>
        
        <div className="flex gap-2">
          {comparison?.current && (
            <>
              <Button
                variant="secondary"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit size={18} />
                Edit Latest
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                className="flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </Button>
            </>
          )}
          <Button
            variant="primary"
            onClick={handleNewMeasurement}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            New Measurement
          </Button>
        </div>
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

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleCancel}
          title={editingMeasurement ? 'Edit Measurement' : 'New Measurement'}
          maxWidth="4xl"
        >
          <MeasurementForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingMeasurement}
            isLoading={submitting}
          />
        </Modal>
      )}

      {/* Current vs Previous Comparison */}
      <MeasurementCard
        comparison={comparison}
        onRefresh={fetchComparison}
      />

      {/* Charts and Progress */}
      {comparison && (
        <MeasurementCharts days={90} />
      )}

      {/* Empty State */}
      {!comparison && (
        <div className="text-center py-12">
          <div className="bg-neutral-50 rounded-lg p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">📏</div>
            <h3 className="text-xl font-bold text-neutral-800 mb-2">
              Start Tracking Your Measurements
            </h3>
            <p className="text-neutral-600 mb-6">
              Track your waist, hips, chest, arms, and more to see your body composition changes over time.
            </p>
            <Button
              variant="primary"
              onClick={handleNewMeasurement}
              className="mx-auto"
            >
              <Plus size={18} className="mr-2" />
              Log Your First Measurement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Measurements;

