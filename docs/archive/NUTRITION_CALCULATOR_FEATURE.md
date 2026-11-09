# Automatic Nutrition Calculator Feature

## Overview
This feature automatically calculates personalized nutrition targets (calories and macros) based on user's physical stats and fitness goals, eliminating the guesswork for users who don't know their target macros.

## Changes Made

### 1. New Utility Module (`frontend/src/utils/nutritionCalculator.js`)

#### Calculation Methods
- **BMR (Basal Metabolic Rate)**: Uses the **Mifflin-St Jeor Equation**, which is one of the most accurate formulas for calculating BMR:
  - Male: `(10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5`
  - Female: `(10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161`
  - Other: Average of male and female calculations

- **TDEE (Total Daily Energy Expenditure)**: BMR × Activity Level Multiplier
  - Sedentary: 1.2 (little/no exercise)
  - Light: 1.375 (1-3 days/week)
  - Moderate: 1.55 (3-5 days/week)
  - Active: 1.725 (6-7 days/week)
  - Very Active: 1.9 (intense daily exercise)

- **Calorie Adjustments by Goal**:
  - **Lose Weight**: TDEE - 500 (≈1 lb/week loss)
  - **Body Recomposition**: TDEE - 200 (lose fat, gain muscle)
  - **Maintain Weight**: TDEE
  - **Lean Bulk**: TDEE + 300 (gain muscle, minimize fat)
  - **Bulk**: TDEE + 500 (maximize weight gain)

- **Macro Distribution**:
  - **Protein**: Goal-specific grams per kg of body weight
    - Fat loss: 2.0g/kg (preserve muscle during deficit)
    - Recomp: 2.2g/kg (high protein for muscle building)
    - Maintain: 1.8g/kg (standard maintenance)
    - Lean bulk: 2.0g/kg (support muscle growth)
    - Bulk: 1.8g/kg (standard bulk)
  
  - **Fat**: Goal-specific percentage of total calories (25-27%)
    - Fat provides 9 calories per gram
    - Essential for hormone production and vitamin absorption
  
  - **Carbs**: Remaining calories after protein and fat
    - Carbs provide 4 calories per gram
    - Primary energy source for workouts

### 2. Expanded Fitness Goals

#### Old Goals (3 options):
- Lose Weight
- Maintain Weight
- Gain Weight

#### New Goals (5 options):
- **Lose Weight (Fat Loss)**: Standard weight loss with muscle preservation
- **Lose Fat & Gain Muscle (Body Recomposition)**: For users who want both simultaneously
- **Maintain Weight**: Keep current weight
- **Gain Muscle (Lean Bulk)**: Controlled muscle gain with minimal fat
- **Gain Weight (Bulk)**: Faster weight gain for maximum muscle growth

### 3. Frontend Changes

#### Onboarding Form (`frontend/src/pages/Onboarding.jsx`)
- **Auto-calculation**: Automatically calculates nutrition targets when all required fields are filled
- **Real-time updates**: Uses React `useEffect` to recalculate when any relevant field changes
- **Visual preview**: Shows calculated targets on Step 3 with colored badges
- **Sends to backend**: Nutrition targets are sent with onboarding data

#### Profile Page (`frontend/src/pages/Profile.jsx`)
- **"Calculate for Me" button**: Added to Nutrition Targets card header (visible in edit mode)
- **Manual override**: Users can still manually edit calculated values
- **Helper tip**: Blue info box explains the calculate feature
- **Updated goal options**: Uses new expanded fitness goals

### 4. Backend Changes

#### Schema Updates (`backend/schemas/user_schemas.py`)
- **OnboardingData**: Now accepts optional nutrition targets from frontend
  - `target_calories`: Optional[int]
  - `target_protein_g`: Optional[float]
  - `target_carbs_g`: Optional[float]
  - `target_fat_g`: Optional[float]
- Updated comments to reflect new goal types

#### API Updates (`backend/routers/users.py`)
- **Onboarding endpoint**: 
  - Priority given to frontend-calculated values
  - Falls back to backend calculation if not provided
  - Supports both old and new goal type values for backward compatibility
- **Backend calculation updated**: Now handles all 5 new goal types

#### Model Updates (`backend/models.py`)
- Updated `goal_type` field comment to reflect new values

## Science Behind the Calculations

### Why These Formulas?
1. **Mifflin-St Jeor Equation**: Validated by multiple studies as more accurate than older formulas (Harris-Benedict)
2. **500 calorie deficit rule**: Based on the principle that 3,500 calories ≈ 1 pound of body weight
3. **High protein for cutting**: Research shows 1.8-2.2g/kg helps preserve muscle during calorie deficit
4. **Moderate surplus for lean gains**: 200-300 cal surplus minimizes fat gain while supporting muscle growth

### Macro Distribution Rationale
- **Protein**: Essential for muscle repair and growth. Higher amounts during deficit prevent muscle loss
- **Fat**: Critical for hormone production (especially testosterone). Below 20% can negatively impact health
- **Carbs**: Primary fuel for high-intensity exercise. Adjusted based on remaining calories

## User Experience

### For Users Who Don't Know Their Macros
1. Complete physical stats in onboarding
2. Select activity level and fitness goal
3. **Automatically see calculated targets** with explanation
4. Submit and start tracking

### For Advanced Users
1. Can see calculated recommendations
2. Can manually adjust if they have different preferences
3. Can recalculate anytime using "Calculate for Me" button

## Example Calculation

**User Profile:**
- Female, 28 years old
- Height: 165 cm (5'5")
- Current Weight: 70 kg (154 lbs)
- Activity Level: Moderate (3-5 days/week)
- Goal: Lose Fat & Gain Muscle (Recomp)

**Calculations:**
1. BMR = (10 × 70) + (6.25 × 165) - (5 × 28) - 161 = **1,470 calories**
2. TDEE = 1,470 × 1.55 = **2,279 calories**
3. Target Calories = 2,279 - 200 = **2,079 calories**
4. Protein = 70 × 2.2 = **154g** (616 cal)
5. Fat = 2,079 × 0.25 / 9 = **58g** (520 cal)
6. Carbs = (2,079 - 616 - 520) / 4 = **236g** (943 cal)

**Result:**
- 2,079 calories
- 154g protein
- 236g carbs
- 58g fat

## Benefits

1. **User-friendly**: No need for users to research or calculate macros
2. **Science-based**: Uses proven formulas and recommendations
3. **Personalized**: Accounts for individual stats and goals
4. **Flexible**: Users can still override with custom values
5. **Educational**: Shows the targets with explanation
6. **Comprehensive**: Supports various fitness goals including body recomposition

## Future Enhancements

Potential improvements:
- Add explanation tooltips for each goal type
- Include weekly weight change rate estimates
- Add goal timeline calculator (e.g., "reach goal weight by...")
- Integrate with progress tracking to auto-adjust targets
- Add preset macro splits (keto, low-carb, balanced, etc.)

