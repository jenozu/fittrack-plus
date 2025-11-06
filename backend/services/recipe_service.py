"""
Recipe Service
Business logic for recipes including nutrition calculation.
"""

from sqlalchemy.orm import Session
from models import Recipe, RecipeIngredient, FoodMaster
from schemas.recipe_schemas import NutritionBreakdown


def calculate_recipe_nutrition(db: Session, recipe: Recipe) -> dict:
    """
    Calculate total and per-serving nutrition for a recipe.
    
    Args:
        db: Database session
        recipe: Recipe object with ingredients
    
    Returns:
        Dictionary with total and per-serving nutrition
    """
    total_nutrition = {
        'calories': 0,
        'protein_g': 0,
        'carbs_g': 0,
        'fat_g': 0,
        'fiber_g': 0,
        'sugar_g': 0,
        'sodium_mg': 0,
    }
    
    for ingredient in recipe.ingredients:
        # Get the food item
        food = db.query(FoodMaster).filter(FoodMaster.id == ingredient.food_master_id).first()
        if not food:
            continue
        
        # Calculate the multiplier based on quantity and serving size
        # food.serving_qty and food.serving_unit define the base serving
        # ingredient.quantity and ingredient.unit are what the recipe uses
        
        # For simplicity, we'll assume the quantity is proportional to the serving
        # In a more sophisticated system, you'd need unit conversion
        multiplier = ingredient.quantity / (food.serving_qty or 1.0)
        
        # Add nutrition from this ingredient
        total_nutrition['calories'] += (food.calories or 0) * multiplier
        total_nutrition['protein_g'] += (food.protein_g or 0) * multiplier
        total_nutrition['carbs_g'] += (food.carbs_g or 0) * multiplier
        total_nutrition['fat_g'] += (food.fat_g or 0) * multiplier
        total_nutrition['fiber_g'] += (food.fiber_g or 0) * multiplier
        total_nutrition['sugar_g'] += (food.sugar_g or 0) * multiplier
        total_nutrition['sodium_mg'] += (food.sodium_mg or 0) * multiplier
    
    # Calculate per-serving nutrition
    servings = recipe.servings if recipe.servings > 0 else 1.0
    per_serving = {
        key: value / servings
        for key, value in total_nutrition.items()
    }
    
    return {
        'total': NutritionBreakdown(**total_nutrition),
        'per_serving': NutritionBreakdown(**per_serving)
    }


def get_recipe_with_ingredients(db: Session, recipe_id: int, user_id: int):
    """
    Get a recipe with all its ingredients and food details.
    
    Args:
        db: Database session
        recipe_id: Recipe ID
        user_id: User ID (for authorization)
    
    Returns:
        Recipe with populated ingredients or None
    """
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id,
        Recipe.user_id == user_id
    ).first()
    
    if not recipe:
        return None
    
    # Populate ingredient food details
    for ingredient in recipe.ingredients:
        food = db.query(FoodMaster).filter(FoodMaster.id == ingredient.food_master_id).first()
        if food:
            ingredient.food_name = food.food_name
            ingredient.brand_name = food.brand_name
            ingredient.calories = food.calories
            ingredient.protein_g = food.protein_g
            ingredient.carbs_g = food.carbs_g
            ingredient.fat_g = food.fat_g
    
    return recipe


def validate_ingredients(db: Session, ingredients: list) -> list:
    """
    Validate that all ingredient food_master_ids exist.
    
    Args:
        db: Database session
        ingredients: List of ingredient dictionaries
    
    Returns:
        List of error messages (empty if all valid)
    """
    errors = []
    
    for i, ingredient in enumerate(ingredients):
        food_id = ingredient.get('food_master_id')
        if not food_id:
            errors.append(f"Ingredient {i+1}: Missing food_master_id")
            continue
        
        food = db.query(FoodMaster).filter(FoodMaster.id == food_id).first()
        if not food:
            errors.append(f"Ingredient {i+1}: Food with ID {food_id} not found")
    
    return errors


def duplicate_recipe(db: Session, recipe_id: int, user_id: int, new_name: str = None):
    """
    Duplicate a recipe for the same or different user.
    
    Args:
        db: Database session
        recipe_id: Original recipe ID
        user_id: User ID who will own the duplicate
        new_name: Optional new name for the duplicate
    
    Returns:
        New recipe object or None if original not found
    """
    original = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not original:
        return None
    
    # Create new recipe
    new_recipe = Recipe(
        user_id=user_id,
        name=new_name or f"{original.name} (Copy)",
        description=original.description,
        servings=original.servings,
        prep_time_minutes=original.prep_time_minutes,
        cook_time_minutes=original.cook_time_minutes,
        is_public=False,  # Copies are always private initially
    )
    
    db.add(new_recipe)
    db.flush()  # Get the new recipe ID
    
    # Duplicate ingredients
    for ingredient in original.ingredients:
        new_ingredient = RecipeIngredient(
            recipe_id=new_recipe.id,
            food_master_id=ingredient.food_master_id,
            quantity=ingredient.quantity,
            unit=ingredient.unit,
            notes=ingredient.notes,
        )
        db.add(new_ingredient)
    
    db.commit()
    db.refresh(new_recipe)
    
    return new_recipe

