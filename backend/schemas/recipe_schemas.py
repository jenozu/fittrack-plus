"""
Recipe Schemas
Pydantic models for recipe API requests and responses.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class RecipeIngredientCreate(BaseModel):
    """Schema for creating a recipe ingredient"""
    food_master_id: int = Field(..., description="Food master ID")
    quantity: float = Field(..., gt=0, description="Quantity of ingredient")
    unit: str = Field(..., description="Unit of measurement")
    notes: Optional[str] = Field(default=None, max_length=200, description="Notes about ingredient")
    
    class Config:
        json_schema_extra = {
            "example": {
                "food_master_id": 123,
                "quantity": 2.0,
                "unit": "cups",
                "notes": "Cooked"
            }
        }


class RecipeIngredientResponse(BaseModel):
    """Schema for recipe ingredient response"""
    id: int
    recipe_id: int
    food_master_id: int
    quantity: float
    unit: str
    notes: Optional[str]
    
    # Nested food information
    food_name: Optional[str] = None
    brand_name: Optional[str] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    
    class Config:
        from_attributes = True


class RecipeCreate(BaseModel):
    """Schema for creating a recipe"""
    name: str = Field(..., min_length=1, max_length=200, description="Recipe name")
    description: Optional[str] = Field(default=None, max_length=1000, description="Recipe description")
    servings: float = Field(default=1.0, gt=0, description="Number of servings")
    prep_time_minutes: Optional[int] = Field(default=None, ge=0, description="Prep time in minutes")
    cook_time_minutes: Optional[int] = Field(default=None, ge=0, description="Cook time in minutes")
    is_public: bool = Field(default=False, description="Whether recipe is public")
    ingredients: List[RecipeIngredientCreate] = Field(..., min_length=1, description="List of ingredients")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Chicken Salad",
                "description": "A healthy and delicious chicken salad",
                "servings": 2.0,
                "prep_time_minutes": 15,
                "cook_time_minutes": 0,
                "is_public": False,
                "ingredients": [
                    {
                        "food_master_id": 123,
                        "quantity": 200,
                        "unit": "g",
                        "notes": "Grilled"
                    },
                    {
                        "food_master_id": 456,
                        "quantity": 2,
                        "unit": "cups",
                        "notes": "Mixed greens"
                    }
                ]
            }
        }


class RecipeUpdate(BaseModel):
    """Schema for updating a recipe"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    servings: Optional[float] = Field(default=None, gt=0)
    prep_time_minutes: Optional[int] = Field(default=None, ge=0)
    cook_time_minutes: Optional[int] = Field(default=None, ge=0)
    is_public: Optional[bool] = None
    ingredients: Optional[List[RecipeIngredientCreate]] = Field(default=None, min_length=1)


class NutritionBreakdown(BaseModel):
    """Schema for nutrition breakdown per serving"""
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0


class RecipeResponse(BaseModel):
    """Schema for recipe response with nutrition"""
    id: int
    user_id: int
    name: str
    description: Optional[str]
    servings: float
    prep_time_minutes: Optional[int]
    cook_time_minutes: Optional[int]
    is_public: bool
    created_at: datetime
    updated_at: datetime
    
    # Ingredients
    ingredients: List[RecipeIngredientResponse]
    
    # Nutrition per serving
    nutrition_per_serving: Optional[NutritionBreakdown] = None
    
    # Total nutrition (for all servings)
    nutrition_total: Optional[NutritionBreakdown] = None
    
    class Config:
        from_attributes = True


class RecipeListItem(BaseModel):
    """Schema for recipe list item (simplified)"""
    id: int
    name: str
    description: Optional[str]
    servings: float
    prep_time_minutes: Optional[int]
    cook_time_minutes: Optional[int]
    ingredient_count: int
    calories_per_serving: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class RecipeLogRequest(BaseModel):
    """Schema for logging a recipe to food diary"""
    recipe_id: int = Field(..., description="Recipe ID to log")
    meal_type: str = Field(..., description="Meal type (breakfast, lunch, dinner, snack)")
    entry_date: str = Field(..., description="Date to log (YYYY-MM-DD)")
    servings_consumed: float = Field(default=1.0, gt=0, description="Number of servings consumed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipe_id": 42,
                "meal_type": "lunch",
                "entry_date": "2025-11-04",
                "servings_consumed": 1.0
            }
        }

