import pytest

from services.nutrition import grams_for, scale

RICE = {
    "name": "Rice",
    "kcal_100g": 89.0,
    "protein_100g": 1.1,
    "carbs_100g": 23.0,
    "fat_100g": 0.3,
    "fiber_100g": None,
    "sugar_100g": 0.1,
    "sodium_mg_100g": 1.0,
    "portions": [{"label": "1 cup (240 g)", "grams": 240.0}],
}


def test_scale_kcal_150g():
    assert scale(RICE, 150)["kcal"] == 133.5


def test_scale_keeps_none_and_rounds():
    out = scale(RICE, 150)
    assert out["fiber"] is None
    assert out["carbs"] == round(23.0 * 1.5, 2)
    assert out["sodium_mg"] == 1.5


def test_two_cups_is_480g():
    assert grams_for(RICE, "1 cup (240 g)", 2) == 480.0


def test_portion_lookup_is_case_insensitive():
    assert grams_for(RICE, "1 CUP (240 G)", 1) == 240.0


def test_g_and_100g_always_valid():
    assert grams_for(RICE, "g", 37) == 37.0
    assert grams_for(RICE, "100 g", 2) == 200.0


def test_unknown_portion_raises():
    with pytest.raises(ValueError):
        grams_for(RICE, "1 slice", 1)
