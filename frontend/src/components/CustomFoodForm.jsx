import { useState } from 'react';
import { foodAPI } from '../services/api';
import { Modal, Button } from './ui';

const cls = 'w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 py-2 text-base';

function Field({ label, ...props }) {
  return (
    <label className="block text-sm text-neutral-700">
      {label}
      <input className={cls} {...props} />
    </label>
  );
}

// onCreated(food) gets the FoodOut row from POST /food/custom.
export default function CustomFoodForm({ barcode = '', onCreated, onClose }) {
  const [f, setF] = useState({ name: '', brand: '', barcode, basis: '100g', serving_g: '', serving_label: '',
    kcal: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const num = (v) => (v === '' ? 0 : parseFloat(v));
  const servingOk = f.basis === '100g' || parseFloat(f.serving_g) > 0;
  const valid = f.name.trim() && f.kcal !== '' && servingOk;

  async function save() {
    setBusy(true); setError('');
    const body = {
      name: f.name.trim(), brand: f.brand.trim() || null, barcode: f.barcode.trim() || null, basis: f.basis,
      serving_g: parseFloat(f.serving_g) > 0 ? parseFloat(f.serving_g) : null,
      serving_label: f.serving_label.trim() || null,
      kcal: num(f.kcal), protein: num(f.protein), carbs: num(f.carbs), fat: num(f.fat),
    };
    try {
      const res = await foodAPI.createCustom(body);
      onCreated(res.data);
    } catch (e) {
      setError(e.response?.data?.detail?.toString() || 'Could not save. Try again.');
      setBusy(false);
    }
  }

  const unit = f.basis === '100g' ? 'per 100 g' : 'per serving';
  return (
    <Modal isOpen onClose={onClose} title="Create a food"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" onClick={save} disabled={!valid || busy}>Save</Button>
      </>}>
      <div className="space-y-3">
        <Field label="Name" value={f.name} onChange={set('name')} />
        <Field label="Brand (optional)" value={f.brand} onChange={set('brand')} />
        <Field label="Barcode (optional)" inputMode="numeric" value={f.barcode} onChange={set('barcode')} />
        <label className="block text-sm text-neutral-700">
          Nutrition values are
          <select className={cls} value={f.basis} onChange={set('basis')}>
            <option value="100g">per 100 g</option>
            <option value="serving">per serving</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label={f.basis === 'serving' ? 'Serving size (g)' : 'Serving size (g, optional)'} type="number"
            inputMode="decimal" value={f.serving_g} onChange={set('serving_g')} />
          <Field label="Serving name" placeholder="1 bar" value={f.serving_label} onChange={set('serving_label')} />
        </div>
        <Field label={`Calories ${unit}`} type="number" inputMode="decimal" value={f.kcal} onChange={set('kcal')} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Protein (g)" type="number" inputMode="decimal" value={f.protein} onChange={set('protein')} />
          <Field label="Carbs (g)" type="number" inputMode="decimal" value={f.carbs} onChange={set('carbs')} />
          <Field label="Fat (g)" type="number" inputMode="decimal" value={f.fat} onChange={set('fat')} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
