"""Builds tiny sample files with the same layout as the real downloads. Run by conftest."""
import csv, gzip, zipfile
from pathlib import Path


def w(path, header, rows, encoding="utf-8"):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding=encoding) as f:
        cw = csv.writer(f, quoting=csv.QUOTE_ALL)
        cw.writerow(header)
        cw.writerows(rows)


def build(root: Path):
    # ---- USDA Foundation (extracted folder, nested one level like the real zip) ----
    fd = root / "usda_foundation" / "FoodData_Central_foundation_food_csv_2026-10-29"
    w(fd / "food.csv", ["fdc_id", "data_type", "description", "food_category_id", "publication_date"], [
        ["1001", "foundation_food", "Bananas, raw", "9", "2026-10-29"],
        ["1002", "foundation_food", "Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw", "5", "2026-10-29"],
        ["1003", "sample_food", "Banana sample lot 7", "9", "2026-10-29"],  # must be skipped
        ["1004", "foundation_food", "Oil, olive, extra virgin", "4", "2026-10-29"],
    ])
    w(fd / "food_nutrient.csv", ["id", "fdc_id", "nutrient_id", "amount", "data_points", "derivation_id", "min", "max", "median", "loq", "footnote", "min_year_acquired"], [
        ["1", "1001", "2047", "97", "", "", "", "", "", "", "", ""],   # Foundation: Atwater energy only
        ["2", "1001", "1003", "0.74", "", "", "", "", "", "", "", ""],
        ["3", "1001", "1004", "0.29", "", "", "", "", "", "", "", ""],
        ["4", "1001", "1005", "23.0", "", "", "", "", "", "", "", ""],
        ["5", "1001", "1079", "1.7", "", "", "", "", "", "", "", ""],
        ["6", "1001", "2000", "15.8", "", "", "", "", "", "", "", ""],
        ["7", "1001", "1093", "1", "", "", "", "", "", "", "", ""],
        ["8", "1002", "1003", "22.5", "", "", "", "", "", "", "", ""],  # no energy at all -> computed
        ["9", "1002", "1004", "1.93", "", "", "", "", "", "", "", ""],
        ["10", "1002", "1005", "0", "", "", "", "", "", "", "", ""],
        ["11", "1003", "1008", "90", "", "", "", "", "", "", "", ""],
        ["12", "1004", "1008", "884", "", "", "", "", "", "", "", ""],
        ["13", "1004", "1004", "100", "", "", "", "", "", "", "", ""],
    ])
    w(fd / "measure_unit.csv", ["id", "name"], [["1000", "cup"], ["1001", "tablespoon"], ["9999", "undetermined"]])
    w(fd / "food_portion.csv", ["id", "fdc_id", "seq_num", "amount", "measure_unit_id", "portion_description", "modifier", "gram_weight", "data_points", "footnote", "min_year_acquired"], [
        ["1", "1001", "2", "1", "1000", "", "sliced", "150", "", "", ""],
        ["2", "1001", "1", "1", "9999", "", "medium (7\" to 7-7/8\" long)", "118", "", "", ""],
        ["3", "1004", "1", "1", "1001", "", "", "13.5", "", "", ""],
        ["4", "1004", "2", "1", "1001", "", "", "0", "", "", ""],  # zero grams -> dropped
    ])

    # ---- USDA SR Legacy (as the original zip) ----
    sr = root / "sr_tmp" / "FoodData_Central_sr_legacy_food_csv_2018-04"
    w(sr / "food.csv", ["fdc_id", "data_type", "description", "food_category_id", "publication_date"], [
        ["2001", "sr_legacy_food", "Yogurt, Greek, plain, nonfat", "1", "2019-04-01"],
        ["2002", "sr_legacy_food", "Bananas, dehydrated, or banana powder", "9", "2019-04-01"],
    ])
    w(sr / "food_nutrient.csv", ["id", "fdc_id", "nutrient_id", "amount", "data_points", "derivation_id", "min", "max", "median", "footnote", "min_year_acquired"], [
        ["1", "2001", "1008", "59", "", "", "", "", "", "", ""],
        ["2", "2001", "1003", "10.19", "", "", "", "", "", "", ""],
        ["3", "2001", "1004", "0.39", "", "", "", "", "", "", ""],
        ["4", "2001", "1005", "3.6", "", "", "", "", "", "", ""],
        ["5", "2002", "1008", "346", "", "", "", "", "", "", ""],
        ["6", "2002", "1003", "3.89", "", "", "", "", "", "", ""],
        ["7", "2002", "1004", "1.81", "", "", "", "", "", "", ""],
        ["8", "2002", "1005", "88.28", "", "", "", "", "", "", ""],
    ])
    w(sr / "measure_unit.csv", ["id", "name"], [["9999", "undetermined"]])
    w(sr / "food_portion.csv", ["id", "fdc_id", "seq_num", "amount", "measure_unit_id", "portion_description", "modifier", "gram_weight", "data_points", "footnote", "min_year_acquired"], [
        ["1", "2001", "1", "1", "9999", "", "container (6 oz)", "170", "", "", ""],
    ])
    zpath = root / "FoodData_Central_sr_legacy_food_csv_2018-04.zip"
    with zipfile.ZipFile(zpath, "w") as z:
        for p in sr.iterdir():
            z.write(p, f"{sr.name}/{p.name}")

    # ---- CNF 2015 layout (cp1252, spaced upper-case file names) ----
    c15 = root / "cnf2015"
    w(c15 / "FOOD NAME.csv", ["FoodID", "FoodCode", "FoodGroupID", "FoodSourceID", "FoodDescription", "FoodDescriptionF"], [
        ["61", "61", "1", "1", "Milk, fluid, partly skimmed, 2% M.F.", "Lait, liquide, partiellement écrémé, 2 % M.G."],
        ["5000", "5000", "20", "1", "Tourtière, homemade", "Tourtière, maison"],
    ], encoding="cp1252")
    w(c15 / "NUTRIENT NAME.csv", ["NutrientID", "NutrientCode", "NutrientSymbol", "NutrientUnit", "NutrientName", "NutrientNameF", "Tagname", "NutrientDecimals"], [
        ["203", "203", "PROT", "g", "PROTEIN", "PROTÉINES", "PROCNT", "2"],
        ["204", "204", "FAT", "g", "FAT (TOTAL LIPIDS)", "LIPIDES", "FAT", "2"],
        ["205", "205", "CARB", "g", "CARBOHYDRATE, TOTAL (BY DIFFERENCE)", "GLUCIDES", "CHOCDF", "2"],
        ["208", "208", "KCAL", "kCal", "ENERGY (KILOCALORIES)", "ÉNERGIE", "ENERC_KCAL", "0"],
        ["268", "268", "KJ", "kJ", "ENERGY (KILOJOULES)", "ÉNERGIE", "ENERC_KJ", "0"],
        ["606", "606", "SFA", "g", "FATTY ACIDS, SATURATED, TOTAL", "AG", "FASAT", "3"],
        ["291", "291", "TDF", "g", "FIBRE, TOTAL DIETARY", "FIBRES", "FIBTG", "1"],
        ["269", "269", "SUGT", "g", "SUGARS, TOTAL", "SUCRES", "SUGAR", "2"],
        ["307", "307", "NA", "mg", "SODIUM", "SODIUM", "NA", "0"],
    ], encoding="cp1252")
    w(c15 / "NUTRIENT AMOUNT.csv", ["FoodID", "NutrientID", "NutrientValue", "StandardError", "NumberofObservations", "NutrientSourceID", "NutrientDateOfEntry"], [
        ["61", "208", "50", "", "", "", ""], ["61", "203", "3.3", "", "", "", ""],
        ["61", "204", "1.9", "", "", "", ""], ["61", "205", "4.8", "", "", "", ""],
        ["61", "606", "1.2", "", "", "", ""], ["61", "307", "44", "", "", "", ""],
        ["5000", "208", "290", "", "", "", ""], ["5000", "203", "11", "", "", "", ""],
        ["5000", "204", "18", "", "", "", ""], ["5000", "205", "21", "", "", "", ""],
    ], encoding="cp1252")
    w(c15 / "MEASURE NAME.csv", ["MeasureID", "MeasureDescription", "MeasureDescriptionF"], [
        ["341", "250ml", "250ml"], ["1489", "1 cup", "1 tasse"], ["900", "1 slice (1/8 of 9\" pie)", "1 pointe"],
    ], encoding="cp1252")
    w(c15 / "CONVERSION FACTOR.csv", ["FoodID", "MeasureID", "ConversionFactorValue", "ConvFactorDateOfEntry"], [
        ["61", "341", "2.58", ""], ["61", "1489", "2.44", ""], ["5000", "900", "1.6", ""],
    ], encoding="cp1252")

    # ---- CNF 2026-style guess (snake_case files, grams column) ----
    c26 = root / "cnf2026"
    w(c26 / "food_name.csv", ["food_id", "food_code", "food_description_e", "food_description_f"], [
        ["61", "61", "Milk, fluid, partly skimmed, 2% M.F.", "Lait"]])
    w(c26 / "nutrient_name.csv", ["nutrient_id", "nutrient_code", "nutrient_unit", "nutrient_name_e"], [
        ["1", "208", "kCal", "ENERGY (KILOCALORIES)"], ["2", "203", "g", "PROTEIN"],
        ["3", "204", "g", "FAT (TOTAL LIPIDS)"], ["4", "205", "g", "CARBOHYDRATE, TOTAL (BY DIFFERENCE)"]])
    w(c26 / "nutrient_amount.csv", ["food_id", "nutrient_id", "nutrient_value"], [
        ["61", "1", "50"], ["61", "2", "3.3"], ["61", "3", "1.9"], ["61", "4", "4.8"]])
    w(c26 / "measure_name.csv", ["measure_id", "measure_description_e"], [["341", "250ml"]])
    w(c26 / "measure_weight_conversion.csv", ["food_id", "measure_id", "measure_weight_g"], [["61", "341", "258"]])

    # ---- Open Food Facts CSV export (tab separated, no quoting, gzipped) ----
    cols = ["code", "url", "creator", "product_name", "generic_name", "quantity", "brands",
            "countries_tags", "serving_size", "serving_quantity", "unique_scans_n",
            "energy-kcal_100g", "energy_100g", "fat_100g", "carbohydrates_100g", "sugars_100g",
            "fiber_100g", "proteins_100g", "sodium_100g"]
    rows = [
        ["0055577102152", "u", "c", "Shreddies", "", "", "Post", "en:canada", "1 cup (40 g)", "40", "120", "357", "1494", "1.7", "81", "13", "11", "9.5", "0.4"],
        ["068100084245", "u", "c", "Kraft Dinner Original", "", "", "Kraft,Kraft Heinz", "en:canada,en:united-states", "", "", "300", "", "1569", "3.5", "70", "8", "2.4", "11", "0.75"],
        ["3017620422003", "u", "c", "Nutella", "", "", "Ferrero", "en:france", "15 g", "15", "9000", "539", "2252", "30.9", "57.5", "56.3", "", "6.3", "0.0428"],
        ["0000000000001", "u", "c", "Broken \"quote product", "", "", "X", "en:canada", "", "", "", "5000", "", "1", "1", "1", "", "1", ""],
        ["0627843000001", "u", "c", "Greek Yogurt 0% Plain", "", "", "Oikos", "en:canada", "3/4 cup (175 g)", "175", "40", "59", "", "0", "4", "4", "", "10", "0.04"],
        ["0627843000002", "u", "c", "", "", "", "Nameless", "en:canada", "", "", "", "100", "", "1", "1", "1", "", "1", ""],
        ["0627843000003", "u", "c", "Mislabelled Bar", "", "", "Z", "en:canada", "", "", "", "100", "", "40", "40", "1", "", "20", ""],
    ]
    with gzip.open(root / "off.csv.gz", "wt", encoding="utf-8") as f:
        f.write("\t".join(cols) + "\n")
        for r in rows:
            f.write("\t".join(r) + "\n")
