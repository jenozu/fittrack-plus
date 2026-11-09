import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateNutritionTargets } from './nutritionCalculator';

describe('nutritionCalculator', () => {
  it('computes Mifflin-St Jeor BMR and TDEE for a female, moderate', () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
    const bmr = calculateBMR(60, 165, 30, 'female');
    expect(bmr).toBe(1320);
    // 1320.25 * 1.55 = 2046.4
    expect(calculateTDEE(bmr, 'moderate')).toBe(2046);
  });

  it('uses +5 for male BMR', () => {
    // 10*60 + 6.25*165 - 5*30 + 5 = 1486.25
    expect(calculateBMR(60, 165, 30, 'male')).toBe(1486);
  });

  it('applies the calorie floor (1200 female / 1500 male)', () => {
    const base = { current_weight_kg: 45, height_cm: 150, date_of_birth: '1990-01-01', activity_level: 'sedentary', goal_type: 'lose_weight' };
    expect(calculateNutritionTargets({ ...base, gender: 'female' }).target_calories).toBe(1200);
    expect(calculateNutritionTargets({ ...base, gender: 'male' }).target_calories).toBe(1500);
  });
});
