# Summary: Food Aggregation and Normalization Layer for FitTrack+

This document outlines a strategy for building a robust and scalable food database for FitTrack+ by aggregating and normalizing data from multiple external nutrition APIs. This approach replaces reliance on a single source like Edamam, creating a richer, more reliable internal food database over time.

## Core Concept: The Aggregation Layer

The central idea is to implement a **Food Aggregation and Normalization Layer** in the backend. This layer acts as a single point of entry for the frontend's food search functionality.

1.  **Parallel Querying:** The backend simultaneously queries multiple integrated APIs (e.g., **Nutritionix, USDA, Open Food Facts**).
2.  **Normalization:** Results from all external APIs are converted into a single, consistent internal schema.
3.  **Caching/Mastering:** Normalized results are stored in a dedicated **PostgreSQL `food_master` table**.
4.  **Unified Service:** The frontend only interacts with a single backend endpoint (e.g., `/food/search`), which handles the complexity of querying, normalizing, and caching.

## Key Database Schema (`food_master`)

A unified schema is essential for storing and querying the aggregated data. Key fields include:

| Field | Description | Purpose |
| :--- | :--- | :--- |
| `id` | Primary Key | Unique identifier for the food item. |
| `source` | `VARCHAR` | Identifies the original API (e.g., 'nutritionix', 'usda'). |
| `external_id` | `VARCHAR` | The ID from the source API. |
| `brand_name` | `VARCHAR` | The brand of the food item. |
| `food_name` | `VARCHAR` | The standardized name of the food item. |
| `serving_qty/unit` | `NUMERIC`/`VARCHAR` | Standardized serving size information. |
| `calories, protein, carbs, fat` | `NUMERIC` | Core macronutrient data. |
| `fiber, sugars, sodium` | `NUMERIC` | Detailed nutritional information. |
| `barcode` | `VARCHAR` | Barcode information for scanning features. |

## Backend Logic

The backend structure should include dedicated service wrappers for each external API (`nutritionix.py`, `usda.py`, etc.) and a central `food_aggregator.py` module.

The search process prioritizes the internal database:
1.  **Query Internal Cache:** Search the `food_master` table first.
2.  **External Fallback:** If the internal results are insufficient, query the external APIs.
3.  **Store New Data:** New results from external APIs are normalized and stored in the `food_master` table, effectively building a rich, self-owned database over time.

This strategy ensures long-term scalability, data consistency, and reduced reliance on any single third-party provider.
