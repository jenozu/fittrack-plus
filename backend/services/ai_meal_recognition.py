"""
AI Meal Recognition Service
Uses OpenAI GPT-4 Vision API to identify food items from images.
"""

import os
import base64
import json
from typing import List, Dict, Any
from openai import OpenAI
from PIL import Image
import io

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def encode_image_to_base64(image_bytes: bytes) -> str:
    """
    Encode image bytes to base64 string.
    
    Args:
        image_bytes: Image file bytes
    
    Returns:
        Base64 encoded image string
    """
    return base64.b64encode(image_bytes).decode('utf-8')


def analyze_meal_image(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Analyze a meal image using GPT-4 Vision to identify foods and estimate portions.
    
    Args:
        image_bytes: Image file bytes
    
    Returns:
        List of identified foods with quantities and confidence scores
    """
    # Encode image
    base64_image = encode_image_to_base64(image_bytes)
    
    # Prepare the prompt
    prompt = """Analyze this meal image and identify all food items with their estimated portion sizes.

For each food item, provide:
1. Food name (be specific, e.g., "Grilled Chicken Breast" not just "Chicken")
2. Estimated quantity (number and unit like "150g", "1 cup", "2 slices")
3. Confidence score (0-100, how certain you are about this identification)

Return ONLY a valid JSON array with this exact structure:
[
    {
        "food_name": "string",
        "quantity": number,
        "unit": "string",
        "confidence": number,
        "notes": "optional cooking method or details"
    }
]

Be precise and realistic with portion estimates. Consider common serving sizes.
If you see multiple items of the same food, combine them into one entry.
Only include items you can clearly identify."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # GPT-4 with vision
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.3,  # Lower temperature for more consistent results
        )
        
        # Extract the response
        content = response.choices[0].message.content
        
        # Parse JSON response
        # Remove markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        foods = json.loads(content)
        
        # Validate and clean the response
        validated_foods = []
        for food in foods:
            if isinstance(food, dict) and 'food_name' in food:
                validated_foods.append({
                    'food_name': food.get('food_name', 'Unknown Food'),
                    'quantity': float(food.get('quantity', 1)),
                    'unit': food.get('unit', 'serving'),
                    'confidence': int(food.get('confidence', 50)),
                    'notes': food.get('notes', '')
                })
        
        return validated_foods
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response content: {content}")
        raise Exception("Failed to parse AI response. Please try again.")
    except Exception as e:
        print(f"AI analysis error: {e}")
        raise Exception(f"AI meal recognition failed: {str(e)}")


def match_foods_to_database(db, ai_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Match AI-identified foods to the food database.
    
    Args:
        db: Database session
        ai_results: List of foods identified by AI
    
    Returns:
        List of foods with matched database entries
    """
    from models import FoodMaster
    from sqlalchemy import or_, func
    
    matched_results = []
    
    for ai_food in ai_results:
        food_name = ai_food['food_name']
        
        # Search for matching food in database
        # Try exact match first, then fuzzy match
        search_term = f"%{food_name}%"
        
        matches = db.query(FoodMaster).filter(
            or_(
                FoodMaster.food_name.ilike(search_term),
                FoodMaster.food_name.ilike(f"%{food_name.split()[0]}%")  # First word match
            )
        ).limit(5).all()
        
        if matches:
            # Use the best match (first result)
            best_match = matches[0]
            
            matched_results.append({
                'ai_identification': ai_food,
                'database_match': {
                    'food_master_id': best_match.id,
                    'food_name': best_match.food_name,
                    'brand_name': best_match.brand_name,
                    'calories': best_match.calories,
                    'protein_g': best_match.protein_g,
                    'carbs_g': best_match.carbs_g,
                    'fat_g': best_match.fat_g,
                    'serving_qty': best_match.serving_qty,
                    'serving_unit': best_match.serving_unit,
                },
                'suggested_quantity': ai_food['quantity'],
                'suggested_unit': ai_food['unit'],
                'confidence': ai_food['confidence'],
                'notes': ai_food['notes'],
                'all_matches': [
                    {
                        'id': m.id,
                        'name': m.food_name,
                        'brand': m.brand_name,
                        'calories': m.calories
                    } for m in matches
                ]
            })
        else:
            # No database match found
            matched_results.append({
                'ai_identification': ai_food,
                'database_match': None,
                'suggested_quantity': ai_food['quantity'],
                'suggested_unit': ai_food['unit'],
                'confidence': ai_food['confidence'],
                'notes': ai_food['notes'],
                'all_matches': []
            })
    
    return matched_results


def check_and_update_usage_limit(db, user) -> Dict[str, Any]:
    """
    Check if user has remaining AI scans and update usage counter.
    
    Args:
        db: Database session
        user: User object
    
    Returns:
        Dict with usage info and whether scan is allowed
    """
    from datetime import date
    from dateutil.relativedelta import relativedelta
    
    today = date.today()
    
    # Check if we need to reset the counter (monthly reset)
    if user.ai_scans_reset_date is None or user.ai_scans_reset_date < today:
        # Calculate next reset date (first day of next month)
        if today.month == 12:
            next_reset = date(today.year + 1, 1, 1)
        else:
            next_reset = date(today.year, today.month + 1, 1)
        
        user.ai_scans_used = 0
        user.ai_scans_reset_date = next_reset
        db.commit()
    
    # Check if user has scans remaining
    scans_remaining = user.ai_scans_monthly_limit - user.ai_scans_used
    can_scan = scans_remaining > 0
    
    return {
        'can_scan': can_scan,
        'scans_used': user.ai_scans_used,
        'scans_limit': user.ai_scans_monthly_limit,
        'scans_remaining': scans_remaining,
        'reset_date': user.ai_scans_reset_date.isoformat() if user.ai_scans_reset_date else None
    }


def increment_usage_counter(db, user):
    """
    Increment the user's AI scan usage counter.
    
    Args:
        db: Database session
        user: User object
    """
    user.ai_scans_used += 1
    db.commit()

