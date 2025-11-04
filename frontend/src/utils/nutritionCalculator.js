/**
 * Nutrition Calculator Utilities
 * Calculates BMR, TDEE, and macro targets based on user data
 */

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,        // Little or no exercise
  light: 1.375,          // Light exercise 1-3 days/week
  moderate: 1.55,        // Moderate exercise 3-5 days/week
  active: 1.725,         // Active exercise 6-7 days/week
  very_active: 1.9,      // Very active (intense exercise daily)
};

// Goal-based calorie adjustments and macro ratios
const GOAL_CONFIGS = {
  lose_weight: {
    label: 'Lose Weight (Fat Loss)',
    calorieAdjustment: -500,  // 500 cal deficit for ~1 lb/week loss
    proteinPerKg: 2.0,         // Higher protein to preserve muscle
    fatPercentage: 25,         // 25% of calories from fat
  },
  recomp: {
    label: 'Lose Fat & Gain Muscle (Body Recomposition)',
    calorieAdjustment: -200,   // Small deficit
    proteinPerKg: 2.2,         // High protein for muscle building
    fatPercentage: 25,
  },
  maintain: {
    label: 'Maintain Weight',
    calorieAdjustment: 0,
    proteinPerKg: 1.8,
    fatPercentage: 27,
  },
  lean_bulk: {
    label: 'Gain Muscle (Lean Bulk)',
    calorieAdjustment: 300,    // Small surplus to minimize fat gain
    proteinPerKg: 2.0,
    fatPercentage: 25,
  },
  bulk: {
    label: 'Gain Weight (Bulk)',
    calorieAdjustment: 500,    // Larger surplus
    proteinPerKg: 1.8,
    fatPercentage: 27,
  },
};

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * @param {number} weight_kg - Weight in kilograms
 * @param {number} height_cm - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} gender - 'male' or 'female'
 * @returns {number} BMR in calories
 */
export const calculateBMR = (weight_kg, height_cm, age, gender) => {
  if (!weight_kg || !height_cm || !age || !gender) return 0;
  
  // Mifflin-St Jeor Equation
  // Male: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Female: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  
  const baseBMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
  
  if (gender === 'male') {
    return Math.round(baseBMR + 5);
  } else if (gender === 'female') {
    return Math.round(baseBMR - 161);
  } else {
    // For 'other', use average of male and female
    return Math.round(baseBMR - 78);
  }
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level key
 * @returns {number} TDEE in calories
 */
export const calculateTDEE = (bmr, activityLevel) => {
  if (!bmr || !activityLevel) return 0;
  
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calculate complete nutrition targets
 * @param {object} userData - User data object
 * @param {number} userData.weight_kg - Current weight in kg
 * @param {number} userData.height_cm - Height in cm
 * @param {string} userData.date_of_birth - Date of birth (YYYY-MM-DD)
 * @param {string} userData.gender - Gender
 * @param {string} userData.activity_level - Activity level
 * @param {string} userData.goal_type - Goal type
 * @returns {object} Nutrition targets
 */
export const calculateNutritionTargets = (userData) => {
  const {
    current_weight_kg,
    height_cm,
    date_of_birth,
    gender,
    activity_level,
    goal_type,
  } = userData;

  // Validate required fields
  if (!current_weight_kg || !height_cm || !date_of_birth || !gender || !activity_level || !goal_type) {
    return null;
  }

  // Calculate age
  const age = calculateAge(date_of_birth);
  if (age < 15 || age > 100) return null; // Sanity check

  // Calculate BMR
  const bmr = calculateBMR(current_weight_kg, height_cm, age, gender);

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, activity_level);

  // Get goal configuration
  const goalConfig = GOAL_CONFIGS[goal_type];
  if (!goalConfig) return null;

  // Calculate target calories
  const targetCalories = Math.round(tdee + goalConfig.calorieAdjustment);

  // Calculate macros
  // Protein: goal-specific grams per kg of body weight
  const proteinGrams = Math.round(current_weight_kg * goalConfig.proteinPerKg);
  const proteinCalories = proteinGrams * 4; // 4 calories per gram of protein

  // Fat: goal-specific percentage of total calories
  const fatCalories = Math.round(targetCalories * (goalConfig.fatPercentage / 100));
  const fatGrams = Math.round(fatCalories / 9); // 9 calories per gram of fat

  // Carbs: remaining calories
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(remainingCalories / 4); // 4 calories per gram of carbs

  return {
    target_calories: targetCalories,
    target_protein_g: proteinGrams,
    target_carbs_g: carbGrams,
    target_fat_g: fatGrams,
    bmr,
    tdee,
  };
};

/**
 * Get all goal type options
 * @returns {array} Array of goal options
 */
export const getGoalTypeOptions = () => {
  return Object.entries(GOAL_CONFIGS).map(([value, config]) => ({
    value,
    label: config.label,
  }));
};

export { GOAL_CONFIGS, ACTIVITY_MULTIPLIERS };

