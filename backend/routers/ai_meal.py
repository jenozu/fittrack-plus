"""
AI Meal Recognition Router
API endpoints for AI-powered meal image analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from models import User
from utils.auth import get_db, get_current_user
from services.ai_meal_recognition import (
    analyze_meal_image,
    match_foods_to_database,
    check_and_update_usage_limit,
    increment_usage_counter
)

router = APIRouter(prefix="/ai", tags=["AI Meal Recognition"])


@router.get("/usage")
def get_ai_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the user's AI scan usage information.
    
    Returns:
    - Scans used this month
    - Scans remaining
    - Monthly limit
    - Next reset date
    """
    usage_info = check_and_update_usage_limit(db, current_user)
    
    return {
        "scans_used": usage_info['scans_used'],
        "scans_remaining": usage_info['scans_remaining'],
        "monthly_limit": usage_info['scans_limit'],
        "reset_date": usage_info['reset_date'],
        "can_scan": usage_info['can_scan']
    }


@router.post("/analyze-meal")
async def analyze_meal(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze a meal image using AI to identify foods.
    
    Upload an image file and get back:
    - Identified foods with confidence scores
    - Matched database entries with nutrition info
    - Suggested quantities
    
    Rate limited based on user's plan (free: 5/month, premium: unlimited)
    """
    # Check usage limits
    usage_info = check_and_update_usage_limit(db, current_user)
    
    if not usage_info['can_scan']:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Monthly AI scan limit reached",
                "scans_used": usage_info['scans_used'],
                "scans_limit": usage_info['scans_limit'],
                "reset_date": usage_info['reset_date']
            }
        )
    
    # Validate file type
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, etc.)"
        )
    
    # Read image data
    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read image: {str(e)}"
        )
    
    # Analyze with AI
    try:
        ai_results = analyze_meal_image(image_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed: {str(e)}"
        )
    
    # Match to database
    try:
        matched_results = match_foods_to_database(db, ai_results)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database matching failed: {str(e)}"
        )
    
    # Increment usage counter
    increment_usage_counter(db, current_user)
    
    # Get updated usage info
    updated_usage = check_and_update_usage_limit(db, current_user)
    
    return {
        "success": True,
        "foods": matched_results,
        "total_identified": len(matched_results),
        "usage": {
            "scans_used": updated_usage['scans_used'],
            "scans_remaining": updated_usage['scans_remaining'],
            "monthly_limit": updated_usage['scans_limit']
        }
    }


@router.post("/confirm-foods")
def confirm_and_log_foods(
    foods: List[dict],
    meal_type: str,
    entry_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm AI-identified foods and log them to the food diary.
    
    User can modify quantities, remove false positives, or change matched foods.
    """
    from models import FoodEntry
    from datetime import datetime
    
    if meal_type not in ['breakfast', 'lunch', 'dinner', 'snack']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meal type"
        )
    
    created_entries = []
    
    for food_data in foods:
        # Validate required fields
        if 'food_master_id' not in food_data:
            continue
        
        # Get food from database
        from models import FoodMaster
        food = db.query(FoodMaster).filter(FoodMaster.id == food_data['food_master_id']).first()
        
        if not food:
            continue
        
        # Calculate nutrition based on quantity
        quantity = float(food_data.get('quantity', 1))
        unit = food_data.get('unit', food.serving_unit)
        
        # Create food entry
        entry = FoodEntry(
            user_id=current_user.id,
            food_name=food.food_name,
            brand_name=food.brand_name,
            quantity=quantity,
            unit=unit,
            calories=food.calories * quantity,
            protein_g=food.protein_g * quantity,
            carbs_g=food.carbs_g * quantity,
            fat_g=food.fat_g * quantity,
            meal_type=meal_type,
            entry_date=datetime.strptime(entry_date, "%Y-%m-%d").date(),
            food_master_id=food.id
        )
        
        db.add(entry)
        created_entries.append({
            'food_name': entry.food_name,
            'calories': entry.calories,
            'quantity': entry.quantity,
            'unit': entry.unit
        })
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Logged {len(created_entries)} food items",
        "entries": created_entries
    }

