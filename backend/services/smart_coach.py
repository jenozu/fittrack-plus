"""
Smart Macro Coaching Service
Provides intelligent coaching, food suggestions, and encouragement.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from models import User, FoodEntry, FoodMaster


def analyze_daily_intake(db: Session, user: User, analysis_date: date) -> Dict[str, Any]:
    """
    Analyze user's daily food intake and compare to goals.
    
    Args:
        db: Database session
        user: User object
        analysis_date: Date to analyze
    
    Returns:
        Dict with analysis results and shortfalls/overages
    """
    # Get all food entries for the day
    entries = db.query(FoodEntry).filter(
        FoodEntry.user_id == user.id,
        FoodEntry.entry_date == analysis_date
    ).all()
    
    # Calculate totals
    total_calories = sum(e.calories for e in entries)
    total_protein = sum(e.protein_g for e in entries)
    total_carbs = sum(e.carbs_g for e in entries)
    total_fat = sum(e.fat_g for e in entries)
    
    # Calculate remaining
    calories_remaining = user.target_calories - total_calories
    protein_remaining = user.target_protein_g - total_protein
    carbs_remaining = user.target_carbs_g - total_carbs
    fat_remaining = user.target_fat_g - total_fat
    
    # Calculate percentages
    calories_pct = (total_calories / user.target_calories * 100) if user.target_calories > 0 else 0
    protein_pct = (total_protein / user.target_protein_g * 100) if user.target_protein_g > 0 else 0
    carbs_pct = (total_carbs / user.target_carbs_g * 100) if user.target_carbs_g > 0 else 0
    fat_pct = (total_fat / user.target_fat_g * 100) if user.target_fat_g > 0 else 0
    
    # Identify priorities (what needs most attention)
    priorities = []
    
    if protein_pct < 50:
        priorities.append({
            'macro': 'protein',
            'status': 'critically_low',
            'remaining': protein_remaining,
            'percentage': protein_pct
        })
    elif protein_pct < 80:
        priorities.append({
            'macro': 'protein',
            'status': 'low',
            'remaining': protein_remaining,
            'percentage': protein_pct
        })
    
    if calories_remaining < 0:
        priorities.append({
            'macro': 'calories',
            'status': 'over',
            'remaining': calories_remaining,
            'percentage': calories_pct
        })
    elif calories_remaining > user.target_calories * 0.5:
        priorities.append({
            'macro': 'calories',
            'status': 'very_low',
            'remaining': calories_remaining,
            'percentage': calories_pct
        })
    
    return {
        'date': analysis_date.isoformat(),
        'current': {
            'calories': round(total_calories, 1),
            'protein_g': round(total_protein, 1),
            'carbs_g': round(total_carbs, 1),
            'fat_g': round(total_fat, 1),
        },
        'targets': {
            'calories': user.target_calories,
            'protein_g': user.target_protein_g,
            'carbs_g': user.target_carbs_g,
            'fat_g': user.target_fat_g,
        },
        'remaining': {
            'calories': round(calories_remaining, 1),
            'protein_g': round(protein_remaining, 1),
            'carbs_g': round(carbs_remaining, 1),
            'fat_g': round(fat_remaining, 1),
        },
        'percentages': {
            'calories': round(calories_pct, 1),
            'protein': round(protein_pct, 1),
            'carbs': round(carbs_pct, 1),
            'fat': round(fat_pct, 1),
        },
        'priorities': priorities,
        'entries_count': len(entries)
    }


def generate_food_suggestions(db: Session, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate smart food suggestions based on remaining macros.
    
    Args:
        db: Database session
        analysis: Daily intake analysis
    
    Returns:
        List of suggested foods with reasons
    """
    suggestions = []
    remaining = analysis['remaining']
    
    # Check if we need high protein foods
    if remaining['protein_g'] > 10:
        high_protein_foods = db.query(FoodMaster).filter(
            FoodMaster.protein_g >= 20,
            FoodMaster.calories <= 300
        ).order_by(
            (FoodMaster.protein_g / FoodMaster.calories).desc()
        ).limit(5).all()
        
        for food in high_protein_foods:
            suggestions.append({
                'food': {
                    'id': food.id,
                    'name': food.food_name,
                    'brand': food.brand_name,
                    'calories': food.calories,
                    'protein_g': food.protein_g,
                    'carbs_g': food.carbs_g,
                    'fat_g': food.fat_g,
                    'serving_qty': food.serving_qty,
                    'serving_unit': food.serving_unit,
                },
                'reason': f'High in protein ({food.protein_g}g per serving)',
                'priority': 'high',
                'macro_focus': 'protein'
            })
    
    # Check if we need more calories but staying light
    if remaining['calories'] > 200 and remaining['calories'] < 500:
        moderate_foods = db.query(FoodMaster).filter(
            FoodMaster.calories >= 150,
            FoodMaster.calories <= 300,
            FoodMaster.protein_g >= 10
        ).order_by(func.random()).limit(5).all()
        
        for food in moderate_foods:
            suggestions.append({
                'food': {
                    'id': food.id,
                    'name': food.food_name,
                    'brand': food.brand_name,
                    'calories': food.calories,
                    'protein_g': food.protein_g,
                    'carbs_g': food.carbs_g,
                    'fat_g': food.fat_g,
                    'serving_qty': food.serving_qty,
                    'serving_unit': food.serving_unit,
                },
                'reason': f'Balanced snack ({food.calories} cal, {food.protein_g}g protein)',
                'priority': 'medium',
                'macro_focus': 'balanced'
            })
    
    # If over calories, suggest low-cal high-protein options
    if remaining['calories'] < 0 and remaining['protein_g'] > 0:
        lean_foods = db.query(FoodMaster).filter(
            FoodMaster.calories <= 150,
            FoodMaster.protein_g >= 15
        ).order_by(FoodMaster.calories).limit(5).all()
        
        for food in lean_foods:
            suggestions.append({
                'food': {
                    'id': food.id,
                    'name': food.food_name,
                    'brand': food.brand_name,
                    'calories': food.calories,
                    'protein_g': food.protein_g,
                    'carbs_g': food.carbs_g,
                    'fat_g': food.fat_g,
                    'serving_qty': food.serving_qty,
                    'serving_unit': food.serving_unit,
                },
                'reason': f'Low calorie but high protein ({food.calories} cal)',
                'priority': 'high',
                'macro_focus': 'protein'
            })
    
    return suggestions[:10]  # Return top 10


