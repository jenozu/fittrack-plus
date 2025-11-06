"""
Gamification Service
Handles XP, leveling, badges, and achievements.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Dict, Any
from models import User, Badge, UserBadge, Streak, FoodEntry


# XP rewards for actions
XP_REWARDS = {
    'food_logged': 10,
    'exercise_logged': 15,
    'water_goal_met': 20,
    'protein_goal_met': 25,
    'all_macros_met': 50,
    'streak_maintained': 30,
    'recipe_created': 40,
    'measurement_logged': 20,
    'badge_earned': 100,
}

# XP required for each level
def get_xp_for_level(level: int) -> int:
    """Calculate XP required to reach a level (cumulative)."""
    return level * 100  # Level 1 = 100 XP, Level 2 = 200 XP, etc.


def award_xp(db: Session, user: User, xp_amount: int, reason: str = None) -> Dict[str, Any]:
    """
    Award XP to a user and check for level up.
    
    Args:
        db: Database session
        user: User object
        xp_amount: Amount of XP to award
        reason: Reason for XP award
    
    Returns:
        Dict with XP info and whether user leveled up
    """
    old_level = user.level
    user.xp += xp_amount
    
    # Check for level up
    new_level = calculate_level_from_xp(user.xp)
    leveled_up = new_level > old_level
    
    if leveled_up:
        user.level = new_level
    
    db.commit()
    db.refresh(user)
    
    return {
        'xp_awarded': xp_amount,
        'total_xp': user.xp,
        'level': user.level,
        'leveled_up': leveled_up,
        'old_level': old_level,
        'reason': reason,
        'xp_to_next_level': get_xp_for_level(user.level + 1) - user.xp
    }


def calculate_level_from_xp(xp: int) -> int:
    """Calculate level based on total XP."""
    level = 1
    while get_xp_for_level(level) <= xp:
        level += 1
    return level - 1


def check_and_award_badges(db: Session, user: User) -> List[Dict[str, Any]]:
    """
    Check if user has earned any new badges and award them.
    
    Args:
        db: Database session
        user: User object
    
    Returns:
        List of newly earned badges
    """
    # Get all badges user hasn't earned yet
    earned_badge_ids = [ub.badge_id for ub in user.badges]
    available_badges = db.query(Badge).filter(Badge.id.notin_(earned_badge_ids)).all()
    
    newly_earned = []
    
    for badge in available_badges:
        if check_badge_criteria(db, user, badge):
            # Award badge
            user_badge = UserBadge(
                user_id=user.id,
                badge_id=badge.id
            )
            db.add(user_badge)
            
            # Award XP for earning badge
            award_xp(db, user, badge.xp_reward, f"Earned badge: {badge.name}")
            
            newly_earned.append({
                'id': badge.id,
                'slug': badge.slug,
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon,
                'xp_reward': badge.xp_reward
            })
    
    if newly_earned:
        db.commit()
    
    return newly_earned


def check_badge_criteria(db: Session, user: User, badge: Badge) -> bool:
    """
    Check if user meets criteria for a badge.
    
    Args:
        db: Database session
        user: User object
        badge: Badge object
    
    Returns:
        True if criteria met, False otherwise
    """
    criteria_type = badge.criteria_type
    criteria_value = badge.criteria_value
    
    if criteria_type == 'streak_days':
        streak = db.query(Streak).filter(Streak.user_id == user.id).first()
        return streak and streak.current_streak >= criteria_value
    
    elif criteria_type == 'total_entries':
        total_entries = db.query(FoodEntry).filter(FoodEntry.user_id == user.id).count()
        return total_entries >= criteria_value
    
    elif criteria_type == 'days_logged':
        unique_days = db.query(func.count(func.distinct(FoodEntry.entry_date))).filter(
            FoodEntry.user_id == user.id
        ).scalar()
        return unique_days >= criteria_value
    
    elif criteria_type == 'level_reached':
        return user.level >= criteria_value
    
    elif criteria_type == 'recipes_created':
        from models import Recipe
        recipe_count = db.query(Recipe).filter(Recipe.user_id == user.id).count()
        return recipe_count >= criteria_value
    
    elif criteria_type == 'measurements_logged':
        from models import BodyMeasurement
        measurement_count = db.query(BodyMeasurement).filter(
            BodyMeasurement.user_id == user.id
        ).count()
        return measurement_count >= criteria_value
    
    return False


def initialize_default_badges(db: Session):
    """
    Initialize default badge definitions.
    Should be run once during app setup.
    """
    default_badges = [
        # Streak Badges
        {'slug': 'streak_3', 'name': 'Three-Day Triumph', 'description': 'Logged food for 3 days in a row', 
         'icon': '🔥', 'category': 'streak', 'criteria_type': 'streak_days', 'criteria_value': 3, 'xp_reward': 50},
        {'slug': 'streak_7', 'name': 'Week Warrior', 'description': 'Maintained a 7-day streak', 
         'icon': '⭐', 'category': 'streak', 'criteria_type': 'streak_days', 'criteria_value': 7, 'xp_reward': 100},
        {'slug': 'streak_30', 'name': 'Month Master', 'description': 'Logged for 30 days straight', 
         'icon': '👑', 'category': 'streak', 'criteria_type': 'streak_days', 'criteria_value': 30, 'xp_reward': 500},
        
        # Consistency Badges
        {'slug': 'days_10', 'name': 'Getting Started', 'description': 'Logged food for 10 different days', 
         'icon': '🌱', 'category': 'consistency', 'criteria_type': 'days_logged', 'criteria_value': 10, 'xp_reward': 75},
        {'slug': 'days_30', 'name': 'Consistency King', 'description': 'Logged food for 30 different days', 
         'icon': '🎖️', 'category': 'consistency', 'criteria_type': 'days_logged', 'criteria_value': 30, 'xp_reward': 200},
        {'slug': 'days_100', 'name': 'Century Club', 'description': 'Logged food for 100 days', 
         'icon': '💯', 'category': 'consistency', 'criteria_type': 'days_logged', 'criteria_value': 100, 'xp_reward': 1000},
        
        # Entry Milestones
        {'slug': 'entries_50', 'name': 'Food Logger', 'description': 'Logged 50 food entries', 
         'icon': '📝', 'category': 'milestone', 'criteria_type': 'total_entries', 'criteria_value': 50, 'xp_reward': 100},
        {'slug': 'entries_100', 'name': 'Tracking Pro', 'description': 'Logged 100 food entries', 
         'icon': '📊', 'category': 'milestone', 'criteria_type': 'total_entries', 'criteria_value': 100, 'xp_reward': 200},
        {'slug': 'entries_500', 'name': 'Logging Legend', 'description': 'Logged 500 food entries', 
         'icon': '🏆', 'category': 'milestone', 'criteria_type': 'total_entries', 'criteria_value': 500, 'xp_reward': 1000},
        
        # Recipe Badges
        {'slug': 'recipes_1', 'name': 'Recipe Creator', 'description': 'Created your first recipe', 
         'icon': '👨‍🍳', 'category': 'recipes', 'criteria_type': 'recipes_created', 'criteria_value': 1, 'xp_reward': 50},
        {'slug': 'recipes_10', 'name': 'Master Chef', 'description': 'Created 10 recipes', 
         'icon': '🍳', 'category': 'recipes', 'criteria_type': 'recipes_created', 'criteria_value': 10, 'xp_reward': 300},
        
        # Measurement Badges
        {'slug': 'measurements_1', 'name': 'Body Tracker', 'description': 'Logged your first body measurement', 
         'icon': '📏', 'category': 'measurements', 'criteria_type': 'measurements_logged', 'criteria_value': 1, 'xp_reward': 50},
        {'slug': 'measurements_10', 'name': 'Progress Tracker', 'description': 'Logged 10 body measurements', 
         'icon': '📐', 'category': 'measurements', 'criteria_type': 'measurements_logged', 'criteria_value': 10, 'xp_reward': 200},
        
        # Level Badges
        {'slug': 'level_5', 'name': 'Rising Star', 'description': 'Reached level 5', 
         'icon': '⭐', 'category': 'level', 'criteria_type': 'level_reached', 'criteria_value': 5, 'xp_reward': 0},
        {'slug': 'level_10', 'name': 'Elite Tracker', 'description': 'Reached level 10', 
         'icon': '🌟', 'category': 'level', 'criteria_type': 'level_reached', 'criteria_value': 10, 'xp_reward': 0},
        {'slug': 'level_25', 'name': 'FitTrack Master', 'description': 'Reached level 25', 
         'icon': '💎', 'category': 'level', 'criteria_type': 'level_reached', 'criteria_value': 25, 'xp_reward': 0},
    ]
    
    for badge_data in default_badges:
        # Check if badge already exists
        existing = db.query(Badge).filter(Badge.slug == badge_data['slug']).first()
        if not existing:
            badge = Badge(**badge_data)
            db.add(badge)
    
    db.commit()


def get_user_progress(db: Session, user: User) -> Dict[str, Any]:
    """
    Get comprehensive gamification progress for a user.
    
    Returns:
    - Current XP and level
    - XP to next level
    - Earned badges
    - Available badges to earn
    - Recent achievements
    """
    # XP and level info
    xp_to_next = get_xp_for_level(user.level + 1) - user.xp
    xp_progress = (user.xp - get_xp_for_level(user.level)) / (get_xp_for_level(user.level + 1) - get_xp_for_level(user.level)) * 100
    
    # Earned badges
    earned_badges = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    earned_badge_data = []
    for ub in earned_badges:
        badge = db.query(Badge).filter(Badge.id == ub.badge_id).first()
        if badge:
            earned_badge_data.append({
                'id': badge.id,
                'slug': badge.slug,
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon,
                'category': badge.category,
                'earned_at': ub.earned_at.isoformat()
            })
    
    # Available badges (not yet earned)
    earned_badge_ids = [ub.badge_id for ub in earned_badges]
    available_badges = db.query(Badge).filter(Badge.id.notin_(earned_badge_ids) if earned_badge_ids else True).limit(10).all()
    available_badge_data = []
    for badge in available_badges:
        progress = calculate_badge_progress(db, user, badge)
        available_badge_data.append({
            'id': badge.id,
            'slug': badge.slug,
            'name': badge.name,
            'description': badge.description,
            'icon': badge.icon,
            'category': badge.category,
            'xp_reward': badge.xp_reward,
            'progress': progress
        })
    
    return {
        'xp': user.xp,
        'level': user.level,
        'xp_to_next_level': xp_to_next,
        'xp_progress_percentage': round(xp_progress, 1),
        'total_badges_earned': len(earned_badges),
        'earned_badges': earned_badge_data,
        'available_badges': available_badge_data
    }


def calculate_badge_progress(db: Session, user: User, badge: Badge) -> Dict[str, Any]:
    """
    Calculate progress toward earning a badge.
    
    Returns:
    - current: Current value
    - required: Required value
    - percentage: Progress percentage
    """
    criteria_type = badge.criteria_type
    criteria_value = badge.criteria_value
    current = 0
    
    if criteria_type == 'streak_days':
        streak = db.query(Streak).filter(Streak.user_id == user.id).first()
        current = streak.current_streak if streak else 0
    
    elif criteria_type == 'total_entries':
        current = db.query(FoodEntry).filter(FoodEntry.user_id == user.id).count()
    
    elif criteria_type == 'days_logged':
        current = db.query(func.count(func.distinct(FoodEntry.entry_date))).filter(
            FoodEntry.user_id == user.id
        ).scalar()
    
    elif criteria_type == 'level_reached':
        current = user.level
    
    elif criteria_type == 'recipes_created':
        from models import Recipe
        current = db.query(Recipe).filter(Recipe.user_id == user.id).count()
    
    elif criteria_type == 'measurements_logged':
        from models import BodyMeasurement
        current = db.query(BodyMeasurement).filter(BodyMeasurement.user_id == user.id).count()
    
    percentage = min((current / criteria_value) * 100, 100) if criteria_value > 0 else 0
    
    return {
        'current': current,
        'required': criteria_value,
        'percentage': round(percentage, 1)
    }

