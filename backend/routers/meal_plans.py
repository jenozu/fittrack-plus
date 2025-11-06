"""
Meal Plans Router
API endpoints for meal planning and grocery list management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from models import User, MealPlan, PlannedMeal, Recipe, GroceryList, GroceryItem
from utils.auth import get_db, get_current_user
from schemas.meal_plan_schemas import (
    MealPlanCreate, MealPlanUpdate, MealPlanResponse,
    PlannedMealCreate, PlannedMealResponse,
    GroceryListResponse, GroceryItemUpdate,
    MealPlanDayNutrition
)
from services.meal_plan_service import (
    generate_grocery_list,
    calculate_daily_nutrition,
    get_week_dates
)
from services.recipe_service import calculate_recipe_nutrition

router = APIRouter(prefix="/meal-plans", tags=["Meal Planning"])


@router.post("/", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
def create_meal_plan(
    meal_plan_data: MealPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new meal plan for a week.
    
    - Creates meal plan for 7 days starting from week_start_date
    - Optionally includes initial planned meals
    """
    week_end_date = meal_plan_data.week_start_date + timedelta(days=6)
    
    meal_plan = MealPlan(
        user_id=current_user.id,
        name=meal_plan_data.name,
        week_start_date=meal_plan_data.week_start_date,
        week_end_date=week_end_date,
        is_active=True
    )
    
    db.add(meal_plan)
    db.flush()
    
    # Add planned meals if provided
    for meal_data in meal_plan_data.planned_meals:
        planned_meal = PlannedMeal(
            meal_plan_id=meal_plan.id,
            meal_date=meal_data.meal_date,
            meal_type=meal_data.meal_type,
            recipe_id=meal_data.recipe_id,
            custom_meal_name=meal_data.custom_meal_name,
            notes=meal_data.notes
        )
        db.add(planned_meal)
    
    db.commit()
    db.refresh(meal_plan)
    
    # Populate recipe details
    for meal in meal_plan.planned_meals:
        if meal.recipe_id:
            recipe = db.query(Recipe).filter(Recipe.id == meal.recipe_id).first()
            if recipe:
                meal.recipe_name = recipe.name
                meal.recipe_servings = recipe.servings
                nutrition = calculate_recipe_nutrition(db, recipe)
                meal.recipe_calories = nutrition['per_serving'].calories
    
    # Prepare response
    response = MealPlanResponse.from_orm(meal_plan)
    response.total_meals = len(meal_plan.planned_meals)
    response.recipes_used = sum(1 for m in meal_plan.planned_meals if m.recipe_id)
    
    return response


