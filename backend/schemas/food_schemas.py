from pydantic import BaseModel, Field
from typing import Optional, List, Dict
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


# Food database (food_data.service) output; all nutrition per 100 g
class PortionOut(BaseModel):
    label: str
    grams: float


class FoodOut(BaseModel):
    id: int
    source: str
    name: str
    brand: Optional[str] = None
    barcode: Optional[str] = None
    kcal_100g: float
    protein_100g: float
    carbs_100g: float
    fat_100g: float
    fiber_100g: Optional[float] = None
    sugar_100g: Optional[float] = None
    sodium_mg_100g: Optional[float] = None
    serving_g: Optional[float] = None
    serving_label: Optional[str] = None
    quality: str
    portions: List[PortionOut]


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
class FoodEntryCreate(BaseModel):
    """Either food_id + (grams | portion_label + quantity), or quick-add (food_name + calories)."""
    food_id: Optional[int] = None
    grams: Optional[float] = Field(None, gt=0)
    portion_label: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    food_name: Optional[str] = None
    brand_name: Optional[str] = None
    calories: Optional[float] = Field(None, ge=0)
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    meal_type: Optional[str] = None  # breakfast, lunch, dinner, snack
    entry_date: date


class FoodEntryUpdate(BaseModel):
    grams: Optional[float] = Field(None, gt=0)
    portion_label: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    food_name: Optional[str] = None
    brand_name: Optional[str] = None
    calories: Optional[float] = Field(None, ge=0)
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    meal_type: Optional[str] = None
    entry_date: Optional[date] = None


class FoodEntryResponse(BaseModel):
    id: int
    user_id: int
    food_id: Optional[int] = None
    food_name: str
    brand_name: Optional[str] = None
    calories: float
    protein_g: Optional[float] = 0
    carbs_g: Optional[float] = 0
    fat_g: Optional[float] = 0
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    grams: Optional[float] = None
    portion_label: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    meal_type: Optional[str] = None
    entry_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class FoodEntryTotals(BaseModel):
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0


class FoodEntryDay(BaseModel):
    entries: List[FoodEntryResponse]
    meals: Dict[str, FoodEntryTotals]
    totals: FoodEntryTotals


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


