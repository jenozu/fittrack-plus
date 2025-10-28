"""
Food Aggregation and Normalization Layer
This module coordinates food searches across multiple sources:
1. Internal food_master database (cached results)
2. Nutritionix API
3. USDA FoodData Central API

All results are normalized to a standard format and cached in food_master.
"""

from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import FoodMaster
from services.nutritionix_service import NutritionixService
from services.usda_service import USDAService


class FoodAggregator:
    """
    Aggregates food data from multiple sources.
    Priority: Internal DB -> Nutritionix -> USDA
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.nutritionix = NutritionixService()
        self.usda = USDAService()
    
    def search_food(self, query: str, limit: int = 20) -> List[Dict]:
        """
        Search for food items across all available sources.
        
        Strategy:
        1. First check internal food_master database
        2. If insufficient results, query external APIs (Nutritionix, USDA)
        3. Normalize and cache external results in food_master
        4. Return combined results
        
        Args:
            query: Search term
            limit: Maximum number of results to return
            
        Returns:
            List of normalized food items
        """
        results = []
        
        # Step 1: Search internal database
        internal_results = self._search_internal(query, limit)
        results.extend(internal_results)
        
        print(f"[FOOD AGGREGATOR] Found {len(internal_results)} results in internal database")
        
        # Step 2: If we need more results, query external APIs
        remaining = limit - len(results)
        if remaining > 0:
            external_results = self._search_external(query, remaining)
            
            # Cache external results in database
            if external_results:
                self._cache_results(external_results)
            
            results.extend(external_results)
            print(f"[FOOD AGGREGATOR] Found {len(external_results)} results from external APIs")
        
        return results[:limit]
    
    def search_by_barcode(self, barcode: str) -> Optional[Dict]:
        """
        Search for a food item by barcode.
        
        Args:
            barcode: UPC/barcode string
            
        Returns:
            Food item data if found
        """
        # Check internal database first
        food = self.db.query(FoodMaster).filter(
            FoodMaster.barcode == barcode
        ).first()
        
        if food:
            print(f"[FOOD AGGREGATOR] Found barcode in internal database: {barcode}")
            return self._food_master_to_dict(food)
        
        # Try external APIs
        print(f"[FOOD AGGREGATOR] Searching external APIs for barcode: {barcode}")
        
        # Try Nutritionix
        result = self.nutritionix.search_by_barcode(barcode)
        if result:
            # Cache the result
            self._cache_results([result])
            return result
        
        return None
    
    def _search_internal(self, query: str, limit: int) -> List[Dict]:
        """
        Search the internal food_master database.
        """
        query_lower = f"%{query.lower()}%"
        
        foods = self.db.query(FoodMaster).filter(
            or_(
                FoodMaster.food_name.ilike(query_lower),
                FoodMaster.brand_name.ilike(query_lower)
            )
        ).limit(limit).all()
        
        return [self._food_master_to_dict(food) for food in foods]
    
    def _search_external(self, query: str, limit: int) -> List[Dict]:
        """
        Search external APIs (Nutritionix and USDA).
        Returns combined results from all sources.
        """
        all_results = []
        
        # Calculate how many results to request from each API
        per_source_limit = max(5, limit // 2)
        
        # Query Nutritionix
        try:
            nutritionix_results = self.nutritionix.search_food(query, per_source_limit)
            all_results.extend(nutritionix_results)
        except Exception as e:
            print(f"[FOOD AGGREGATOR] Nutritionix search error: {e}")
        
        # Query USDA
        try:
            usda_results = self.usda.search_food(query, per_source_limit)
            all_results.extend(usda_results)
        except Exception as e:
            print(f"[FOOD AGGREGATOR] USDA search error: {e}")
        
        # Remove duplicates based on food_name + brand_name
        seen = set()
        unique_results = []
        
        for result in all_results:
            key = (result["food_name"].lower(), result.get("brand_name", "").lower())
            if key not in seen:
                seen.add(key)
                unique_results.append(result)
        
        return unique_results
    
    def _cache_results(self, results: List[Dict]) -> None:
        """
        Cache external API results in the food_master table.
        Avoids duplicates by checking external_id + source.
        """
        for result in results:
            # Check if this food already exists in database
            existing = self.db.query(FoodMaster).filter(
                FoodMaster.source == result["source"],
                FoodMaster.external_id == result.get("external_id")
            ).first()
            
            if existing:
                continue  # Already cached
            
            # Create new food_master entry
            food_master = FoodMaster(
                source=result["source"],
                external_id=result.get("external_id"),
                food_name=result["food_name"],
                brand_name=result.get("brand_name"),
                serving_qty=result.get("serving_qty", 1.0),
                serving_unit=result.get("serving_unit", "serving"),
                serving_weight_g=result.get("serving_weight_g"),
                calories=result["calories"],
                protein_g=result.get("protein_g", 0),
                carbs_g=result.get("carbs_g", 0),
                fat_g=result.get("fat_g", 0),
                fiber_g=result.get("fiber_g", 0),
                sugar_g=result.get("sugar_g", 0),
                sodium_mg=result.get("sodium_mg", 0),
                barcode=result.get("barcode")
            )
            
            self.db.add(food_master)
        
        # Commit all new entries
        try:
            self.db.commit()
            print(f"[FOOD AGGREGATOR] Cached {len(results)} new food items")
        except Exception as e:
            self.db.rollback()
            print(f"[FOOD AGGREGATOR] Error caching results: {e}")
    
    def _food_master_to_dict(self, food: FoodMaster) -> Dict:
        """
        Convert a FoodMaster model instance to a dictionary.
        """
        return {
            "id": food.id,
            "source": food.source,
            "external_id": food.external_id,
            "food_name": food.food_name,
            "brand_name": food.brand_name,
            "serving_qty": food.serving_qty,
            "serving_unit": food.serving_unit,
            "serving_weight_g": food.serving_weight_g,
            "calories": food.calories,
            "protein_g": food.protein_g,
            "carbs_g": food.carbs_g,
            "fat_g": food.fat_g,
            "fiber_g": food.fiber_g,
            "sugar_g": food.sugar_g,
            "sodium_mg": food.sodium_mg,
            "barcode": food.barcode
        }
    
    def add_custom_food(self, food_data: Dict) -> Dict:
        """
        Add a custom user-created food item to the food_master table.
        
        Args:
            food_data: Dictionary containing food information
            
        Returns:
            The created food item as a dictionary
        """
        food_master = FoodMaster(
            source="custom",
            external_id=None,
            food_name=food_data["food_name"],
            brand_name=food_data.get("brand_name"),
            serving_qty=food_data.get("serving_qty", 1.0),
            serving_unit=food_data.get("serving_unit", "serving"),
            serving_weight_g=food_data.get("serving_weight_g"),
            calories=food_data["calories"],
            protein_g=food_data.get("protein_g", 0),
            carbs_g=food_data.get("carbs_g", 0),
            fat_g=food_data.get("fat_g", 0),
            fiber_g=food_data.get("fiber_g", 0),
            sugar_g=food_data.get("sugar_g", 0),
            sodium_mg=food_data.get("sodium_mg", 0),
            barcode=food_data.get("barcode")
        )
        
        self.db.add(food_master)
        self.db.commit()
        self.db.refresh(food_master)
        
        return self._food_master_to_dict(food_master)


