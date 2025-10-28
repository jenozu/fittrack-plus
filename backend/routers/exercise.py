"""
Exercise Router
Handles exercise logging and CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import date
from schemas.exercise_schemas import (
    ExerciseEntryCreate, ExerciseEntryUpdate, ExerciseEntryResponse
)
from models import User, ExerciseEntry
from utils.auth import get_db, get_current_user

router = APIRouter(prefix="/exercise", tags=["Exercise"])


@router.post("/entries", response_model=ExerciseEntryResponse, status_code=status.HTTP_201_CREATED)
def create_exercise_entry(
    entry_data: ExerciseEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a new exercise entry.
    """
    exercise_entry = ExerciseEntry(
        user_id=current_user.id,
        exercise_name=entry_data.exercise_name,
        duration_minutes=entry_data.duration_minutes,
        calories_burned=entry_data.calories_burned,
        entry_date=entry_data.entry_date,
        notes=entry_data.notes
    )
    
    db.add(exercise_entry)
    db.commit()
    db.refresh(exercise_entry)
    
    return exercise_entry


@router.get("/entries", response_model=List[ExerciseEntryResponse])
def get_exercise_entries(
    entry_date: date = Query(None, description="Filter by date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get exercise entries for the current user.
    Optionally filter by date.
    """
    query = db.query(ExerciseEntry).filter(ExerciseEntry.user_id == current_user.id)
    
    if entry_date:
        query = query.filter(ExerciseEntry.entry_date == entry_date)
    
    entries = query.order_by(ExerciseEntry.created_at.desc()).all()
    return entries


@router.get("/entries/{entry_id}", response_model=ExerciseEntryResponse)
def get_exercise_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific exercise entry by ID.
    """
    entry = db.query(ExerciseEntry).filter(
        and_(
            ExerciseEntry.id == entry_id,
            ExerciseEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise entry not found"
        )
    
    return entry


@router.put("/entries/{entry_id}", response_model=ExerciseEntryResponse)
def update_exercise_entry(
    entry_id: int,
    entry_data: ExerciseEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an exercise entry.
    """
    entry = db.query(ExerciseEntry).filter(
        and_(
            ExerciseEntry.id == entry_id,
            ExerciseEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise entry not found"
        )
    
    # Update only provided fields
    for field, value in entry_data.dict(exclude_unset=True).items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an exercise entry.
    """
    entry = db.query(ExerciseEntry).filter(
        and_(
            ExerciseEntry.id == entry_id,
            ExerciseEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise entry not found"
        )
    
    db.delete(entry)
    db.commit()
    
    return None


