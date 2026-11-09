"""
Food Router
Handles food search, logging, and CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from uuid import uuid4
from sqlalchemy import text
from schemas.food_schemas import (
    FoodOut, FoodEntryCreate, CustomFoodIn,
    FoodEntryUpdate, FoodEntryResponse, FoodEntryDay, FoodUsageOut, EntryCopyIn
)
from services import nutrition
from models import User, FoodEntry, Streak, Food
from utils.auth import get_db, get_current_user
from food_data import service as food_service
from food_data.common import normalize_barcode

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


def _usage(db: Session, user_id: int, rows) -> list:
    out = []
    for r in rows:
        food = _visible_food(db, r.food_id, user_id)
        if food:
            out.append({"food": food, "grams": r.grams, "portion_label": r.portion_label,
                        "quantity": r.quantity, "times_logged": getattr(r, "times_logged", None)})
    return out


@router.get("/recent", response_model=List[FoodUsageOut])
def recent_foods(limit: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    """Distinct foods by most recent entry, with the last amount used."""
    rows = db.execute(text("""
        SELECT * FROM (
            SELECT DISTINCT ON (food_id) food_id, grams, portion_label, quantity, created_at, id
            FROM food_entries WHERE user_id = :u AND food_id IS NOT NULL
            ORDER BY food_id, created_at DESC, id DESC
        ) t ORDER BY created_at DESC, id DESC LIMIT :n"""), {"u": current_user.id, "n": limit}).fetchall()
    return _usage(db, current_user.id, rows)


@router.get("/frequent", response_model=List[FoodUsageOut])
def frequent_foods(limit: int = Query(20, ge=1, le=100), days: int = Query(60, ge=1, le=3650),
                   current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Most-logged foods in the last `days` days, with the last amount used."""
    rows = db.execute(text("""
        SELECT c.food_id, c.times_logged, l.grams, l.portion_label, l.quantity FROM (
            SELECT food_id, COUNT(*) AS times_logged, MAX(created_at) AS last_at
            FROM food_entries
            WHERE user_id = :u AND food_id IS NOT NULL AND entry_date >= CURRENT_DATE - :d
            GROUP BY food_id) c
        JOIN LATERAL (
            SELECT grams, portion_label, quantity FROM food_entries
            WHERE user_id = :u AND food_id = c.food_id ORDER BY created_at DESC, id DESC LIMIT 1) l ON TRUE
        ORDER BY c.times_logged DESC, c.last_at DESC LIMIT :n"""),
        {"u": current_user.id, "d": days, "n": limit}).fetchall()
    return _usage(db, current_user.id, rows)


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


_CUSTOM_COLS = ("name", "brand", "barcode", "kcal_100g", "protein_100g", "carbs_100g", "fat_100g",
                "fiber_100g", "sugar_100g", "sodium_mg_100g", "serving_g", "serving_label")


def _custom_values(d: CustomFoodIn) -> dict:
    """Request body -> foods columns (per 100 g)."""
    if d.basis == "serving":
        if not d.serving_g:
            raise _bad("serving_g is required when basis is 'serving'")
        k = 100 / d.serving_g
    else:
        k = 1
    scale = lambda v: None if v is None else round(v * k, 2)
    return dict(
        name=d.name.strip(), brand=d.brand, barcode=normalize_barcode(d.barcode),
        kcal_100g=scale(d.kcal), protein_100g=scale(d.protein), carbs_100g=scale(d.carbs),
        fat_100g=scale(d.fat), fiber_100g=scale(d.fiber), sugar_100g=scale(d.sugar),
        sodium_mg_100g=scale(d.sodium_mg), serving_g=d.serving_g,
        serving_label=(d.serving_label or "1 serving") if d.serving_g else None,
    )


def _set_portion(db: Session, food_id: int, serving_g, label) -> None:
    db.execute(text("DELETE FROM food_portions WHERE food_id = :f"), {"f": food_id})
    if serving_g:
        db.execute(text("INSERT INTO food_portions (food_id, label, grams) VALUES (:f, :l, :g)"),
                   {"f": food_id, "l": label, "g": serving_g})


def _insert_custom(db: Session, user_id: int, v: dict) -> dict:
    cols = ", ".join(_CUSTOM_COLS)
    binds = ", ".join(":" + c for c in _CUSTOM_COLS)
    food_id = db.execute(
        text(f"INSERT INTO foods (source, source_id, created_by_user, {cols}) "
             f"VALUES ('custom', :sid, :uid, {binds}) RETURNING id"),
        {**v, "sid": f"u{user_id}-{uuid4().hex[:12]}", "uid": user_id},
    ).scalar_one()
    _set_portion(db, food_id, v["serving_g"], v["serving_label"])
    db.commit()
    return food_service.get_food(db, food_id)


def _own_custom(db: Session, food_id: int, user_id: int) -> None:
    owner = db.execute(
        text("SELECT created_by_user FROM foods WHERE id = :id AND source = 'custom'"), {"id": food_id}
    ).fetchone()
    if not owner or owner[0] != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")


@router.post("/custom", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
def create_custom_food(body: CustomFoodIn, current_user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    return _insert_custom(db, current_user.id, _custom_values(body))


@router.put("/custom/{food_id:int}", response_model=FoodOut)
def update_custom_food(food_id: int, body: CustomFoodIn, current_user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    _own_custom(db, food_id, current_user.id)
    v = _custom_values(body)
    sets = ", ".join(f"{c} = :{c}" for c in _CUSTOM_COLS)
    db.execute(text(f"UPDATE foods SET {sets}, updated_at = now() WHERE id = :id"), {**v, "id": food_id})
    _set_portion(db, food_id, v["serving_g"], v["serving_label"])
    db.commit()
    return food_service.get_food(db, food_id)


@router.delete("/custom/{food_id:int}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_food(food_id: int, current_user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    _own_custom(db, food_id, current_user.id)
    db.execute(text("DELETE FROM foods WHERE id = :id"), {"id": food_id})  # FK nulls food_entries.food_id
    db.commit()
    return None


@router.post("/{food_id:int}/copy", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
def copy_food(food_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Editable private copy of any visible food (the 'this label is wrong' flow)."""
    f = _visible_food(db, food_id, current_user.id)
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    return _insert_custom(db, current_user.id, {c: f.get(c) for c in _CUSTOM_COLS})


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


@router.post("/entries/copy", response_model=List[FoodEntryResponse], status_code=status.HTTP_201_CREATED)
def copy_entries(body: EntryCopyIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Duplicate one day's entries (optionally one meal) onto another day, snapshot included."""
    q = db.query(FoodEntry).filter(FoodEntry.user_id == current_user.id, FoodEntry.entry_date == body.from_date)
    if body.meal_type:
        q = q.filter(FoodEntry.meal_type == body.meal_type)
    copies = []
    for e in q.order_by(FoodEntry.created_at, FoodEntry.id).all():
        c = FoodEntry(**{k: getattr(e, k) for k in (
            "food_name", "brand_name", "calories", "protein_g", "carbs_g", "fat_g", "quantity", "unit",
            "meal_type", "food_id", "grams", "portion_label", "fiber_g", "sugar_g", "sodium_mg")},
            user_id=current_user.id, entry_date=body.to_date)
        db.add(c)
        copies.append(c)
    db.commit()
    for c in copies:
        db.refresh(c)
    if copies:
        _update_streak(current_user.id, body.to_date, db)
    return copies


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


