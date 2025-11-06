import React, { useState } from 'react';
import { Card } from './ui';
import { TrendingDown, TrendingUp, Minus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const MeasurementCard = ({ comparison, onRefresh }) => {
  const [unit, setUnit] = useState('cm');

  if (!comparison || !comparison.current) {
    return (
      <Card title="📏 Body Measurements">
        <p className="text-neutral-500 text-center py-8">
          No measurements recorded yet. Start tracking your progress!
        </p>
      </Card>
    );
  }

  const { current, previous, changes, current_date, previous_date } = comparison;

  const cmToInches = (cm) => (cm / 2.54).toFixed(1);

  const formatValue = (value) => {
    if (!value) return '-';
    if (unit === 'inches') {
      return `${cmToInches(value)}"`;
    }
    return `${value.toFixed(1)} cm`;
  };

  const getChangeDisplay = (change) => {
    if (!change) return null;
    
    const value = unit === 'inches' ? change.change_inches : change.change_cm;
    const isReduction = value < 0;
    const isIncrease = value > 0;
    
    return (
      <div className={`flex items-center gap-1 text-sm ${
        isReduction ? 'text-green-600' : isIncrease ? 'text-orange-600' : 'text-neutral-500'
      }`}>
        {isReduction && <TrendingDown size={16} />}
        {isIncrease && <TrendingUp size={16} />}
        {!isReduction && !isIncrease && <Minus size={16} />}
        <span className="font-medium">
          {value > 0 ? '+' : ''}{value.toFixed(1)} {unit === 'inches' ? '"' : 'cm'}
        </span>
        {change.percentage !== 0 && (
          <span className="text-xs opacity-75">
            ({change.percentage > 0 ? '+' : ''}{change.percentage}%)
          </span>
        )}
      </div>
    );
  };

  const measurementRows = [
    { key: 'waist_cm', label: 'Waist', icon: '⭕' },
    { key: 'hips_cm', label: 'Hips', icon: '⭕' },
    { key: 'chest_cm', label: 'Chest', icon: '💪' },
    { key: 'arms_cm', label: 'Arms', icon: '💪' },
    { key: 'thighs_cm', label: 'Thighs', icon: '🦵' },
    { key: 'calves_cm', label: 'Calves', icon: '🦵' },
    { key: 'neck_cm', label: 'Neck', icon: '👔' },
    { key: 'shoulders_cm', label: 'Shoulders', icon: '💪' },
  ];

  // Filter to only show measurements that have current values
  const visibleMeasurements = measurementRows.filter(row => current[row.key] != null);

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            📏 Body Measurements
          </h2>
          
          {/* Unit Toggle */}
          <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                unit === 'cm'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              cm
            </button>
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                unit === 'inches'
                  ? 'bg-white text-primary-blue shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              inches
            </button>
          </div>
        </div>

        {/* Date Info */}
        <div className="flex items-center gap-4 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>Current: {format(new Date(current_date), 'MMM d, yyyy')}</span>
          </div>
          {previous_date && (
            <div className="flex items-center gap-1 text-neutral-500">
              <span>Previous: {format(new Date(previous_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Measurements Table */}
        {visibleMeasurements.length > 0 ? (
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-semibold text-neutral-700">
                    Measurement
                  </th>
                  <th className="text-right px-4 py-2 text-sm font-semibold text-neutral-700">
                    Current
                  </th>
                  {previous && (
                    <>
                      <th className="text-right px-4 py-2 text-sm font-semibold text-neutral-700">
                        Previous
                      </th>
                      <th className="text-right px-4 py-2 text-sm font-semibold text-neutral-700">
                        Change
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {visibleMeasurements.map(({ key, label, icon }) => (
                  <tr key={key} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-neutral-800">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                      {formatValue(current[key])}
                    </td>
                    {previous && (
                      <>
                        <td className="px-4 py-3 text-right text-neutral-600">
                          {formatValue(previous[key])}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {changes[key] ? getChangeDisplay(changes[key]) : (
                            <span className="text-neutral-400 text-sm">-</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-500 text-center py-4">
            No measurement data available
          </p>
        )}

        {/* Body Composition Section */}
        {(current.body_fat_percentage || current.muscle_mass_kg) && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">
              Body Composition
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {current.body_fat_percentage && (
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-xs text-neutral-600 mb-1">Body Fat</p>
                  <p className="text-2xl font-bold text-primary-blue">
                    {current.body_fat_percentage.toFixed(1)}%
                  </p>
                  {previous?.body_fat_percentage && changes.body_fat_percentage && (
                    <div className="mt-1">
                      {getChangeDisplay(changes.body_fat_percentage)}
                    </div>
                  )}
                </div>
              )}
              {current.muscle_mass_kg && (
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-xs text-neutral-600 mb-1">Muscle Mass</p>
                  <p className="text-2xl font-bold text-primary-pink">
                    {current.muscle_mass_kg.toFixed(1)} kg
                  </p>
                  {previous?.muscle_mass_kg && changes.muscle_mass_kg && (
                    <div className="mt-1">
                      {getChangeDisplay(changes.muscle_mass_kg)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {current.notes && (
          <div className="border-t pt-4">
            <p className="text-sm text-neutral-600">
              <span className="font-medium">Notes: </span>
              {current.notes}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MeasurementCard;

