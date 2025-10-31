"""
Open Food Facts API Service
This service interfaces with the Open Food Facts API for food data.
Open Food Facts is a free, open, crowdsourced database of food products.

Website: https://world.openfoodfacts.org/
API Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
"""

import requests
from typing import List, Dict, Optional


class OpenFoodFactsService:
    """Service for interacting with Open Food Facts API"""
    
    def __init__(self):
        self.base_url = "https://world.openfoodfacts.org"
        self.api_version = "api/v2"
        # User agent is recommended by Open Food Facts
        self.headers = {
            "User-Agent": "FitTrackPlus - Nutrition Tracking App - Version 1.0"
        }
        
    def search_food(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for food items using Open Food Facts API.
        
        Args:
            query: Search term
            limit: Maximum number of results
            
        Returns:
            List of food items with nutrition data
        """
        try:
            # Search endpoint
            url = f"{self.base_url}/cgi/search.pl"
            
            params = {
                "search_terms": query,
                "page_size": limit,
                "json": 1,
                "fields": "product_name,brands,nutriments,serving_size,serving_quantity,"
                         "code,nutrition_grade_fr,categories,image_url"
            }
            
            response = requests.get(url, params=params, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_openfoodfacts_response(data)
            else:
                print(f"[OPENFOODFACTS] Error: Status {response.status_code}")
                return []
                
        except Exception as e:
            print(f"[OPENFOODFACTS] Exception during search: {e}")
            return []
    
    def search_by_barcode(self, barcode: str) -> Optional[Dict]:
        """
        Search for a food item by barcode/UPC.
        
        Args:
            barcode: UPC/EAN barcode string
            
        Returns:
            Food item data if found
        """
        try:
            # Product endpoint
            url = f"{self.base_url}/api/v2/product/{barcode}.json"
            
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1:  # Product found
                    product = data.get("product", {})
                    return self._parse_single_product(product)
            
            return None
            
        except Exception as e:
            print(f"[OPENFOODFACTS] Exception during barcode lookup: {e}")
            return None
    
    def _parse_openfoodfacts_response(self, data: Dict) -> List[Dict]:
        """Parse Open Food Facts API response into standardized format"""
        results = []
        
        for product in data.get("products", []):
            parsed = self._parse_single_product(product)
            if parsed:
                results.append(parsed)
        
        return results
    
    def _parse_single_product(self, product: Dict) -> Optional[Dict]:
        """Parse a single product into standardized format"""
        try:
            nutriments = product.get("nutriments", {})
            
            # Get serving size (default to 100g if not specified)
            serving_qty = float(product.get("serving_quantity", 100))
            serving_unit = product.get("serving_quantity_unit", "g")
            
            # Convert serving to grams if possible
            serving_weight_g = serving_qty if serving_unit in ["g", "ml"] else 100
            
            return {
                "source": "openfoodfacts",
                "external_id": product.get("code", ""),
                "food_name": product.get("product_name", "Unknown Product"),
                "brand_name": product.get("brands"),
                "serving_qty": serving_qty,
                "serving_unit": serving_unit,
                "serving_weight_g": serving_weight_g,
                # Nutriments per 100g
                "calories": nutriments.get("energy-kcal_100g", 0),
                "protein_g": nutriments.get("proteins_100g", 0),
                "carbs_g": nutriments.get("carbohydrates_100g", 0),
                "fat_g": nutriments.get("fat_100g", 0),
                "fiber_g": nutriments.get("fiber_100g", 0),
                "sugar_g": nutriments.get("sugars_100g", 0),
                "sodium_mg": nutriments.get("sodium_100g", 0) * 1000 if nutriments.get("sodium_100g") else 0,  # Convert g to mg
                "barcode": product.get("code"),
                "image_url": product.get("image_url"),
                "nutrition_grade": product.get("nutrition_grade_fr"),  # A-E rating
                "categories": product.get("categories", "").split(",") if product.get("categories") else []
            }
            
        except Exception as e:
            print(f"[OPENFOODFACTS] Error parsing product: {e}")
            return None
    
    def get_product_by_id(self, product_id: str) -> Optional[Dict]:
        """
        Get detailed product information by Open Food Facts ID.
        This is essentially the same as barcode lookup since IDs are barcodes.
        
        Args:
            product_id: Open Food Facts product ID (barcode)
            
        Returns:
            Detailed food data if found
        """
        return self.search_by_barcode(product_id)


# Test function
if __name__ == "__main__":
    print("Testing Open Food Facts Service...")
    service = OpenFoodFactsService()
    
    # Test search
    print("\n1. Testing search for 'greek yogurt':")
    results = service.search_food("greek yogurt", limit=3)
    for food in results:
        print(f"  - {food['food_name']} ({food.get('brand_name', 'No brand')})")
        print(f"    Calories: {food['calories']} kcal/100g")
    
    # Test barcode (Nutella barcode as example)
    print("\n2. Testing barcode lookup (3017620422003 - Nutella):")
    result = service.search_by_barcode("3017620422003")
    if result:
        print(f"  Found: {result['food_name']} by {result.get('brand_name', 'Unknown')}")
        print(f"  Calories: {result['calories']} kcal/100g")
        print(f"  Nutrition Grade: {result.get('nutrition_grade', 'N/A')}")
    else:
        print("  Product not found")

