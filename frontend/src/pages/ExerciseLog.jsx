import React, { useState, useEffect } from 'react';
import { exerciseAPI, dashboardAPI } from '../services/api';
import { Card, Button, Input, Modal, LoadingSpinner } from '../components/ui';
import { Plus, Trash2, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';

const ExerciseLog = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    exercise_name: '',
    duration_minutes: '',
    calories_burned: '',
    notes: '',
  });

  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, [selectedDate]);

  const fetchEntries = async () => {
    try {
      const response = await exerciseAPI.getEntries(selectedDate);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch exercise entries:', error);
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

  const handleAdd = async () => {
    try {
      await exerciseAPI.createEntry({
        ...newEntry,
        duration_minutes: parseFloat(newEntry.duration_minutes),
        calories_burned: parseFloat(newEntry.calories_burned) || 0,
        entry_date: selectedDate,
      });
      fetchEntries();
      fetchSummary();
      setShowModal(false);
      setNewEntry({
        exercise_name: '',
        duration_minutes: '',
        calories_burned: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to add exercise entry:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exercise entry?')) return;
    
    try {
      await exerciseAPI.deleteEntry(id);
      fetchEntries();
      fetchSummary();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories_burned, 0);

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
        <h1 className="text-3xl font-bold text-neutral-800">Exercise Log</h1>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-blue/10 to-primary-blue/5">
          <div className="text-center">
            <Dumbbell className="mx-auto mb-2 text-primary-blue" size={32} />
            <p className="text-sm text-neutral-600">Total Duration</p>
            <p className="text-3xl font-bold text-neutral-800">{totalDuration}</p>
            <p className="text-xs text-neutral-500">minutes</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-100/50 to-orange-50/50">
          <div className="text-center">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-sm text-neutral-600">Calories Burned</p>
            <p className="text-3xl font-bold text-neutral-800">{Math.round(totalCalories)}</p>
            <p className="text-xs text-neutral-500">calories</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-100/50 to-green-50/50">
          <div className="text-center">
            <div className="text-4xl mb-2">💪</div>
            <p className="text-sm text-neutral-600">Workouts</p>
            <p className="text-3xl font-bold text-neutral-800">{entries.length}</p>
            <p className="text-xs text-neutral-500">sessions</p>
          </div>
        </Card>
      </div>

      {/* Add Button */}
      <Button variant="secondary" onClick={() => setShowModal(true)}>
        <Plus size={18} className="mr-2" />
        Log Exercise
      </Button>

      {/* Exercise Entries */}
      {entries.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-neutral-500">
            <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
            <p>No exercise logged for this day.</p>
            <p className="text-sm mt-2">Start by adding your workout!</p>
          </div>
        </Card>
      ) : (
        <Card title="Today's Workouts">
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-start p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-800 text-lg">
                    {entry.exercise_name}
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    {entry.duration_minutes} minutes • {Math.round(entry.calories_burned)} calories burned
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-neutral-500 mt-2 italic">
                      Note: {entry.notes}
                    </p>
                  )}
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
      )}

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Log Exercise"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleAdd}>
              Add Exercise
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            placeholder="Running, Weightlifting, Yoga..."
            value={newEntry.exercise_name}
            onChange={(e) => setNewEntry({ ...newEntry, exercise_name: e.target.value })}
            required
          />

          <Input
            label="Duration (minutes)"
            type="number"
            placeholder="30"
            value={newEntry.duration_minutes}
            onChange={(e) => setNewEntry({ ...newEntry, duration_minutes: e.target.value })}
            required
          />

          <Input
            label="Calories Burned (optional)"
            type="number"
            placeholder="250"
            value={newEntry.calories_burned}
            onChange={(e) => setNewEntry({ ...newEntry, calories_burned: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border-2 border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
              rows="3"
              placeholder="How did it feel? Any achievements?"
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExerciseLog;

