from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# Streak Schemas
class StreakResponse(BaseModel):
    id: int
    user_id: int
    current_streak: int
    longest_streak: int
    last_logged_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Weight Log Schemas
class WeightLogBase(BaseModel):
    weight_kg: float
    log_date: date
    notes: Optional[str] = None


class WeightLogCreate(WeightLogBase):
    pass


class WeightLogResponse(WeightLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


