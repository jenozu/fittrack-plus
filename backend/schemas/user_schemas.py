from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime


# User Base Schema
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# User Registration
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# User Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# User Profile Update
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    goal_type: Optional[str] = None
    target_calories: Optional[int] = None
    target_protein_g: Optional[float] = None
    target_carbs_g: Optional[float] = None
    target_fat_g: Optional[float] = None


# Onboarding Data
class OnboardingData(BaseModel):
    gender: str
    date_of_birth: date
    height_cm: float
    current_weight_kg: float
    goal_weight_kg: Optional[float] = None
    activity_level: str  # sedentary, light, moderate, active, very_active
    goal_type: str  # lose, maintain, gain


# User Response
class UserResponse(UserBase):
    id: int
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    goal_type: Optional[str] = None
    target_calories: int
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


