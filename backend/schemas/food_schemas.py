from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# Food Master Schemas
class FoodMasterBase(BaseModel):
    source: str
    external_id: Optional[str] = None
    food_name: str
    brand_name: Optional[str] = None
    serving_qty: float = 1.0
    serving_unit: str = "serving"
    serving_weight_g: Optional[float] = None
    calories: float
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    barcode: Optional[str] = None


class FoodMasterCreate(FoodMasterBase):
    pass


class FoodMasterResponse(FoodMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Food Search Response
class FoodSearchResult(BaseModel):
    id: Optional[int] = None
    source: str
    food_name: str
    brand_name: Optional[str] = None
    serving_qty: float
    serving_unit: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0
    sugar_g: float = 0


class FoodSearchResponse(BaseModel):
    results: List[FoodSearchResult]
    total_count: int


# Food Entry Schemas
class FoodEntryBase(BaseModel):
    food_name: str
    brand_name: Optional[str] = None
    calories: float
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    quantity: float = 1.0
    unit: str = "serving"
    meal_type: Optional[str] = None  # breakfast, lunch, dinner, snack
    entry_date: date


class FoodEntryCreate(FoodEntryBase):
    food_master_id: Optional[int] = None


class FoodEntryUpdate(BaseModel):
    food_name: Optional[str] = None
    brand_name: Optional[str] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    meal_type: Optional[str] = None
    entry_date: Optional[date] = None


class FoodEntryResponse(FoodEntryBase):
    id: int
    user_id: int
    food_master_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Daily Summary
class DailyNutritionSummary(BaseModel):
    date: date
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    calories_burned: float
    calories_remaining: float
    target_calories: int
    target_protein_g: float
    target_carbs_g: float
    target_fat_g: float
    food_entries_count: int
    exercise_entries_count: int


