"""
Meal Plan Schemas
Pydantic models for meal planning and grocery list APIs.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional


class PlannedMealCreate(BaseModel):
    """Schema for creating a planned meal"""
    meal_date: date = Field(..., description="Date for this meal")
    meal_type: str = Field(..., description="breakfast, lunch, dinner, or snack")
    recipe_id: Optional[int] = Field(default=None, description="Recipe ID if using a recipe")
    custom_meal_name: Optional[str] = Field(default=None, description="Custom meal name if not using recipe")
    notes: Optional[str] = Field(default=None, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "meal_date": "2025-11-05",
                "meal_type": "lunch",
                "recipe_id": 42,
                "notes": "Meal prep for work"
            }
        }


class PlannedMealResponse(BaseModel):
    """Schema for planned meal response"""
    id: int
    meal_plan_id: int
    meal_date: date
    meal_type: str
    recipe_id: Optional[int]
    custom_meal_name: Optional[str]
    notes: Optional[str]
    
    # Recipe details (if available)
    recipe_name: Optional[str] = None
    recipe_servings: Optional[float] = None
    recipe_calories: Optional[float] = None
    
    class Config:
        from_attributes = True


class MealPlanCreate(BaseModel):
    """Schema for creating a meal plan"""
    name: str = Field(..., min_length=1, max_length=200, description="Meal plan name")
    week_start_date: date = Field(..., description="Start date of the week")
    planned_meals: List[PlannedMealCreate] = Field(default=[], description="List of planned meals")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Week of Nov 4-10",
                "week_start_date": "2025-11-04",
                "planned_meals": []
            }
        }


class MealPlanUpdate(BaseModel):
    """Schema for updating a meal plan"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    is_active: Optional[bool] = None


class MealPlanResponse(BaseModel):
    """Schema for meal plan response"""
    id: int
    user_id: int
    name: str
    week_start_date: date
    week_end_date: date
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Planned meals
    planned_meals: List[PlannedMealResponse]
    
    # Summary stats
    total_meals: int = 0
    recipes_used: int = 0
    
    class Config:
        from_attributes = True


class GroceryItemResponse(BaseModel):
    """Schema for grocery item response"""
    id: int
    grocery_list_id: int
    food_name: str
    quantity: float
    unit: str
    category: Optional[str]
    is_checked: bool
    
    class Config:
        from_attributes = True


class GroceryListResponse(BaseModel):
    """Schema for grocery list response"""
    id: int
    meal_plan_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    # Items grouped by category
    items: List[GroceryItemResponse]
    
    # Summary
    total_items: int = 0
    checked_items: int = 0
    
    class Config:
        from_attributes = True


class GroceryItemUpdate(BaseModel):
    """Schema for updating a grocery item"""
    is_checked: bool = Field(..., description="Whether item is checked off")


class MealPlanDayNutrition(BaseModel):
    """Schema for daily nutrition from meal plan"""
    date: date
    meals: List[PlannedMealResponse]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float