def generate_encouragement(db: Session, user: User, analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate encouraging messages based on user progress.
    
    Args:
        db: Database session
        user: User object
        analysis: Daily intake analysis
    
    Returns:
        Dict with encouragement message and tips
    """
    from models import Streak
    
    # Get streak info
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    
    messages = []
    tips = []
    
    # Check protein goals
    protein_pct = analysis['percentages']['protein']
    if protein_pct >= 90:
        messages.append("💪 Crushing your protein goal today!")
    elif protein_pct >= 70:
        messages.append("👍 You're on track with protein!")
    elif protein_pct < 50:
        tips.append("Try to include protein with each meal")
    
    # Check overall progress
    calories_pct = analysis['percentages']['calories']
    if 80 <= calories_pct <= 110:
        messages.append("🎯 Perfect calorie balance!")
    elif calories_pct < 50:
        messages.append("🍽️ Don't forget to eat enough!")
    elif calories_pct > 120:
        tips.append("You're over your calorie goal - try lighter options")
    
    # Streak encouragement
    if streak and streak.current_streak > 0:
        if streak.current_streak >= 7:
            messages.append(f"🔥 Amazing {streak.current_streak} day streak!")
        elif streak.current_streak >= 3:
            messages.append(f"⭐ {streak.current_streak} days strong!")
    
    # Default encouragement if no specific messages
    if not messages:
        messages.append("Keep going! Every meal logged is progress! 💪")
    
    # Default tips
    if not tips:
        if analysis['remaining']['protein_g'] > 20:
            tips.append("Add a protein shake or Greek yogurt to hit your protein goal")
        if analysis['remaining']['calories'] > 300:
            tips.append("You have room for a good-sized meal or snack")
    
    return {
        'messages': messages,
        'tips': tips,
        'streak_days': streak.current_streak if streak else 0,
        'overall_sentiment': 'positive' if protein_pct >= 70 and 80 <= calories_pct <= 110 else 'encouraging'
    }


def get_weekly_insights(db: Session, user: User) -> Dict[str, Any]:
    """
    Generate weekly insights and patterns.
    
    Args:
        db: Database session
        user: User object
    
    Returns:
        Dict with weekly statistics and insights
    """
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    # Get last 7 days of entries
    entries = db.query(FoodEntry).filter(
        FoodEntry.user_id == user.id,
        FoodEntry.entry_date >= week_ago,
        FoodEntry.entry_date <= today
    ).all()
    
    if not entries:
        return {
            'days_logged': 0,
            'message': 'Start logging to see weekly insights!'
        }
    
    # Group by date
    daily_totals = {}
    for entry in entries:
        date_key = entry.entry_date.isoformat()
        if date_key not in daily_totals:
            daily_totals[date_key] = {
                'calories': 0,
                'protein_g': 0,
                'entries': 0
            }
        daily_totals[date_key]['calories'] += entry.calories
        daily_totals[date_key]['protein_g'] += entry.protein_g
        daily_totals[date_key]['entries'] += 1
    
    days_logged = len(daily_totals)
    avg_calories = sum(d['calories'] for d in daily_totals.values()) / days_logged if days_logged > 0 else 0
    avg_protein = sum(d['protein_g'] for d in daily_totals.values()) / days_logged if days_logged > 0 else 0
    
    # Calculate how many days hit protein goal
    protein_goal_days = sum(1 for d in daily_totals.values() if d['protein_g'] >= user.target_protein_g * 0.9)
    
    insights = []
    if protein_goal_days >= 5:
        insights.append(f"🎉 You hit your protein goal {protein_goal_days}/7 days!")
    elif protein_goal_days >= 3:
        insights.append(f"💪 {protein_goal_days} days of good protein intake this week")
    
    if avg_calories > user.target_calories * 1.1:
        insights.append("📊 You've been slightly over your calorie goal this week")
    elif avg_calories < user.target_calories * 0.8:
        insights.append("📊 You've been under your calorie goal - make sure you're eating enough")
    else:
        insights.append("✅ Great calorie consistency this week!")
    
    return {
        'days_logged': days_logged,
        'avg_calories': round(avg_calories, 1),
        'avg_protein': round(avg_protein, 1),
        'protein_goal_days': protein_goal_days,
        'insights': insights,
        'consistency_score': round((days_logged / 7) * 100, 1)
    }

