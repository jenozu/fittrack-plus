"""
Food Router
Handles food search, logging, and CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import date, datetime
from schemas.food_schemas import (
    FoodSearchResponse, FoodSearchResult, FoodEntryCreate, 
    FoodEntryUpdate, FoodEntryResponse
)
from models import User, FoodEntry, Streak
from utils.auth import get_db, get_current_user
from services.food_aggregator import FoodAggregator

router = APIRouter(prefix="/food", tags=["Food"])


@router.get("/search", response_model=FoodSearchResponse)
def search_food(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    db: Session = Depends(get_db)
):
    """
    Search for food items across all sources (internal DB + external APIs).
    
    Uses the Food Aggregation Layer to:
    1. Check internal food_master database first
    2. Query external APIs (Nutritionix, USDA) if needed
    3. Cache and normalize results
    """
    aggregator = FoodAggregator(db)
    results = aggregator.search_food(q, limit)
    
    return {
        "results": results,
        "total_count": len(results)
    }


@router.get("/barcode/{barcode}")
def search_by_barcode(
    barcode: str,
    db: Session = Depends(get_db)
):
    """
    Search for a food item by barcode/UPC.
    """
    aggregator = FoodAggregator(db)
    result = aggregator.search_by_barcode(barcode)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found for this barcode"
        )
    
    return result


@router.post("/entries", response_model=FoodEntryResponse, status_code=status.HTTP_201_CREATED)
def create_food_entry(
    entry_data: FoodEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a new food entry.
    
    Creates a food log entry and updates the user's streak if logging for today.
    """
    # Create food entry
    food_entry = FoodEntry(
        user_id=current_user.id,
        food_name=entry_data.food_name,
        brand_name=entry_data.brand_name,
        calories=entry_data.calories,
        protein_g=entry_data.protein_g,
        carbs_g=entry_data.carbs_g,
        fat_g=entry_data.fat_g,
        quantity=entry_data.quantity,
        unit=entry_data.unit,
        meal_type=entry_data.meal_type,
        entry_date=entry_data.entry_date,
        food_master_id=entry_data.food_master_id
    )
    
    db.add(food_entry)
    db.commit()
    db.refresh(food_entry)
    
    # Update streak if logging for today
    _update_streak(current_user.id, entry_data.entry_date, db)
    
    return food_entry


@router.get("/entries", response_model=List[FoodEntryResponse])
def get_food_entries(
    entry_date: date = Query(None, description="Filter by date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get food entries for the current user.
    Optionally filter by date.
    """
    query = db.query(FoodEntry).filter(FoodEntry.user_id == current_user.id)
    
    if entry_date:
        query = query.filter(FoodEntry.entry_date == entry_date)
    
    entries = query.order_by(FoodEntry.created_at.desc()).all()
    return entries


@router.get("/entries/{entry_id}", response_model=FoodEntryResponse)
def get_food_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific food entry by ID.
    """
    entry = db.query(FoodEntry).filter(
        and_(
            FoodEntry.id == entry_id,
            FoodEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food entry not found"
        )
    
    return entry


@router.put("/entries/{entry_id}", response_model=FoodEntryResponse)
def update_food_entry(
    entry_id: int,
    entry_data: FoodEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a food entry.
    """
    entry = db.query(FoodEntry).filter(
        and_(
            FoodEntry.id == entry_id,
            FoodEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food entry not found"
        )
    
    # Update only provided fields
    for field, value in entry_data.dict(exclude_unset=True).items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a food entry.
    """
    entry = db.query(FoodEntry).filter(
        and_(
            FoodEntry.id == entry_id,
            FoodEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food entry not found"
        )
    
    db.delete(entry)
    db.commit()
    
    return None


def _update_streak(user_id: int, entry_date: date, db: Session):
    """
    Update user's streak when they log food.
    """
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    
    if not streak:
        # Create streak if it doesn't exist
        streak = Streak(user_id=user_id, current_streak=0, longest_streak=0)
        db.add(streak)
    
    today = date.today()
    
    # Only update streak if logging for today or yesterday
    if entry_date == today:
        if streak.last_logged_date == today:
            # Already logged today, no change
            pass
        elif streak.last_logged_date == date.fromordinal(today.toordinal() - 1):
            # Logged yesterday, increment streak
            streak.current_streak += 1
            streak.last_logged_date = today
        else:
            # Gap in logging, reset streak
            streak.current_streak = 1
            streak.last_logged_date = today
        
        # Update longest streak if needed
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
        
        db.commit()


