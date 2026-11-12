import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ScanLine, Plus } from 'lucide-react';
import { foodAPI } from '../services/api';
import { Card, Button, Input, Modal } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';
import FoodSearch from '../components/FoodSearch';
import PortionPicker, { defaultMeal } from '../components/PortionPicker';
import CustomFoodForm from '../components/CustomFoodForm';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (s) => (s.trim() === '' ? NaN : Number(s));

const FoodLog = () => {
  const [params] = useSearchParams(); // ?date=YYYY-MM-DD&meal=lunch from the Today screen
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const date = params.get('date') || today;
  const [meal, setMeal] = useState(params.get('meal') || defaultMeal());
  const [picked, setPicked] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [missing, setMissing] = useState(null); // barcode with no match
  const [scanError, setScanError] = useState('');
  const [customForm, setCustomForm] = useState(null); // {barcode}
  const [showQuick, setShowQuick] = useState(false);
  const [quick, setQuick] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [quickError, setQuickError] = useState('');
  const [saving, setSaving] = useState(false);

  const goToday = () => navigate('/?date=' + date);

  const handleBarcodeScan = useCallback(async (barcode) => {
    setShowScanner(false);
    setScanError('');
    try {
      const response = await foodAPI.byBarcode(barcode);
      setPicked(response.data);
    } catch (error) {
      if (error.response?.status === 404) setMissing(barcode);
      else setScanError('Barcode lookup failed. Try again.');
    }
  }, []);

  const cal = num(quick.calories);
  const quickValid = quick.name.trim() !== '' && !Number.isNaN(cal) && cal >= 0;

  const handleQuickAdd = async () => {
    setSaving(true);
    setQuickError('');
    try {
      await foodAPI.createEntry({
        food_name: quick.name.trim(),
        calories: cal,
        protein_g: num(quick.protein) || 0,
        carbs_g: num(quick.carbs) || 0,
        fat_g: num(quick.fat) || 0,
        meal_type: meal,
        entry_date: date,
      });
      goToday();
    } catch {
      setQuickError('Could not add the entry. Try again.');
      setSaving(false);
    }
  };

  const setQ = (k) => (e) => setQuick({ ...quick, [k]: e.target.value });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="text-title text-neutral-800">Add to {cap(meal)}</h1>
        <p className="text-caption text-neutral-600">
          {date === today ? 'Today' : format(parseISO(date), 'EEE, MMM d')}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {MEALS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={meal === m}
            onClick={() => setMeal(m)}
            className={`min-h-[44px] rounded-lg text-small ${
              meal === m
                ? 'bg-brand-100 text-brand-700 font-medium'
                : 'bg-white border border-neutral-300 text-neutral-700'
            }`}
          >
            {cap(m)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setShowScanner(true)}>
          <ScanLine size={18} className="mr-2" />
          Scan barcode
        </Button>
        <Button variant="secondary" onClick={() => setShowQuick(true)}>
          <Plus size={18} className="mr-2" />
          Quick add
        </Button>
      </div>

      {scanError && <p className="text-small text-danger-600">{scanError}</p>}

      {missing && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-small">No food found for {missing}</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMissing(null)}>Dismiss</Button>
              <Button variant="secondary" onClick={() => { setCustomForm({ barcode: missing }); setMissing(null); }}>
                Add it
              </Button>
            </div>
          </div>
        </Card>
      )}

      <FoodSearch onSelect={setPicked} onCreate={() => setCustomForm({ barcode: '' })} />

      <Modal
        isOpen={showQuick}
        onClose={() => setShowQuick(false)}
        title="Quick add"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowQuick(false)}>Cancel</Button>
            <Button variant="primary" disabled={!quickValid || saving} onClick={handleQuickAdd}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" name="qa-name" value={quick.name} onChange={setQ('name')} required />
          <Input label="Calories" name="qa-cal" type="text" inputMode="decimal" value={quick.calories} onChange={setQ('calories')} required />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Protein g" name="qa-p" type="text" inputMode="decimal" value={quick.protein} onChange={setQ('protein')} />
            <Input label="Carbs g" name="qa-c" type="text" inputMode="decimal" value={quick.carbs} onChange={setQ('carbs')} />
            <Input label="Fat g" name="qa-f" type="text" inputMode="decimal" value={quick.fat} onChange={setQ('fat')} />
          </div>
          {quickError && <p className="text-small text-danger-600">{quickError}</p>}
        </div>
      </Modal>

      {customForm && (
        <CustomFoodForm
          barcode={customForm.barcode}
          onClose={() => setCustomForm(null)}
          onCreated={(food) => { setCustomForm(null); setPicked(food); }}
        />
      )}

      {picked && (
        <PortionPicker
          food={picked}
          date={date}
          meal={meal}
          onAdded={goToday}
          onClose={() => setPicked(null)}
        />
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}

      <p className="text-caption text-neutral-600 text-center">
        Food data: USDA FoodData Central, Canadian Nutrient File (Health Canada), Open Food Facts (ODbL)
      </p>
    </div>
  );
};

export default FoodLog;
