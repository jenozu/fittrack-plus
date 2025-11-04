"""
Body Measurements Schemas
Pydantic models for body measurement tracking API requests and responses.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class MeasurementCreate(BaseModel):
    """Schema for creating a new body measurement entry"""
    measurement_date: date = Field(default_factory=date.today, description="Date of measurement")
    
    # Measurements in centimeters
    waist_cm: Optional[float] = Field(default=None, ge=0, description="Waist measurement in cm")
    hips_cm: Optional[float] = Field(default=None, ge=0, description="Hips measurement in cm")
    chest_cm: Optional[float] = Field(default=None, ge=0, description="Chest measurement in cm")
    arms_cm: Optional[float] = Field(default=None, ge=0, description="Arms/biceps measurement in cm")
    thighs_cm: Optional[float] = Field(default=None, ge=0, description="Thighs measurement in cm")
    calves_cm: Optional[float] = Field(default=None, ge=0, description="Calves measurement in cm")
    neck_cm: Optional[float] = Field(default=None, ge=0, description="Neck measurement in cm")
    shoulders_cm: Optional[float] = Field(default=None, ge=0, description="Shoulders measurement in cm")
    
    # Body composition
    body_fat_percentage: Optional[float] = Field(default=None, ge=0, le=100, description="Body fat percentage")
    muscle_mass_kg: Optional[float] = Field(default=None, ge=0, description="Muscle mass in kg")
    
    notes: Optional[str] = Field(default=None, max_length=500, description="Notes about measurements")

    class Config:
        json_schema_extra = {
            "example": {
                "measurement_date": "2025-11-03",
                "waist_cm": 85.0,
                "hips_cm": 98.0,
                "chest_cm": 102.0,
                "arms_cm": 35.0,
                "thighs_cm": 58.0,
                "body_fat_percentage": 18.5,
                "notes": "Morning measurement, before breakfast"
            }
        }


class MeasurementUpdate(BaseModel):
    """Schema for updating a body measurement entry"""
    measurement_date: Optional[date] = Field(default=None, description="Date of measurement")
    
    # Measurements in centimeters
    waist_cm: Optional[float] = Field(default=None, ge=0)
    hips_cm: Optional[float] = Field(default=None, ge=0)
    chest_cm: Optional[float] = Field(default=None, ge=0)
    arms_cm: Optional[float] = Field(default=None, ge=0)
    thighs_cm: Optional[float] = Field(default=None, ge=0)
    calves_cm: Optional[float] = Field(default=None, ge=0)
    neck_cm: Optional[float] = Field(default=None, ge=0)
    shoulders_cm: Optional[float] = Field(default=None, ge=0)
    
    # Body composition
    body_fat_percentage: Optional[float] = Field(default=None, ge=0, le=100)
    muscle_mass_kg: Optional[float] = Field(default=None, ge=0)
    
    notes: Optional[str] = Field(default=None, max_length=500)


class MeasurementResponse(BaseModel):
    """Schema for body measurement response"""
    id: int
    user_id: int
    measurement_date: date
    
    # Measurements
    waist_cm: Optional[float]
    hips_cm: Optional[float]
    chest_cm: Optional[float]
    arms_cm: Optional[float]
    thighs_cm: Optional[float]
    calves_cm: Optional[float]
    neck_cm: Optional[float]
    shoulders_cm: Optional[float]
    
    # Body composition
    body_fat_percentage: Optional[float]
    muscle_mass_kg: Optional[float]
    
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MeasurementComparison(BaseModel):
    """Schema for comparing measurements over time"""
    current_date: date
    previous_date: Optional[date]
    
    # Current measurements
    current: MeasurementResponse
    previous: Optional[MeasurementResponse]
    
    # Changes (current - previous)
    changes: dict


class MeasurementSummary(BaseModel):
    """Schema for measurement summary statistics"""
    total_measurements: int
    first_date: Optional[date]
    latest_date: Optional[date]
    
    # Total changes from first to latest
    total_inches_lost: Optional[float]  # Sum of all reductions in inches
    total_cm_lost: Optional[float]  # Sum of all reductions in cm
    
    # Individual changes
    waist_change_cm: Optional[float]
    hips_change_cm: Optional[float]
    chest_change_cm: Optional[float]
    arms_change_cm: Optional[float]
    thighs_change_cm: Optional[float]
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_measurements": 5,
                "first_date": "2025-01-01",
                "latest_date": "2025-11-03",
                "total_cm_lost": 15.5,
                "total_inches_lost": 6.1,
                "waist_change_cm": -5.0,
                "hips_change_cm": -3.5,
                "chest_change_cm": 2.0
            }
        }

