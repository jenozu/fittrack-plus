"""Nutrition maths: scale per-100 g food values to an amount eaten.

Food dicts follow food_data.service: *_100g keys (sodium is sodium_mg_100g) and
a "portions" list of {"label", "grams"}.
"""

from typing import Optional

# nutrient name -> (food key, decimals). Sodium stays in mg.
_NUTRIENTS = {
    "kcal": ("kcal_100g", 1),
    "protein": ("protein_100g", 2),
    "carbs": ("carbs_100g", 2),
    "fat": ("fat_100g", 2),
    "fiber": ("fiber_100g", 2),
    "sugar": ("sugar_100g", 2),
    "sodium_mg": ("sodium_mg_100g", 2),
}


def scale(food: dict, grams: float) -> dict:
    """Return the nutrients in `grams` of `food`. Missing (None) values stay None."""
    out: dict[str, Optional[float]] = {}
    for name, (key, decimals) in _NUTRIENTS.items():
        value = food.get(key)
        out[name] = None if value is None else round(value * grams / 100, decimals)
    return out


def grams_for(food: dict, portion_label: str, quantity: float) -> float:
    """Grams for `quantity` x `portion_label`. "g" and "100 g" are always valid."""
    label = portion_label.strip().lower()
    if label == "g":
        return float(quantity)
    if label == "100 g":
        return 100.0 * quantity
    for portion in food.get("portions") or []:
        if portion["label"].strip().lower() == label:
            return portion["grams"] * quantity
    raise ValueError(f"unknown portion {portion_label!r} for food {food.get('name')!r}")
