"""
Users Router
Handles user profile management and onboarding.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.user_schemas import UserResponse, UserProfileUpdate, OnboardingData
from models import User
from utils.auth import get_db, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile information.
    """
    # Update only provided fields
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/onboarding", response_model=UserResponse)
def complete_onboarding(
    onboarding_data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete user onboarding by setting fitness profile data.
    
    This endpoint is called after registration to collect:
    - Physical stats (height, weight, age, gender)
    - Fitness goals (lose/maintain/gain weight)
    - Activity level
    
    Also calculates recommended calorie and macro targets based on user data.
    """
    # Update user with onboarding data
    current_user.gender = onboarding_data.gender
    current_user.date_of_birth = onboarding_data.date_of_birth
    current_user.height_cm = onboarding_data.height_cm
    current_user.current_weight_kg = onboarding_data.current_weight_kg
    current_user.goal_weight_kg = onboarding_data.goal_weight_kg
    current_user.activity_level = onboarding_data.activity_level
    current_user.goal_type = onboarding_data.goal_type
    
    # Calculate target calories using basic formula
    # This is a simplified version - could be enhanced with more sophisticated algorithms
    target_calories = _calculate_target_calories(
        weight_kg=onboarding_data.current_weight_kg,
        height_cm=onboarding_data.height_cm,
        age=_calculate_age(onboarding_data.date_of_birth),
        gender=onboarding_data.gender,
        activity_level=onboarding_data.activity_level,
        goal_type=onboarding_data.goal_type
    )
    
    current_user.target_calories = target_calories
    
    # Calculate macro targets (simplified - 30% protein, 40% carbs, 30% fat)
    current_user.target_protein_g = (target_calories * 0.30) / 4  # 4 cal per gram
    current_user.target_carbs_g = (target_calories * 0.40) / 4
    current_user.target_fat_g = (target_calories * 0.30) / 9  # 9 cal per gram
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


def _calculate_age(date_of_birth) -> int:
    """Calculate age from date of birth"""
    from datetime import date
    today = date.today()
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )


def _calculate_target_calories(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
    goal_type: str
) -> int:
    """
    Calculate target daily calories using Mifflin-St Jeor Equation.
    
    BMR (Basal Metabolic Rate) calculation:
    - Men: 10 × weight(kg) + 6.25 × height(cm) − 5 × age(years) + 5
    - Women: 10 × weight(kg) + 6.25 × height(cm) − 5 × age(years) − 161
    
    Then multiply by activity factor and adjust for goals.
    """
    # Calculate BMR
    if gender.lower() in ["male", "m"]:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    
    # Activity multipliers
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    multiplier = activity_multipliers.get(activity_level, 1.2)
    tdee = bmr * multiplier  # Total Daily Energy Expenditure
    
    # Adjust for goals
    if goal_type == "lose":
        target = tdee - 500  # 500 calorie deficit for ~1 lb/week loss
    elif goal_type == "gain":
        target = tdee + 300  # 300 calorie surplus for muscle gain
    else:  # maintain
        target = tdee
    
    return int(target)


