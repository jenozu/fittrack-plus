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
    FoodOut, FoodEntryCreate,
    FoodEntryUpdate, FoodEntryResponse
)
from models import User, FoodEntry, Streak, Food
from utils.auth import get_db, get_current_user
from food_data import service as food_service

router = APIRouter(prefix="/food", tags=["Food"])


@router.get("/search", response_model=List[FoodOut])
def search_food(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search the local food database (plus the user's own custom foods)."""
    return food_service.search_foods(db, q, limit, current_user.id)


@router.get("/barcode/{barcode}", response_model=FoodOut)
def search_by_barcode(
    barcode: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Look up a barcode: local database first, then one live Open Food Facts call."""
    result = food_service.lookup_barcode(db, barcode, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food item not found for this barcode"
        )
    return result


@router.get("/{food_id:int}", response_model=FoodOut)
def get_food(
    food_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    food = food_service.get_food(db, food_id)
    created_by = db.query(Food.created_by_user).filter(Food.id == food_id).scalar() if food else None
    if not food or (food["source"] == "custom" and created_by != current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    return food


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


