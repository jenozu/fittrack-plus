"""
Smart Coaching Router
API endpoints for AI-powered macro coaching and suggestions.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from models import User
from utils.auth import get_db, get_current_user
from services.smart_coach import (
    analyze_daily_intake,
    generate_food_suggestions,
    generate_encouragement,
    get_weekly_insights
)

router = APIRouter(prefix="/coaching", tags=["Smart Coaching"])


@router.get("/daily-analysis")
def get_daily_analysis(
    analysis_date: date = Query(default=None, description="Date to analyze (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analysis of daily food intake compared to goals.
    
    Returns:
    - Current intake vs targets
    - Remaining macros
    - Percentages achieved
    - Priority areas for attention
    """
    if not analysis_date:
        analysis_date = date.today()
    
    analysis = analyze_daily_intake(db, current_user, analysis_date)
    
    return analysis


@router.get("/suggestions")
def get_food_suggestions(
    analysis_date: date = Query(default=None, description="Date to analyze (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get smart food suggestions based on remaining macros.
    
    Returns:
    - Top 10 food suggestions
    - Reasons for each suggestion
    - Macro focus (protein, balanced, low-cal, etc.)
    """
    if not analysis_date:
        analysis_date = date.today()
    
    analysis = analyze_daily_intake(db, current_user, analysis_date)
    suggestions = generate_food_suggestions(db, analysis)
    
    return {
        'date': analysis_date.isoformat(),
        'suggestions': suggestions,
        'total_suggestions': len(suggestions),
        'based_on_remaining': analysis['remaining']
    }


@router.get("/encouragement")
def get_encouragement(
    analysis_date: date = Query(default=None, description="Date to analyze (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized encouragement and tips.
    
    Returns:
    - Positive messages based on progress
    - Helpful tips
    - Streak information
    """
    if not analysis_date:
        analysis_date = date.today()
    
    analysis = analyze_daily_intake(db, current_user, analysis_date)
    encouragement = generate_encouragement(db, current_user, analysis)
    
    return encouragement


@router.get("/weekly-insights")
def get_weekly_insights_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly insights and patterns.
    
    Returns:
    - Days logged this week
    - Average calories and macros
    - Goal achievement stats
    - Consistency score
    - Actionable insights
    """
    insights = get_weekly_insights(db, current_user)
    
    return insights


@router.get("/dashboard-summary")
def get_coaching_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a complete coaching summary for the dashboard.
    
    Combines:
    - Daily analysis
    - Top 3 food suggestions
    - Encouragement message
    """
    today = date.today()
    
    analysis = analyze_daily_intake(db, current_user, today)
    suggestions = generate_food_suggestions(db, analysis)
    encouragement = generate_encouragement(db, current_user, analysis)
    
    return {
        'analysis': analysis,
        'top_suggestions': suggestions[:3],
        'encouragement': encouragement,
        'timestamp': datetime.now().isoformat()
    }

