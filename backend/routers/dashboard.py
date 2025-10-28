"""
Dashboard Router
Provides daily summaries, progress data, streaks, and analytics.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, datetime, timedelta
from schemas.food_schemas import DailyNutritionSummary
from schemas.streak_schemas import StreakResponse, WeightLogCreate, WeightLogResponse
from models import User, FoodEntry, ExerciseEntry, Streak, WeightLog
from utils.auth import get_db, get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DailyNutritionSummary)
def get_daily_summary(
    summary_date: date = Query(default=None, description="Date for summary (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily nutrition summary including:
    - Total calories consumed
    - Total macros (protein, carbs, fat)
    - Calories burned from exercise
    - Calories remaining (Target - Consumed + Burned)
    - Progress toward macro goals
    """
    if summary_date is None:
        summary_date = date.today()
    
    # Get all food entries for the date
    food_entries = db.query(FoodEntry).filter(
        FoodEntry.user_id == current_user.id,
        FoodEntry.entry_date == summary_date
    ).all()
    
    # Calculate totals
    total_calories = sum(entry.calories for entry in food_entries)
    total_protein = sum(entry.protein_g for entry in food_entries)
    total_carbs = sum(entry.carbs_g for entry in food_entries)
    total_fat = sum(entry.fat_g for entry in food_entries)
    
    # Get exercise calories burned
    exercise_entries = db.query(ExerciseEntry).filter(
        ExerciseEntry.user_id == current_user.id,
        ExerciseEntry.entry_date == summary_date
    ).all()
    
    calories_burned = sum(entry.calories_burned for entry in exercise_entries)
    
    # Calculate calories remaining
    # Formula: Target - Consumed + Burned
    calories_remaining = current_user.target_calories - total_calories + calories_burned
    
    return {
        "date": summary_date,
        "total_calories": total_calories,
        "total_protein_g": total_protein,
        "total_carbs_g": total_carbs,
        "total_fat_g": total_fat,
        "calories_burned": calories_burned,
        "calories_remaining": calories_remaining,
        "target_calories": current_user.target_calories,
        "target_protein_g": current_user.target_protein_g,
        "target_carbs_g": current_user.target_carbs_g,
        "target_fat_g": current_user.target_fat_g,
        "food_entries_count": len(food_entries),
        "exercise_entries_count": len(exercise_entries)
    }


@router.get("/progress/calories")
def get_calorie_progress(
    days: int = Query(default=7, ge=1, le=90, description="Number of days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get calorie intake and burn data over time for progress charts.
    Returns daily data for the specified number of days.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    # Query food entries grouped by date
    food_data = db.query(
        FoodEntry.entry_date,
        func.sum(FoodEntry.calories).label('total_calories')
    ).filter(
        FoodEntry.user_id == current_user.id,
        FoodEntry.entry_date >= start_date,
        FoodEntry.entry_date <= end_date
    ).group_by(FoodEntry.entry_date).all()
    
    # Query exercise entries grouped by date
    exercise_data = db.query(
        ExerciseEntry.entry_date,
        func.sum(ExerciseEntry.calories_burned).label('total_burned')
    ).filter(
        ExerciseEntry.user_id == current_user.id,
        ExerciseEntry.entry_date >= start_date,
        ExerciseEntry.entry_date <= end_date
    ).group_by(ExerciseEntry.entry_date).all()
    
    # Convert to dictionaries for easy lookup
    food_dict = {str(row.entry_date): row.total_calories for row in food_data}
    exercise_dict = {str(row.entry_date): row.total_burned for row in exercise_data}
    
    # Build complete dataset with all dates
    progress_data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        consumed = food_dict.get(date_str, 0)
        burned = exercise_dict.get(date_str, 0)
        net = consumed - burned
        
        progress_data.append({
            "date": date_str,
            "calories_consumed": consumed,
            "calories_burned": burned,
            "net_calories": net,
            "target_calories": current_user.target_calories
        })
        current_date += timedelta(days=1)
    
    return {"data": progress_data}


@router.get("/progress/macros")
def get_macro_progress(
    days: int = Query(default=7, ge=1, le=90, description="Number of days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get macronutrient data over time for progress tracking.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    # Query macros grouped by date
    macro_data = db.query(
        FoodEntry.entry_date,
        func.sum(FoodEntry.protein_g).label('total_protein'),
        func.sum(FoodEntry.carbs_g).label('total_carbs'),
        func.sum(FoodEntry.fat_g).label('total_fat')
    ).filter(
        FoodEntry.user_id == current_user.id,
        FoodEntry.entry_date >= start_date,
        FoodEntry.entry_date <= end_date
    ).group_by(FoodEntry.entry_date).all()
    
    # Convert to dictionary
    macro_dict = {
        str(row.entry_date): {
            "protein": row.total_protein,
            "carbs": row.total_carbs,
            "fat": row.total_fat
        }
        for row in macro_data
    }
    
    # Build complete dataset
    progress_data = []
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        macros = macro_dict.get(date_str, {"protein": 0, "carbs": 0, "fat": 0})
        
        progress_data.append({
            "date": date_str,
            "protein_g": macros["protein"],
            "carbs_g": macros["carbs"],
            "fat_g": macros["fat"],
            "target_protein_g": current_user.target_protein_g,
            "target_carbs_g": current_user.target_carbs_g,
            "target_fat_g": current_user.target_fat_g
        })
        current_date += timedelta(days=1)
    
    return {"data": progress_data}


@router.get("/streak", response_model=StreakResponse)
def get_user_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the user's current logging streak.
    """
    streak = db.query(Streak).filter(Streak.user_id == current_user.id).first()
    
    if not streak:
        # Create a new streak record if it doesn't exist
        streak = Streak(
            user_id=current_user.id,
            current_streak=0,
            longest_streak=0,
            last_logged_date=None
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
    
    return streak


@router.post("/weight", response_model=WeightLogResponse)
def log_weight(
    weight_data: WeightLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a weight entry.
    """
    weight_log = WeightLog(
        user_id=current_user.id,
        weight_kg=weight_data.weight_kg,
        log_date=weight_data.log_date,
        notes=weight_data.notes
    )
    
    db.add(weight_log)
    
    # Also update current weight in user profile if logging for today
    if weight_data.log_date == date.today():
        current_user.current_weight_kg = weight_data.weight_kg
    
    db.commit()
    db.refresh(weight_log)
    
    return weight_log


@router.get("/weight", response_model=List[WeightLogResponse])
def get_weight_logs(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weight log history for progress tracking.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    weight_logs = db.query(WeightLog).filter(
        WeightLog.user_id == current_user.id,
        WeightLog.log_date >= start_date,
        WeightLog.log_date <= end_date
    ).order_by(WeightLog.log_date.asc()).all()
    
    return weight_logs


