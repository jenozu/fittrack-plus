"""
Meal Plan Service
Business logic for meal planning and grocery list generation.
"""

from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict, Any
from collections import defaultdict
from models import MealPlan, PlannedMeal, Recipe, RecipeIngredient, FoodMaster, GroceryList, GroceryItem
from services.recipe_service import calculate_recipe_nutrition


def generate_grocery_list(db: Session, meal_plan_id: int) -> GroceryList:
    """
    Generate a grocery list from a meal plan by aggregating all recipe ingredients.
    
    Args:
        db: Database session
        meal_plan_id: Meal plan ID
    
    Returns:
        GroceryList object with all aggregated items
    """
    meal_plan = db.query(MealPlan).filter(MealPlan.id == meal_plan_id).first()
    if not meal_plan:
        return None
    
    # Delete existing grocery lists for this meal plan
    db.query(GroceryList).filter(GroceryList.meal_plan_id == meal_plan_id).delete()
    
    # Aggregate ingredients from all recipes in the meal plan
    ingredient_aggregator = defaultdict(lambda: {'quantity': 0, 'unit': '', 'category': None})
    
    for planned_meal in meal_plan.planned_meals:
        if planned_meal.recipe_id:
            recipe = db.query(Recipe).filter(Recipe.id == planned_meal.recipe_id).first()
            if recipe:
                for ingredient in recipe.ingredients:
                    food = db.query(FoodMaster).filter(FoodMaster.id == ingredient.food_master_id).first()
                    if food:
                        key = food.food_name.lower()
                        
                        # Aggregate quantities (simplified - assumes same units)
                        if ingredient_aggregator[key]['unit'] == '' or ingredient_aggregator[key]['unit'] == ingredient.unit:
                            ingredient_aggregator[key]['quantity'] += ingredient.quantity
                            ingredient_aggregator[key]['unit'] = ingredient.unit
                            ingredient_aggregator[key]['food_name'] = food.food_name
                            ingredient_aggregator[key]['category'] = categorize_food(food.food_name)
    
    # Create grocery list
    grocery_list = GroceryList(
        meal_plan_id=meal_plan_id,
        name=f"Grocery List for {meal_plan.name}"
    )
    db.add(grocery_list)
    db.flush()
    
    # Create grocery items
    for food_key, data in ingredient_aggregator.items():
        item = GroceryItem(
            grocery_list_id=grocery_list.id,
            food_name=data['food_name'],
            quantity=round(data['quantity'], 2),
            unit=data['unit'],
            category=data['category'],
            is_checked=False
        )
        db.add(item)
    
    db.commit()
    db.refresh(grocery_list)
    
    return grocery_list


def categorize_food(food_name: str) -> str:
    """
    Categorize food items for grocery list organization.
    
    Args:
        food_name: Name of the food
    
    Returns:
        Category string
    """
    food_lower = food_name.lower()
    
    # Produce
    produce_keywords = ['lettuce', 'tomato', 'carrot', 'apple', 'banana', 'orange', 'spinach', 
                       'broccoli', 'cucumber', 'onion', 'pepper', 'fruit', 'vegetable']
    if any(keyword in food_lower for keyword in produce_keywords):
        return 'Produce'
    
    # Protein
    protein_keywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 
                       'egg', 'tofu', 'meat']
    if any(keyword in food_lower for keyword in protein_keywords):
        return 'Protein'
    
    # Dairy
    dairy_keywords = ['milk', 'cheese', 'yogurt', 'butter', 'cream']
    if any(keyword in food_lower for keyword in dairy_keywords):
        return 'Dairy'
    
    # Grains
    grain_keywords = ['bread', 'rice', 'pasta', 'oat', 'cereal', 'flour', 'tortilla']
    if any(keyword in food_lower for keyword in grain_keywords):
        return 'Grains'
    
    # Snacks
    snack_keywords = ['chip', 'cookie', 'candy', 'cracker', 'nut', 'seed']
    if any(keyword in food_lower for keyword in snack_keywords):
        return 'Snacks'
    
    # Beverages
    beverage_keywords = ['juice', 'soda', 'coffee', 'tea', 'water', 'drink']
    if any(keyword in food_lower for keyword in beverage_keywords):
        return 'Beverages'
    
    # Condiments & Spices
    condiment_keywords = ['sauce', 'oil', 'vinegar', 'salt', 'pepper', 'spice', 'seasoning']
    if any(keyword in food_lower for keyword in condiment_keywords):
        return 'Condiments'
    
    return 'Other'


def calculate_daily_nutrition(db: Session, meal_plan_id: int, target_date: date) -> Dict[str, Any]:
    """
    Calculate total nutrition for a specific day in the meal plan.
    
    Args:
        db: Database session
        meal_plan_id: Meal plan ID
        target_date: Date to calculate for
    
    Returns:
        Dict with nutrition totals
    """
    planned_meals = db.query(PlannedMeal).filter(
        PlannedMeal.meal_plan_id == meal_plan_id,
        PlannedMeal.meal_date == target_date
    ).all()
    
    total_nutrition = {
        'calories': 0,
        'protein_g': 0,
        'carbs_g': 0,
        'fat_g': 0
    }
    
    for meal in planned_meals:
        if meal.recipe_id:
            recipe = db.query(Recipe).filter(Recipe.id == meal.recipe_id).first()
            if recipe:
                nutrition = calculate_recipe_nutrition(db, recipe)
                per_serving = nutrition['per_serving']
                
                total_nutrition['calories'] += per_serving.calories
                total_nutrition['protein_g'] += per_serving.protein_g
                total_nutrition['carbs_g'] += per_serving.carbs_g
                total_nutrition['fat_g'] += per_serving.fat_g
    
    return total_nutrition


def get_week_dates(start_date: date) -> List[date]:
    """
    Get all 7 dates for a week starting from start_date.
    
    Args:
        start_date: First day of the week
    
    Returns:
        List of 7 dates
    """
    return [start_date + timedelta(days=i) for i in range(7)]

