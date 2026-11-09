"""
Food Router
Handles food search, logging, and CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from schemas.food_schemas import (
    FoodOut, FoodEntryCreate,
    FoodEntryUpdate, FoodEntryResponse, FoodEntryDay
)
from services import nutrition
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


def _visible_food(db: Session, food_id: int, user_id: int):
    """get_food, but another user's custom food counts as missing."""
    food = food_service.get_food(db, food_id)
    if food and food["source"] == "custom":
        owner = db.query(Food.created_by_user).filter(Food.id == food_id).scalar()
        if owner != user_id:
            return None
    return food


def _bad(msg: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=msg)


def _grams_from(food: dict, grams, portion_label, quantity) -> tuple:
    """Return (grams, portion_label, quantity) from either grams or portion+quantity."""
    if grams is not None:
        return grams, "g", grams
    if portion_label:
        try:
            return nutrition.grams_for(food, portion_label, quantity or 1.0), portion_label, quantity or 1.0
        except ValueError as e:
            raise _bad(str(e))
    raise _bad("Provide grams or portion_label")


def _snapshot(entry: FoodEntry, food: dict, grams: float, portion_label: str, quantity: float) -> None:
    n = nutrition.scale(food, grams)
    entry.food_id = food["id"]
    entry.food_name = food["name"]
    entry.brand_name = food.get("brand")
    entry.grams, entry.portion_label, entry.quantity = grams, portion_label, quantity
    entry.unit = portion_label
    entry.calories = n["kcal"] or 0
    entry.protein_g, entry.carbs_g, entry.fat_g = n["protein"], n["carbs"], n["fat"]
    entry.fiber_g, entry.sugar_g, entry.sodium_mg = n["fiber"], n["sugar"], n["sodium_mg"]


def _owned_entry(db: Session, entry_id: int, user_id: int) -> FoodEntry:
    entry = db.query(FoodEntry).filter(FoodEntry.id == entry_id, FoodEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food entry not found")
    return entry


_TOTAL_FIELDS = ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg")


@router.post("/entries", response_model=FoodEntryResponse, status_code=status.HTTP_201_CREATED)
def create_food_entry(
    entry_data: FoodEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a food by grams or portion (food_id) or quick-add (name + calories); updates the streak."""
    entry = FoodEntry(user_id=current_user.id, meal_type=entry_data.meal_type, entry_date=entry_data.entry_date)
    if entry_data.food_id is not None:
        food = _visible_food(db, entry_data.food_id, current_user.id)
        if not food:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
        _snapshot(entry, food, *_grams_from(food, entry_data.grams, entry_data.portion_label, entry_data.quantity))
    else:
        if not entry_data.food_name or entry_data.calories is None:
            raise _bad("Provide food_id, or food_name and calories")
        entry.food_name = entry_data.food_name
        entry.brand_name = entry_data.brand_name
        entry.calories = entry_data.calories
        entry.protein_g, entry.carbs_g, entry.fat_g = entry_data.protein_g, entry_data.carbs_g, entry_data.fat_g
        entry.quantity, entry.unit = 1.0, "serving"

    db.add(entry)
    db.commit()
    db.refresh(entry)
    _update_streak(current_user.id, entry_data.entry_date, db)
    return entry


@router.get("/entries", response_model=FoodEntryDay)
def get_food_entries(
    entry_date: date = Query(None, description="Filter by date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Entries (newest first) plus per-meal and overall totals."""
    query = db.query(FoodEntry).filter(FoodEntry.user_id == current_user.id)
    if entry_date:
        query = query.filter(FoodEntry.entry_date == entry_date)
    entries = query.order_by(FoodEntry.created_at.desc()).all()

    totals = dict.fromkeys(_TOTAL_FIELDS, 0.0)
    meals: dict[str, dict] = {}
    for e in entries:
        meal = meals.setdefault(e.meal_type or "other", dict.fromkeys(_TOTAL_FIELDS, 0.0))
        for f in _TOTAL_FIELDS:
            v = getattr(e, f) or 0
            meal[f] += v
            totals[f] += v
    rnd = lambda d: {k: round(v, 2) for k, v in d.items()}
    return {"entries": entries, "meals": {k: rnd(v) for k, v in meals.items()}, "totals": rnd(totals)}


@router.get("/entries/{entry_id}", response_model=FoodEntryResponse)
def get_food_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific food entry by ID.
    """
    entry = _owned_entry(db, entry_id, current_user.id)
    
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
    entry = _owned_entry(db, entry_id, current_user.id)
    data = entry_data.dict(exclude_unset=True)
    grams, label, qty = data.pop("grams", None), data.pop("portion_label", None), data.pop("quantity", None)

    if grams is not None or label:
        food = _visible_food(db, entry.food_id, current_user.id) if entry.food_id else None
        if food:
            _snapshot(entry, food, *_grams_from(food, grams, label, qty))
        elif grams is not None and entry.grams:
            # food is gone (or quick-add with grams): scale the stored snapshot
            ratio = grams / entry.grams
            for f in _TOTAL_FIELDS:
                v = getattr(entry, f)
                if v is not None:
                    setattr(entry, f, round(v * ratio, 2))
            entry.grams, entry.portion_label, entry.quantity, entry.unit = grams, "g", grams, "g"
        else:
            raise _bad("Cannot change the amount of this entry")

    for field, value in data.items():
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
    entry = _owned_entry(db, entry_id, current_user.id)
    
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


