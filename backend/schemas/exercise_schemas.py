from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# Exercise Entry Schemas
class ExerciseEntryBase(BaseModel):
    exercise_name: str
    duration_minutes: float
    calories_burned: float = 0
    entry_date: date
    notes: Optional[str] = None


class ExerciseEntryCreate(ExerciseEntryBase):
    pass


class ExerciseEntryUpdate(BaseModel):
    exercise_name: Optional[str] = None
    duration_minutes: Optional[float] = None
    calories_burned: Optional[float] = None
    entry_date: Optional[date] = None
    notes: Optional[str] = None


class ExerciseEntryResponse(ExerciseEntryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