@router.get("/", response_model=List[MealPlanResponse])
def get_meal_plans(
    active_only: bool = Query(default=True, description="Show only active meal plans"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all meal plans for the current user.
    
    - Optionally filter to active plans only
    - Ordered by week start date (most recent first)
    """
    query = db.query(MealPlan).filter(MealPlan.user_id == current_user.id)
    
    if active_only:
        query = query.filter(MealPlan.is_active == True)
    
    meal_plans = query.order_by(MealPlan.week_start_date.desc()).all()
    
    # Populate recipe details for all plans
    for plan in meal_plans:
        for meal in plan.planned_meals:
            if meal.recipe_id:
                recipe = db.query(Recipe).filter(Recipe.id == meal.recipe_id).first()
                if recipe:
                    meal.recipe_name = recipe.name
                    meal.recipe_servings = recipe.servings
                    nutrition = calculate_recipe_nutrition(db, recipe)
                    meal.recipe_calories = nutrition['per_serving'].calories
    
    # Build response
    result = []
    for plan in meal_plans:
        response = MealPlanResponse.from_orm(plan)
        response.total_meals = len(plan.planned_meals)
        response.recipes_used = sum(1 for m in plan.planned_meals if m.recipe_id)
        result.append(response)
    
    return result


@router.get("/{meal_plan_id}", response_model=MealPlanResponse)
def get_meal_plan(
    meal_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific meal plan with all planned meals.
    """
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    # Populate recipe details
    for meal in meal_plan.planned_meals:
        if meal.recipe_id:
            recipe = db.query(Recipe).filter(Recipe.id == meal.recipe_id).first()
            if recipe:
                meal.recipe_name = recipe.name
                meal.recipe_servings = recipe.servings
                nutrition = calculate_recipe_nutrition(db, recipe)
                meal.recipe_calories = nutrition['per_serving'].calories
    
    response = MealPlanResponse.from_orm(meal_plan)
    response.total_meals = len(meal_plan.planned_meals)
    response.recipes_used = sum(1 for m in meal_plan.planned_meals if m.recipe_id)
    
    return response


@router.put("/{meal_plan_id}", response_model=MealPlanResponse)
def update_meal_plan(
    meal_plan_id: int,
    meal_plan_data: MealPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a meal plan's basic info.
    """
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    update_data = meal_plan_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meal_plan, field, value)
    
    db.commit()
    db.refresh(meal_plan)
    
    response = MealPlanResponse.from_orm(meal_plan)
    response.total_meals = len(meal_plan.planned_meals)
    response.recipes_used = sum(1 for m in meal_plan.planned_meals if m.recipe_id)
    
    return response


@router.delete("/{meal_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_plan(
    meal_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a meal plan and all associated planned meals and grocery lists.
    """
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    db.delete(meal_plan)
    db.commit()
    
    return None


@router.post("/{meal_plan_id}/meals", response_model=PlannedMealResponse, status_code=status.HTTP_201_CREATED)
def add_planned_meal(
    meal_plan_id: int,
    meal_data: PlannedMealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a planned meal to a meal plan.
    """
    # Verify meal plan exists and belongs to user
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    # Verify recipe exists if recipe_id is provided
    if meal_data.recipe_id:
        recipe = db.query(Recipe).filter(
            Recipe.id == meal_data.recipe_id,
            Recipe.user_id == current_user.id
        ).first()
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found"
            )
    
    planned_meal = PlannedMeal(
        meal_plan_id=meal_plan_id,
        meal_date=meal_data.meal_date,
        meal_type=meal_data.meal_type,
        recipe_id=meal_data.recipe_id,
        custom_meal_name=meal_data.custom_meal_name,
        notes=meal_data.notes
    )
    
    db.add(planned_meal)
    db.commit()
    db.refresh(planned_meal)
    
    # Populate recipe details
    if planned_meal.recipe_id:
        recipe = db.query(Recipe).filter(Recipe.id == planned_meal.recipe_id).first()
        if recipe:
            planned_meal.recipe_name = recipe.name
            planned_meal.recipe_servings = recipe.servings
            nutrition = calculate_recipe_nutrition(db, recipe)
            planned_meal.recipe_calories = nutrition['per_serving'].calories
    
    return planned_meal


@router.delete("/{meal_plan_id}/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planned_meal(
    meal_plan_id: int,
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a planned meal from a meal plan.
    """
    planned_meal = db.query(PlannedMeal).filter(
        PlannedMeal.id == meal_id,
        PlannedMeal.meal_plan_id == meal_plan_id
    ).first()
    
    if not planned_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned meal not found"
        )
    
    # Verify ownership through meal plan
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    db.delete(planned_meal)
    db.commit()
    
    return None


@router.post("/{meal_plan_id}/grocery-list", response_model=GroceryListResponse)
def generate_grocery_list_endpoint(
    meal_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a grocery list from a meal plan.
    
    - Aggregates all ingredients from recipes
    - Groups by category
    - Combines duplicate items
    """
    # Verify meal plan ownership
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    grocery_list = generate_grocery_list(db, meal_plan_id)
    
    response = GroceryListResponse.from_orm(grocery_list)
    response.total_items = len(grocery_list.items)
    response.checked_items = sum(1 for item in grocery_list.items if item.is_checked)
    
    return response


@router.get("/{meal_plan_id}/grocery-list", response_model=GroceryListResponse)
def get_grocery_list(
    meal_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the grocery list for a meal plan.
    """
    # Verify meal plan ownership
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    # Get grocery list
    grocery_list = db.query(GroceryList).filter(
        GroceryList.meal_plan_id == meal_plan_id
    ).first()
    
    if not grocery_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grocery list not found. Generate one first."
        )
    
    response = GroceryListResponse.from_orm(grocery_list)
    response.total_items = len(grocery_list.items)
    response.checked_items = sum(1 for item in grocery_list.items if item.is_checked)
    
    return response


@router.put("/grocery-items/{item_id}", response_model=GroceryItemUpdate)
def update_grocery_item(
    item_id: int,
    item_data: GroceryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a grocery item (toggle checked status).
    """
    item = db.query(GroceryItem).filter(GroceryItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grocery item not found"
        )
    
    # Verify ownership through grocery list -> meal plan
    grocery_list = db.query(GroceryList).filter(GroceryList.id == item.grocery_list_id).first()
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == grocery_list.meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    item.is_checked = item_data.is_checked
    db.commit()
    
    return item_data


@router.get("/{meal_plan_id}/nutrition/{target_date}")
def get_daily_nutrition(
    meal_plan_id: int,
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get total nutrition for a specific day in the meal plan.
    """
    # Verify meal plan ownership
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    nutrition = calculate_daily_nutrition(db, meal_plan_id, target_date)
    
    return {
        'date': target_date.isoformat(),
        'nutrition': nutrition
    }

