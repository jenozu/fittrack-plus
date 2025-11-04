"""
Water Tracking Router
Handles water logging and hydration tracking.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import date, timedelta
from schemas.water_schemas import (
    WaterLogCreate, WaterLogUpdate, WaterLogResponse,
    WaterDailySummary, WaterGoalUpdate
)
from models import User, WaterLog
from utils.auth import get_db, get_current_user

router = APIRouter(prefix="/water", tags=["Water Tracking"])


@router.post("/", response_model=WaterLogResponse, status_code=status.HTTP_201_CREATED)
def log_water(
    water_data: WaterLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log water intake for a specific date.
    
    - Creates a new water log entry
    - Automatically converts between cups and ml
    - 1 cup = 236.588 ml
    """
    # Convert between cups and ml if only one is provided
    cups = water_data.cups
    ml = water_data.ml
    
    if ml is None:
        ml = cups * 236.588  # Convert cups to ml
    elif cups == 0:
        cups = ml / 236.588  # Convert ml to cups if cups not provided
    
    # Check if entry already exists for this date
    existing_entry = db.query(WaterLog).filter(
        and_(
            WaterLog.user_id == current_user.id,
            WaterLog.log_date == water_data.log_date
        )
    ).first()
    
    if existing_entry:
        # Add to existing entry
        existing_entry.cups += cups
        existing_entry.ml += ml
        db.commit()
        db.refresh(existing_entry)
        return existing_entry
    else:
        # Create new entry
        water_log = WaterLog(
            user_id=current_user.id,
            cups=cups,
            ml=ml,
            log_date=water_data.log_date
        )
        
        db.add(water_log)
        db.commit()
        db.refresh(water_log)
        
        return water_log


@router.get("/summary", response_model=WaterDailySummary)
def get_daily_water_summary(
    summary_date: date = Query(default=None, description="Date for summary (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get water intake summary for a specific date.
    
    Returns:
    - Total cups consumed
    - Total ml consumed
    - Goal vs actual
    - Percentage complete
    - Whether goal was achieved
    """
    if summary_date is None:
        summary_date = date.today()
    
    # Get water logs for the date
    water_logs = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.log_date == summary_date
    ).all()
    
    # Calculate totals
    total_cups = sum(log.cups for log in water_logs)
    total_ml = sum(log.ml for log in water_logs)
    
    # Get user's water goal
    goal_cups = current_user.water_goal_cups
    goal_ml = goal_cups * 236.588
    
    # Calculate percentage
    percentage_complete = (total_cups / goal_cups * 100) if goal_cups > 0 else 0
    goal_achieved = total_cups >= goal_cups
    
    return {
        "log_date": summary_date,
        "total_cups": round(total_cups, 2),
        "total_ml": round(total_ml, 2),
        "goal_cups": goal_cups,
        "goal_ml": round(goal_ml, 2),
        "percentage_complete": round(percentage_complete, 2),
        "goal_achieved": goal_achieved
    }


@router.get("/logs", response_model=List[WaterLogResponse])
def get_water_logs(
    start_date: date = Query(default=None, description="Start date for range"),
    end_date: date = Query(default=None, description="End date for range"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to fetch (if dates not specified)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get water log history.
    
    Can filter by:
    - Date range (start_date and end_date)
    - Last N days (days parameter)
    """
    if start_date and end_date:
        # Use provided date range
        pass
    else:
        # Use days parameter
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
    
    water_logs = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.log_date >= start_date,
        WaterLog.log_date <= end_date
    ).order_by(WaterLog.log_date.desc()).all()
    
    return water_logs


@router.get("/progress")
def get_water_progress(
    days: int = Query(default=7, ge=1, le=90, description="Number of days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get water intake progress over time for charts.
    
    Returns daily water consumption vs goal for the specified period.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    # Query water logs grouped by date
    water_data = db.query(
        WaterLog.log_date,
        func.sum(WaterLog.cups).label('total_cups'),
        func.sum(WaterLog.ml).label('total_ml')
    ).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.log_date >= start_date,
        WaterLog.log_date <= end_date
    ).group_by(WaterLog.log_date).all()
    
    # Convert to dictionary
    water_dict = {
        str(row.log_date): {
            "cups": row.total_cups,
            "ml": row.total_ml
        }
        for row in water_data
    }
    
    # Build complete dataset with all dates
    progress_data = []
    current_date = start_date
    goal_cups = current_user.water_goal_cups
    goal_ml = goal_cups * 236.588
    
    while current_date <= end_date:
        date_str = str(current_date)
        water = water_dict.get(date_str, {"cups": 0, "ml": 0})
        
        progress_data.append({
            "date": date_str,
            "cups": round(water["cups"], 2),
            "ml": round(water["ml"], 2),
            "goal_cups": goal_cups,
            "goal_ml": round(goal_ml, 2),
            "goal_achieved": water["cups"] >= goal_cups
        })
        current_date += timedelta(days=1)
    
    return {"data": progress_data}


@router.put("/goal", response_model=dict)
def update_water_goal(
    goal_data: WaterGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the user's daily water goal.
    """
    current_user.water_goal_cups = goal_data.water_goal_cups
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Water goal updated successfully",
        "water_goal_cups": current_user.water_goal_cups,
        "water_goal_ml": round(current_user.water_goal_cups * 236.588, 2)
    }


@router.get("/goal", response_model=dict)
def get_water_goal(
    current_user: User = Depends(get_current_user)
):
    """
    Get the user's current water goal.
    """
    return {
        "water_goal_cups": current_user.water_goal_cups,
        "water_goal_ml": round(current_user.water_goal_cups * 236.588, 2)
    }


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_water_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a water log entry.
    """
    water_log = db.query(WaterLog).filter(
        and_(
            WaterLog.id == log_id,
            WaterLog.user_id == current_user.id
        )
    ).first()
    
    if not water_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water log not found"
        )
    
    db.delete(water_log)
    db.commit()
    
    return None


@router.put("/{log_id}", response_model=WaterLogResponse)
def update_water_log(
    log_id: int,
    water_data: WaterLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a water log entry.
    """
    water_log = db.query(WaterLog).filter(
        and_(
            WaterLog.id == log_id,
            WaterLog.user_id == current_user.id
        )
    ).first()
    
    if not water_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Water log not found"
        )
    
    # Update fields
    if water_data.cups is not None:
        water_log.cups = water_data.cups
        water_log.ml = water_data.cups * 236.588
    
    if water_data.ml is not None:
        water_log.ml = water_data.ml
        if water_data.cups is None:  # Only recalculate cups if not explicitly set
            water_log.cups = water_data.ml / 236.588
    
    if water_data.log_date is not None:
        water_log.log_date = water_data.log_date
    
    db.commit()
    db.refresh(water_log)
    
    return water_log

