"""
Recipes Router
API endpoints for recipe management and logging.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models import User, Recipe, RecipeIngredient, FoodEntry, FoodMaster
from utils.auth import get_db, get_current_user
from schemas.recipe_schemas import (
    RecipeCreate, RecipeUpdate, RecipeResponse, RecipeListItem,
    RecipeLogRequest, RecipeIngredientResponse
)
from services.recipe_service import (
    calculate_recipe_nutrition,
    get_recipe_with_ingredients,
    validate_ingredients,
    duplicate_recipe
)
from datetime import datetime, date

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new recipe with ingredients.
    
    - Validates all ingredients exist
    - Calculates nutrition automatically
    - Returns recipe with nutrition breakdown
    """
    # Validate ingredients
    errors = validate_ingredients(db, [ing.dict() for ing in recipe_data.ingredients])
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Invalid ingredients", "errors": errors}
        )
    
    # Create recipe
    recipe = Recipe(
        user_id=current_user.id,
        name=recipe_data.name,
        description=recipe_data.description,
        servings=recipe_data.servings,
        prep_time_minutes=recipe_data.prep_time_minutes,
        cook_time_minutes=recipe_data.cook_time_minutes,
        is_public=recipe_data.is_public,
    )
    
    db.add(recipe)
    db.flush()  # Get recipe ID
    
    # Add ingredients
    for ingredient_data in recipe_data.ingredients:
        ingredient = RecipeIngredient(
            recipe_id=recipe.id,
            food_master_id=ingredient_data.food_master_id,
            quantity=ingredient_data.quantity,
            unit=ingredient_data.unit,
            notes=ingredient_data.notes,
        )
        db.add(ingredient)
    
    db.commit()
    db.refresh(recipe)
    
    # Get recipe with ingredients and nutrition
    recipe = get_recipe_with_ingredients(db, recipe.id, current_user.id)
    nutrition = calculate_recipe_nutrition(db, recipe)
    
    # Prepare response
    response = RecipeResponse.from_orm(recipe)
    response.nutrition_per_serving = nutrition['per_serving']
    response.nutrition_total = nutrition['total']
    
    return response


@router.get("/", response_model=List[RecipeListItem])
def get_recipes(
    search: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all recipes for the current user.
    
    - Optional search by name
    - Returns simplified recipe list
    - Includes ingredient count and calories
    """
    query = db.query(Recipe).filter(Recipe.user_id == current_user.id)
    
    if search:
        query = query.filter(Recipe.name.ilike(f"%{search}%"))
    
    recipes = query.order_by(Recipe.created_at.desc()).all()
    
    # Build response with additional data
    result = []
    for recipe in recipes:
        ingredient_count = len(recipe.ingredients)
        
        # Calculate calories per serving
        nutrition = calculate_recipe_nutrition(db, recipe)
        calories_per_serving = nutrition['per_serving'].calories
        
        result.append({
            "id": recipe.id,
            "name": recipe.name,
            "description": recipe.description,
            "servings": recipe.servings,
            "prep_time_minutes": recipe.prep_time_minutes,
            "cook_time_minutes": recipe.cook_time_minutes,
            "ingredient_count": ingredient_count,
            "calories_per_serving": round(calories_per_serving, 1),
            "created_at": recipe.created_at,
        })
    
    return result


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific recipe with full details and nutrition.
    
    - Includes all ingredients
    - Includes nutrition breakdown
    """
    recipe = get_recipe_with_ingredients(db, recipe_id, current_user.id)
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Calculate nutrition
    nutrition = calculate_recipe_nutrition(db, recipe)
    
    # Prepare response
    response = RecipeResponse.from_orm(recipe)
    response.nutrition_per_serving = nutrition['per_serving']
    response.nutrition_total = nutrition['total']
    
    return response


@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: int,
    recipe_data: RecipeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a recipe.
    
    - Can update name, description, servings, times
    - Can update ingredients (replaces all)
    - Recalculates nutrition automatically
    """
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id,
        Recipe.user_id == current_user.id
    ).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Update recipe fields
    update_data = recipe_data.dict(exclude_unset=True, exclude={'ingredients'})
    for field, value in update_data.items():
        setattr(recipe, field, value)
    
    # Update ingredients if provided
    if recipe_data.ingredients is not None:
        # Validate new ingredients
        errors = validate_ingredients(db, [ing.dict() for ing in recipe_data.ingredients])
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid ingredients", "errors": errors}
            )
        
        # Delete old ingredients
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
        
        # Add new ingredients
        for ingredient_data in recipe_data.ingredients:
            ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                food_master_id=ingredient_data.food_master_id,
                quantity=ingredient_data.quantity,
                unit=ingredient_data.unit,
                notes=ingredient_data.notes,
            )
            db.add(ingredient)
    
    db.commit()
    db.refresh(recipe)
    
    # Get updated recipe with nutrition
    recipe = get_recipe_with_ingredients(db, recipe.id, current_user.id)
    nutrition = calculate_recipe_nutrition(db, recipe)
    
    response = RecipeResponse.from_orm(recipe)
    response.nutrition_per_serving = nutrition['per_serving']
    response.nutrition_total = nutrition['total']
    
    return response


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a recipe.
    
    - Permanently deletes recipe and all ingredients
    """
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id,
        Recipe.user_id == current_user.id
    ).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    db.delete(recipe)
    db.commit()
    
    return None


