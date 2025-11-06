import React, { useState } from 'react';
import { exportAPI, downloadBlob } from '../services/api';
import { Card, Button, LoadingSpinner } from '../components/ui';
import { Download, FileText, FileJson, FileSpreadsheet, Database, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

const ExportData = () => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    food: true,
    exercise: true,
    weight: true,
    water: true,
    measurements: true,
  });

  const handleDataTypeToggle = (type) => {
    setSelectedDataTypes(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const getExportParams = () => {
    const params = {};
    
    if (useCustomDates && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else {
      params.days = days;
    }
    
    // Only include selected data types
    const types = Object.keys(selectedDataTypes).filter(key => selectedDataTypes[key]);
    if (types.length > 0) {
      params.data_types = types;
    }
    
    return params;
  };

  const handleExport = async (format) => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const params = getExportParams();
      let response;
      let filename;

      switch (format) {
        case 'csv':
          response = await exportAPI.exportCSV(params);
          filename = `fittrack_plus_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          break;
        case 'json':
          response = await exportAPI.exportJSON(params);
          filename = `fittrack_plus_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
          break;
        case 'pdf':
          response = await exportAPI.exportPDF(params);
          filename = `fittrack_plus_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          break;
        case 'all':
          response = await exportAPI.exportAll(params);
          filename = `fittrack_plus_complete_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
          break;
        default:
          throw new Error('Invalid export format');
      }

      downloadBlob(response.data, filename);
      setSuccess(`Successfully exported data as ${format.toUpperCase()}!`);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err.response?.data?.detail || 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const dataTypeOptions = [
    { key: 'food', label: 'Food Entries', icon: '🍽️', description: 'All food logs and nutrition data' },
    { key: 'exercise', label: 'Exercise Entries', icon: '💪', description: 'Workout logs and calories burned' },
    { key: 'weight', label: 'Weight Logs', icon: '⚖️', description: 'Weight tracking history' },
    { key: 'water', label: 'Water Intake', icon: '💧', description: 'Daily water consumption logs' },
    { key: 'measurements', label: 'Body Measurements', icon: '📏', description: 'Body composition tracking' },
  ];

  const presetTimeRanges = [
    { days: 7, label: 'Last 7 Days' },
    { days: 30, label: 'Last 30 Days' },
    { days: 90, label: 'Last 90 Days' },
    { days: 180, label: 'Last 6 Months' },
    { days: 365, label: 'Last Year' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-800">
          📤 Export Your Data
        </h1>
        <p className="text-neutral-600 mt-1">
          Download your fitness data in multiple formats. You own your data!
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Download size={20} />
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Date Range Selection */}
      <Card>
        <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-primary-blue" />
          Select Time Range
        </h2>
        
        <div className="space-y-4">
          {/* Preset Time Ranges */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {presetTimeRanges.map((range) => (
                <button
                  key={range.days}
                  onClick={() => {
                    setDays(range.days);
                    setUseCustomDates(false);
                  }}
                  disabled={exporting}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !useCustomDates && days === range.days
                      ? 'bg-primary-blue text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="customDates"
                checked={useCustomDates}
                onChange={(e) => setUseCustomDates(e.target.checked)}
                disabled={exporting}
                className="w-4 h-4 text-primary-blue rounded focus:ring-primary-blue"
              />
              <label htmlFor="customDates" className="text-sm font-medium text-neutral-700">
                Use Custom Date Range
              </label>
            </div>
            
            {useCustomDates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                    disabled={exporting}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    disabled={exporting}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Data Type Selection */}
      <Card>
        <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <Database size={20} className="text-primary-pink" />
          Select Data Types
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dataTypeOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => !exporting && handleDataTypeToggle(option.key)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDataTypes[option.key]
                  ? 'border-primary-blue bg-blue-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedDataTypes[option.key]}
                  onChange={() => {}}
                  disabled={exporting}
                  className="mt-1 w-5 h-5 text-primary-blue rounded focus:ring-primary-blue"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{option.icon}</span>
                    <h3 className="font-semibold text-neutral-800">{option.label}</h3>
                  </div>
                  <p className="text-sm text-neutral-600">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Formats */}
      <Card>
        <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <Download size={20} className="text-green-600" />
          Choose Export Format
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CSV Export */}
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border-2 border-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="mx-auto mb-3 text-green-600" size={48} />
            <h3 className="font-bold text-neutral-800 mb-1">CSV</h3>
            <p className="text-xs text-neutral-600">
              Spreadsheet format for Excel, Google Sheets
            </p>
          </button>

          {/* JSON Export */}
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border-2 border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileJson className="mx-auto mb-3 text-blue-600" size={48} />
            <h3 className="font-bold text-neutral-800 mb-1">JSON</h3>
            <p className="text-xs text-neutral-600">
              Structured data for developers & apps
            </p>
          </button>

          {/* PDF Report */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="p-6 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 rounded-lg border-2 border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="mx-auto mb-3 text-red-600" size={48} />
            <h3 className="font-bold text-neutral-800 mb-1">PDF Report</h3>
            <p className="text-xs text-neutral-600">
              Beautiful formatted report with charts
            </p>
          </button>

          {/* Complete Backup */}
          <button
            onClick={() => handleExport('all')}
            disabled={exporting}
            className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-lg border-2 border-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="mx-auto mb-3 text-purple-600" size={48} />
            <h3 className="font-bold text-neutral-800 mb-1">Complete Backup</h3>
            <p className="text-xs text-neutral-600">
              All data in JSON format for backup
            </p>
          </button>
        </div>

        {exporting && (
          <div className="mt-6 flex items-center justify-center gap-3 text-primary-blue">
            <LoadingSpinner />
            <span className="font-medium">Generating export...</span>
          </div>
        )}
      </Card>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-bold text-neutral-800 mb-2">Data Privacy & Ownership</h3>
            <ul className="text-sm text-neutral-700 space-y-1">
              <li>• Your data is yours. Export it anytime, no restrictions.</li>
              <li>• All exports are generated on-demand and not stored on our servers.</li>
              <li>• CSV and JSON formats can be imported into other apps.</li>
              <li>• PDF reports are perfect for sharing with coaches or healthcare providers.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExportData;

