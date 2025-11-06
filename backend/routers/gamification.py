"""
Gamification Router
API endpoints for badges, XP, and achievements.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models import User, Badge, UserBadge
from utils.auth import get_db, get_current_user
from services.gamification_service import (
    award_xp,
    check_and_award_badges,
    get_user_progress,
    XP_REWARDS
)

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/progress")
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's complete gamification progress.
    
    Returns:
    - XP and level info
    - Earned badges
    - Available badges with progress
    """
    progress = get_user_progress(db, current_user)
    return progress


@router.post("/check-badges")
def check_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check for newly earned badges and award them.
    
    Returns:
    - List of newly earned badges
    - Updated user progress
    """
    newly_earned = check_and_award_badges(db, current_user)
    progress = get_user_progress(db, current_user)
    
    return {
        'newly_earned_badges': newly_earned,
        'progress': progress
    }


@router.get("/badges")
def get_all_badges(
    db: Session = Depends(get_db)
):
    """
    Get all available badges in the system.
    
    Returns:
    - List of all badges with descriptions
    """
    badges = db.query(Badge).order_by(Badge.category, Badge.criteria_value).all()
    
    return {
        'badges': [{
            'id': badge.id,
            'slug': badge.slug,
            'name': badge.name,
            'description': badge.description,
            'icon': badge.icon,
            'category': badge.category,
            'xp_reward': badge.xp_reward,
            'criteria_type': badge.criteria_type,
            'criteria_value': badge.criteria_value
        } for badge in badges],
        'total_badges': len(badges)
    }


@router.get("/badges/earned")
def get_earned_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all badges earned by the current user.
    """
    user_badges = db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()
    
    earned = []
    for ub in user_badges:
        badge = db.query(Badge).filter(Badge.id == ub.badge_id).first()
        if badge:
            earned.append({
                'id': badge.id,
                'slug': badge.slug,
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon,
                'category': badge.category,
                'xp_reward': badge.xp_reward,
                'earned_at': ub.earned_at.isoformat()
            })
    
    return {
        'badges': earned,
        'total_earned': len(earned)
    }


@router.get("/leaderboard")
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get top users by level and XP (optional feature for future).
    
    Returns:
    - Top users ordered by level and XP
    """
    top_users = db.query(User).order_by(
        User.level.desc(),
        User.xp.desc()
    ).limit(limit).all()
    
    leaderboard = []
    for i, user in enumerate(top_users, 1):
        leaderboard.append({
            'rank': i,
            'user_id': user.id,
            'display_name': user.first_name or f"User{user.id}",
            'level': user.level,
            'xp': user.xp,
            'badge_count': len(user.badges)
        })
    
    return {
        'leaderboard': leaderboard,
        'total_users': limit
    }


@router.post("/award-xp")
def award_xp_manual(
    action: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Award XP for a specific action (internal use).
    
    Actions: food_logged, exercise_logged, water_goal_met, etc.
    """
    xp_amount = XP_REWARDS.get(action, 0)
    
    if xp_amount == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown action: {action}"
        )
    
    result = award_xp(db, current_user, xp_amount, action)
    
    # Check for new badges
    newly_earned = check_and_award_badges(db, current_user)
    
    return {
        **result,
        'newly_earned_badges': newly_earned
    }