@router.post("/{recipe_id}/duplicate", response_model=RecipeResponse)
def duplicate_recipe_endpoint(
    recipe_id: int,
    new_name: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Duplicate a recipe.
    
    - Creates a copy of the recipe
    - Optionally rename the copy
    - Useful for creating variations
    """
    new_recipe = duplicate_recipe(db, recipe_id, current_user.id, new_name)
    
    if not new_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Get full recipe with nutrition
    recipe = get_recipe_with_ingredients(db, new_recipe.id, current_user.id)
    nutrition = calculate_recipe_nutrition(db, recipe)
    
    response = RecipeResponse.from_orm(recipe)
    response.nutrition_per_serving = nutrition['per_serving']
    response.nutrition_total = nutrition['total']
    
    return response


@router.post("/log-to-diary", status_code=status.HTTP_201_CREATED)
def log_recipe_to_diary(
    log_request: RecipeLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a recipe to the food diary.
    
    - Logs the recipe as a single food entry
    - Uses per-serving nutrition
    - Multiplies by servings consumed
    """
    # Get recipe
    recipe = get_recipe_with_ingredients(db, log_request.recipe_id, current_user.id)
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Calculate nutrition for the consumed amount
    nutrition = calculate_recipe_nutrition(db, recipe)
    per_serving = nutrition['per_serving']
    servings_consumed = log_request.servings_consumed
    
    # Create food entry
    food_entry = FoodEntry(
        user_id=current_user.id,
        food_name=f"{recipe.name} (Recipe)",
        brand_name="Custom Recipe",
        quantity=servings_consumed,
        unit="serving",
        calories=per_serving.calories * servings_consumed,
        protein_g=per_serving.protein_g * servings_consumed,
        carbs_g=per_serving.carbs_g * servings_consumed,
        fat_g=per_serving.fat_g * servings_consumed,
        meal_type=log_request.meal_type,
        entry_date=datetime.strptime(log_request.entry_date, "%Y-%m-%d").date(),
    )
    
    db.add(food_entry)
    db.commit()
    db.refresh(food_entry)
    
    return {
        "message": "Recipe logged to food diary successfully",
        "food_entry_id": food_entry.id,
        "calories": food_entry.calories,
        "protein_g": food_entry.protein_g,
        "carbs_g": food_entry.carbs_g,
        "fat_g": food_entry.fat_g,
    }

