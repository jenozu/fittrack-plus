"""
Nutritionix API Service
This service interfaces with the Nutritionix API for food data.
Currently uses mock responses for development.
"""

import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# ====================================================================
# PLACEHOLDER: Add your Nutritionix API credentials in .env file
# NUTRITIONIX_APP_ID=your_app_id_here
# NUTRITIONIX_APP_KEY=your_app_key_here
# ====================================================================

NUTRITIONIX_APP_ID = os.getenv("NUTRITIONIX_APP_ID", "")
NUTRITIONIX_APP_KEY = os.getenv("NUTRITIONIX_APP_KEY", "")
NUTRITIONIX_API_URL = "https://trackapi.nutritionix.com/v2"


class NutritionixService:
    """Service for interacting with Nutritionix API"""
    
    def __init__(self):
        self.app_id = NUTRITIONIX_APP_ID
        self.app_key = NUTRITIONIX_APP_KEY
        self.base_url = NUTRITIONIX_API_URL
        
    def search_food(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for food items using Nutritionix API.
        
        Args:
            query: Search term
            limit: Maximum number of results
            
        Returns:
            List of food items with nutrition data
        """
        
        # ====================================================================
        # PLACEHOLDER: Real API implementation would look like this:
        # ====================================================================
        # import requests
        # 
        # headers = {
        #     "x-app-id": self.app_id,
        #     "x-app-key": self.app_key,
        #     "Content-Type": "application/json"
        # }
        # 
        # payload = {
        #     "query": query,
        #     "num_servings": 1,
        #     "line_delimited": False
        # }
        # 
        # response = requests.post(
        #     f"{self.base_url}/natural/nutrients",
        #     headers=headers,
        #     json=payload
        # )
        # 
        # if response.status_code == 200:
        #     return self._parse_nutritionix_response(response.json())
        # else:
        #     return []
        # ====================================================================
        
        print(f"[NUTRITIONIX SERVICE] Would search for: '{query}' (limit: {limit})")
        return self._get_mock_results(query, limit)
    
    def search_by_barcode(self, barcode: str) -> Optional[Dict]:
        """
        Search for a food item by barcode/UPC.
        
        Args:
            barcode: UPC/barcode string
            
        Returns:
            Food item data if found
        """
        
        # ====================================================================
        # PLACEHOLDER: Real API implementation
        # ====================================================================
        # import requests
        # 
        # headers = {
        #     "x-app-id": self.app_id,
        #     "x-app-key": self.app_key
        # }
        # 
        # response = requests.get(
        #     f"{self.base_url}/search/item?upc={barcode}",
        #     headers=headers
        # )
        # 
        # if response.status_code == 200:
        #     return self._parse_barcode_response(response.json())
        # else:
        #     return None
        # ====================================================================
        
        print(f"[NUTRITIONIX SERVICE] Would search barcode: {barcode}")
        return self._get_mock_barcode_result(barcode)
    
    def _parse_nutritionix_response(self, data: Dict) -> List[Dict]:
        """Parse Nutritionix API response into standardized format"""
        results = []
        
        for food in data.get("foods", []):
            results.append({
                "source": "nutritionix",
                "external_id": food.get("food_name", ""),
                "food_name": food.get("food_name", ""),
                "brand_name": food.get("brand_name"),
                "serving_qty": food.get("serving_qty", 1.0),
                "serving_unit": food.get("serving_unit", "serving"),
                "serving_weight_g": food.get("serving_weight_grams"),
                "calories": food.get("nf_calories", 0),
                "protein_g": food.get("nf_protein", 0),
                "carbs_g": food.get("nf_total_carbohydrate", 0),
                "fat_g": food.get("nf_total_fat", 0),
                "fiber_g": food.get("nf_dietary_fiber", 0),
                "sugar_g": food.get("nf_sugars", 0),
                "sodium_mg": food.get("nf_sodium", 0),
                "barcode": food.get("upc")
            })
        
        return results
    
    def _get_mock_results(self, query: str, limit: int) -> List[Dict]:
        """
        Mock food search results for development/testing.
        These simulate real Nutritionix API responses.
        """
        mock_database = [
            {
                "source": "nutritionix",
                "external_id": "chicken_breast_grilled",
                "food_name": "Chicken Breast, Grilled",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 165,
                "protein_g": 31,
                "carbs_g": 0,
                "fat_g": 3.6,
                "fiber_g": 0,
                "sugar_g": 0,
                "sodium_mg": 74,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "banana_medium",
                "food_name": "Banana",
                "brand_name": None,
                "serving_qty": 1,
                "serving_unit": "medium",
                "serving_weight_g": 118,
                "calories": 105,
                "protein_g": 1.3,
                "carbs_g": 27,
                "fat_g": 0.4,
                "fiber_g": 3.1,
                "sugar_g": 14,
                "sodium_mg": 1,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "brown_rice_cooked",
                "food_name": "Brown Rice, Cooked",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 112,
                "protein_g": 2.6,
                "carbs_g": 24,
                "fat_g": 0.9,
                "fiber_g": 1.8,
                "sugar_g": 0.4,
                "sodium_mg": 5,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "salmon_fillet",
                "food_name": "Salmon, Atlantic, Cooked",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 206,
                "protein_g": 22,
                "carbs_g": 0,
                "fat_g": 12,
                "fiber_g": 0,
                "sugar_g": 0,
                "sodium_mg": 59,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "greek_yogurt",
                "food_name": "Greek Yogurt, Plain, Nonfat",
                "brand_name": "Chobani",
                "serving_qty": 150,
                "serving_unit": "g",
                "serving_weight_g": 150,
                "calories": 90,
                "protein_g": 15,
                "carbs_g": 6,
                "fat_g": 0,
                "fiber_g": 0,
                "sugar_g": 4,
                "sodium_mg": 60,
                "barcode": "00894700010045"
            },
            {
                "source": "nutritionix",
                "external_id": "oatmeal_cooked",
                "food_name": "Oatmeal, Cooked",
                "brand_name": None,
                "serving_qty": 1,
                "serving_unit": "cup",
                "serving_weight_g": 234,
                "calories": 166,
                "protein_g": 5.9,
                "carbs_g": 28,
                "fat_g": 3.6,
                "fiber_g": 4,
                "sugar_g": 0.6,
                "sodium_mg": 9,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "apple_medium",
                "food_name": "Apple, Medium",
                "brand_name": None,
                "serving_qty": 1,
                "serving_unit": "medium",
                "serving_weight_g": 182,
                "calories": 95,
                "protein_g": 0.5,
                "carbs_g": 25,
                "fat_g": 0.3,
                "fiber_g": 4.4,
                "sugar_g": 19,
                "sodium_mg": 2,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "eggs_whole",
                "food_name": "Egg, Whole, Cooked",
                "brand_name": None,
                "serving_qty": 1,
                "serving_unit": "large",
                "serving_weight_g": 50,
                "calories": 72,
                "protein_g": 6.3,
                "carbs_g": 0.4,
                "fat_g": 4.8,
                "fiber_g": 0,
                "sugar_g": 0.2,
                "sodium_mg": 71,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "almonds",
                "food_name": "Almonds, Raw",
                "brand_name": None,
                "serving_qty": 28,
                "serving_unit": "g",
                "serving_weight_g": 28,
                "calories": 164,
                "protein_g": 6,
                "carbs_g": 6,
                "fat_g": 14,
                "fiber_g": 3.5,
                "sugar_g": 1.2,
                "sodium_mg": 0,
                "barcode": None
            },
            {
                "source": "nutritionix",
                "external_id": "broccoli_cooked",
                "food_name": "Broccoli, Cooked",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 35,
                "protein_g": 2.4,
                "carbs_g": 7,
                "fat_g": 0.4,
                "fiber_g": 3.3,
                "sugar_g": 1.4,
                "sodium_mg": 33,
                "barcode": None
            }
        ]
        
        # Simple search filter - check if query matches food name
        query_lower = query.lower()
        results = [
            food for food in mock_database
            if query_lower in food["food_name"].lower()
        ]
        
        return results[:limit]
    
    def _get_mock_barcode_result(self, barcode: str) -> Optional[Dict]:
        """Mock barcode lookup"""
        # Example barcode for Chobani Greek Yogurt
        if barcode == "00894700010045":
            return {
                "source": "nutritionix",
                "external_id": "greek_yogurt",
                "food_name": "Greek Yogurt, Plain, Nonfat",
                "brand_name": "Chobani",
                "serving_qty": 150,
                "serving_unit": "g",
                "serving_weight_g": 150,
                "calories": 90,
                "protein_g": 15,
                "carbs_g": 6,
                "fat_g": 0,
                "fiber_g": 0,
                "sugar_g": 4,
                "sodium_mg": 60,
                "barcode": barcode
            }
        return None


