"""
USDA FoodData Central API Service
This service interfaces with the USDA FoodData Central API.
Currently uses mock responses for development.
"""

import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# ====================================================================
# PLACEHOLDER: Add your USDA API key in .env file
# USDA_API_KEY=your_api_key_here
# Get your free API key at: https://fdc.nal.usda.gov/api-key-signup.html
# ====================================================================

USDA_API_KEY = os.getenv("USDA_API_KEY", "")
USDA_API_URL = "https://api.nal.usda.gov/fdc/v1"


class USDAService:
    """Service for interacting with USDA FoodData Central API"""
    
    def __init__(self):
        self.api_key = USDA_API_KEY
        self.base_url = USDA_API_URL
        
    def search_food(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for food items using USDA FoodData Central API.
        
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
        # params = {
        #     "api_key": self.api_key,
        #     "query": query,
        #     "pageSize": limit,
        #     "dataType": ["Foundation", "SR Legacy"]  # High-quality data types
        # }
        # 
        # response = requests.get(
        #     f"{self.base_url}/foods/search",
        #     params=params
        # )
        # 
        # if response.status_code == 200:
        #     return self._parse_usda_response(response.json())
        # else:
        #     return []
        # ====================================================================
        
        print(f"[USDA SERVICE] Would search for: '{query}' (limit: {limit})")
        return self._get_mock_results(query, limit)
    
    def get_food_by_id(self, fdc_id: str) -> Optional[Dict]:
        """
        Get detailed food information by FDC ID.
        
        Args:
            fdc_id: FoodData Central ID
            
        Returns:
            Detailed food data if found
        """
        
        # ====================================================================
        # PLACEHOLDER: Real API implementation
        # ====================================================================
        # import requests
        # 
        # params = {"api_key": self.api_key}
        # 
        # response = requests.get(
        #     f"{self.base_url}/food/{fdc_id}",
        #     params=params
        # )
        # 
        # if response.status_code == 200:
        #     return self._parse_food_detail(response.json())
        # else:
        #     return None
        # ====================================================================
        
        print(f"[USDA SERVICE] Would fetch food ID: {fdc_id}")
        return None
    
    def _parse_usda_response(self, data: Dict) -> List[Dict]:
        """Parse USDA API response into standardized format"""
        results = []
        
        for food in data.get("foods", []):
            # Extract nutrients from the USDA format
            nutrients = {n["nutrientName"]: n.get("value", 0) 
                        for n in food.get("foodNutrients", [])}
            
            results.append({
                "source": "usda",
                "external_id": str(food.get("fdcId", "")),
                "food_name": food.get("description", ""),
                "brand_name": food.get("brandOwner"),
                "serving_qty": 100,  # USDA typically uses 100g
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": nutrients.get("Energy", 0),
                "protein_g": nutrients.get("Protein", 0),
                "carbs_g": nutrients.get("Carbohydrate, by difference", 0),
                "fat_g": nutrients.get("Total lipid (fat)", 0),
                "fiber_g": nutrients.get("Fiber, total dietary", 0),
                "sugar_g": nutrients.get("Sugars, total including NLEA", 0),
                "sodium_mg": nutrients.get("Sodium, Na", 0),
                "barcode": food.get("gtinUpc")
            })
        
        return results
    
    def _get_mock_results(self, query: str, limit: int) -> List[Dict]:
        """
        Mock food search results for development/testing.
        These simulate real USDA API responses.
        """
        mock_database = [
            {
                "source": "usda",
                "external_id": "173410",
                "food_name": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
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
                "source": "usda",
                "external_id": "173096",
                "food_name": "Beef, ground, 93% lean meat / 7% fat, raw",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 152,
                "protein_g": 21.4,
                "carbs_g": 0,
                "fat_g": 7,
                "fiber_g": 0,
                "sugar_g": 0,
                "sodium_mg": 72,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "175167",
                "food_name": "Fish, salmon, Atlantic, farmed, cooked, dry heat",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 206,
                "protein_g": 22.1,
                "carbs_g": 0,
                "fat_g": 12.4,
                "fiber_g": 0,
                "sugar_g": 0,
                "sodium_mg": 61,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "168917",
                "food_name": "Rice, brown, long-grain, cooked",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 112,
                "protein_g": 2.6,
                "carbs_g": 23.5,
                "fat_g": 0.9,
                "fiber_g": 1.8,
                "sugar_g": 0.4,
                "sodium_mg": 5,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "170567",
                "food_name": "Yogurt, Greek, plain, nonfat",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 59,
                "protein_g": 10.2,
                "carbs_g": 3.6,
                "fat_g": 0.4,
                "fiber_g": 0,
                "sugar_g": 3.2,
                "sodium_mg": 36,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "168878",
                "food_name": "Oats",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 389,
                "protein_g": 16.9,
                "carbs_g": 66.3,
                "fat_g": 6.9,
                "fiber_g": 10.6,
                "sugar_g": 0,
                "sodium_mg": 2,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "171705",
                "food_name": "Apples, raw, with skin",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 52,
                "protein_g": 0.3,
                "carbs_g": 13.8,
                "fat_g": 0.2,
                "fiber_g": 2.4,
                "sugar_g": 10.4,
                "sodium_mg": 1,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "171688",
                "food_name": "Bananas, raw",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 89,
                "protein_g": 1.1,
                "carbs_g": 22.8,
                "fat_g": 0.3,
                "fiber_g": 2.6,
                "sugar_g": 12.2,
                "sodium_mg": 1,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "173424",
                "food_name": "Egg, whole, cooked, hard-boiled",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 155,
                "protein_g": 12.6,
                "carbs_g": 1.1,
                "fat_g": 10.6,
                "fiber_g": 0,
                "sugar_g": 1.1,
                "sodium_mg": 124,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "170567",
                "food_name": "Spinach, raw",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 23,
                "protein_g": 2.9,
                "carbs_g": 3.6,
                "fat_g": 0.4,
                "fiber_g": 2.2,
                "sugar_g": 0.4,
                "sodium_mg": 79,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "170379",
                "food_name": "Sweet potato, cooked, baked in skin, without salt",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 90,
                "protein_g": 2,
                "carbs_g": 20.7,
                "fat_g": 0.2,
                "fiber_g": 3.3,
                "sugar_g": 6.5,
                "sodium_mg": 36,
                "barcode": None
            },
            {
                "source": "usda",
                "external_id": "170417",
                "food_name": "Broccoli, cooked, boiled, drained, without salt",
                "brand_name": None,
                "serving_qty": 100,
                "serving_unit": "g",
                "serving_weight_g": 100,
                "calories": 35,
                "protein_g": 2.4,
                "carbs_g": 7.2,
                "fat_g": 0.4,
                "fiber_g": 3.3,
                "sugar_g": 1.4,
                "sodium_mg": 33,
                "barcode": None
            }
        ]
        
        # Simple search filter
        query_lower = query.lower()
        results = [
            food for food in mock_database
            if query_lower in food["food_name"].lower()
        ]
        
        return results[:limit]


