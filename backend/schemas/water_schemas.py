"""
Water Tracking Schemas
Pydantic models for water logging API requests and responses.
"""

from pydantic import BaseModel, Field
from datetime import date
from typing import Optional


class WaterLogCreate(BaseModel):
    """Schema for creating a new water log entry"""
    cups: float = Field(default=1.0, ge=0, description="Water intake in 8oz cups")
    ml: Optional[float] = Field(default=None, ge=0, description="Water intake in milliliters (optional)")
    log_date: date = Field(default_factory=date.today, description="Date of water log")

    class Config:
        json_schema_extra = {
            "example": {
                "cups": 2.0,
                "ml": 473.18,
                "log_date": "2025-11-03"
            }
        }


class WaterLogUpdate(BaseModel):
    """Schema for updating a water log entry"""
    cups: Optional[float] = Field(default=None, ge=0, description="Water intake in 8oz cups")
    ml: Optional[float] = Field(default=None, ge=0, description="Water intake in milliliters")
    log_date: Optional[date] = Field(default=None, description="Date of water log")

    class Config:
        json_schema_extra = {
            "example": {
                "cups": 3.0,
                "ml": 709.77
            }
        }


class WaterLogResponse(BaseModel):
    """Schema for water log response"""
    id: int
    user_id: int
    cups: float
    ml: float
    log_date: date
    created_at: date

    class Config:
        from_attributes = True


class WaterDailySummary(BaseModel):
    """Schema for daily water intake summary"""
    log_date: date
    total_cups: float
    total_ml: float
    goal_cups: float
    goal_ml: float
    percentage_complete: float
    goal_achieved: bool

    class Config:
        json_schema_extra = {
            "example": {
                "log_date": "2025-11-03",
                "total_cups": 6.5,
                "total_ml": 1541.76,
                "goal_cups": 8.0,
                "goal_ml": 1892.71,
                "percentage_complete": 81.25,
                "goal_achieved": False
            }
        }


class WaterGoalUpdate(BaseModel):
    """Schema for updating water goal"""
    water_goal_cups: float = Field(..., ge=0, description="Daily water goal in 8oz cups")

    class Config:
        json_schema_extra = {
            "example": {
                "water_goal_cups": 10.0
            }
        }

