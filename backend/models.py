from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Index, Boolean, BigInteger, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Users table with enhanced fitness profile
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    # Fitness profile fields
    gender = Column(String, nullable=True)  # male, female, other
    date_of_birth = Column(Date, nullable=True)
    height_cm = Column(Float, nullable=True)
    current_weight_kg = Column(Float, nullable=True)
    goal_weight_kg = Column(Float, nullable=True)
    activity_level = Column(String, nullable=True)  # sedentary, light, moderate, active, very_active
    goal_type = Column(String, nullable=True)  # lose_weight, recomp, maintain, lean_bulk, bulk
    
    # Target nutrition goals
    target_calories = Column(Integer, default=2000)
    target_protein_g = Column(Float, default=150)
    target_carbs_g = Column(Float, default=200)
    target_fat_g = Column(Float, default=65)
    
    # Water goal (in 8oz cups)
    water_goal_cups = Column(Float, default=8.0)
    
    # AI meal recognition usage tracking
    ai_scans_used = Column(Integer, default=0)
    ai_scans_reset_date = Column(Date, nullable=True)
    ai_scans_monthly_limit = Column(Integer, default=5)  # Free tier: 5/month
    
    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    food_entries = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    exercise_entries = relationship("ExerciseEntry", back_populates="user", cascade="all, delete-orphan")
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    water_logs = relationship("WaterLog", back_populates="user", cascade="all, delete-orphan")
    body_measurements = relationship("BodyMeasurement", back_populates="user", cascade="all, delete-orphan")


# Food Master table for aggregation layer
class FoodMaster(Base):
    __tablename__ = "food_master"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)  # nutritionix, usda, custom
    external_id = Column(String, nullable=True, index=True)
    food_name = Column(String, nullable=False, index=True)
    brand_name = Column(String, nullable=True)
    
    # Serving information
    serving_qty = Column(Float, default=1.0)
    serving_unit = Column(String, default="serving")
    serving_weight_g = Column(Float, nullable=True)
    
    # Core nutrition data (per serving)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, default=0)
    carbs_g = Column(Float, default=0)
    fat_g = Column(Float, default=0)
    
    # Detailed nutrition
    fiber_g = Column(Float, default=0)
    sugar_g = Column(Float, default=0)
    sodium_mg = Column(Float, default=0)
    
    # Barcode for scanner feature
    barcode = Column(String, nullable=True, index=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Composite index for efficient searching
    __table_args__ = (
        Index('idx_food_search', 'food_name', 'brand_name'),
    )


# Food tracking table
class FoodEntry(Base):
    __tablename__ = "food_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    food_name = Column(String, nullable=False)
    brand_name = Column(String, nullable=True)
    
    # Nutrition data (for this specific entry)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, default=0)
    carbs_g = Column(Float, default=0)
    fat_g = Column(Float, default=0)
    
    # Serving information
    quantity = Column(Float, default=1.0)
    unit = Column(String, default="serving")
    
    # Meal categorization
    meal_type = Column(String, nullable=True)  # breakfast, lunch, dinner, snack
    entry_date = Column(Date, nullable=False, index=True)
    
    # Reference to food master (if applicable)
    food_master_id = Column(Integer, ForeignKey("food_master.id"), nullable=True)

    # Local food database link (foods is defined in food_data)
    food_id = Column(BigInteger, ForeignKey("foods.id", ondelete="SET NULL"), nullable=True, index=True)
    grams = Column(Float, nullable=True)
    portion_label = Column(Text, nullable=True)
    fiber_g = Column(Float, nullable=True)
    sugar_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="food_entries")
    
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'entry_date'),
    )


class FavouriteFood(Base):
    __tablename__ = "favourite_foods"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # FK to foods(id) is added by the migration only if foods exists (foods is owned by food_data/schema.sql)
    food_id = Column(BigInteger, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('user_id', 'food_id', name='uq_favourite_foods_user_food'),)


# Exercise tracking table
class ExerciseEntry(Base):
    __tablename__ = "exercise_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    exercise_name = Column(String, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    calories_burned = Column(Float, default=0)
    
    entry_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="exercise_entries")
    
    __table_args__ = (
        Index('idx_user_exercise_date', 'user_id', 'entry_date'),
    )


# Streak tracking for gamification
class Streak(Base):
    __tablename__ = "streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_logged_date = Column(Date, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="streak")


# Weight log for progress tracking
class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    weight_kg = Column(Float, nullable=False)
    log_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="weight_logs")
    
    __table_args__ = (
        Index('idx_user_weight_date', 'user_id', 'log_date'),
    )


# Water log for hydration tracking
class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    cups = Column(Float, default=0)  # 8oz cups
    ml = Column(Float, default=0)  # milliliters
    log_date = Column(Date, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="water_logs")
    
    __table_args__ = (
        Index('idx_user_water_date', 'user_id', 'log_date'),
    )


# Body measurements for progress tracking
class BodyMeasurement(Base):
    __tablename__ = "body_measurements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    measurement_date = Column(Date, nullable=False, index=True)
    
    # Measurements in centimeters
    waist_cm = Column(Float, nullable=True)
    hips_cm = Column(Float, nullable=True)
    chest_cm = Column(Float, nullable=True)
    arms_cm = Column(Float, nullable=True)  # Biceps
    thighs_cm = Column(Float, nullable=True)
    calves_cm = Column(Float, nullable=True)
    neck_cm = Column(Float, nullable=True)
    shoulders_cm = Column(Float, nullable=True)
    
    # Body composition (optional)
    body_fat_percentage = Column(Float, nullable=True)
    muscle_mass_kg = Column(Float, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="body_measurements")
    
    __table_args__ = (
        Index('idx_user_measurement_date', 'user_id', 'measurement_date'),
    )


# Recipes for meal planning
class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    servings = Column(Float, default=1.0, nullable=False)
    prep_time_minutes = Column(Integer, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    is_public = Column(Boolean, default=False)  # For future sharing feature
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="recipes")
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")


# Recipe ingredients linking to food master
class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    food_master_id = Column(Integer, ForeignKey("food_master.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    food = relationship("FoodMaster")


# Meal Plans for weekly planning
class MealPlan(Base):
    __tablename__ = "meal_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    week_start_date = Column(Date, nullable=False, index=True)
    week_end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="meal_plans")
    planned_meals = relationship("PlannedMeal", back_populates="meal_plan", cascade="all, delete-orphan")


# Individual planned meals in a meal plan
class PlannedMeal(Base):
    __tablename__ = "planned_meals"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_date = Column(Date, nullable=False)
    meal_type = Column(String, nullable=False)  # breakfast, lunch, dinner, snack
    
    # Can be either a recipe or a custom meal
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    custom_meal_name = Column(String, nullable=True)
    
    notes = Column(Text, nullable=True)
    
    # Relationships
    meal_plan = relationship("MealPlan", back_populates="planned_meals")
    recipe = relationship("Recipe")


# Grocery lists generated from meal plans
class GroceryList(Base):
    __tablename__ = "grocery_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    meal_plan = relationship("MealPlan", backref="grocery_lists")
    items = relationship("GroceryItem", back_populates="grocery_list", cascade="all, delete-orphan")


# Individual items in a grocery list
class GroceryItem(Base):
    __tablename__ = "grocery_items"
    
    id = Column(Integer, primary_key=True, index=True)
    grocery_list_id = Column(Integer, ForeignKey("grocery_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    food_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    category = Column(String, nullable=True)  # produce, protein, dairy, etc.
    is_checked = Column(Boolean, default=False)
    
    # Relationships
    grocery_list = relationship("GroceryList", back_populates="items")


# Badge definitions (achievement types)
class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)  # e.g., "streak_7_days"
    name = Column(String, nullable=False)  # e.g., "Week Warrior"
    description = Column(Text, nullable=False)
    icon = Column(String, nullable=True)  # Emoji or icon name
    category = Column(String, nullable=False)  # streak, protein, consistency, milestone
    xp_reward = Column(Integer, default=100)
    
    # Criteria for earning (stored as JSON-like text for flexibility)
    criteria_type = Column(String, nullable=False)  # streak, total_protein, days_logged, etc.
    criteria_value = Column(Integer, nullable=False)  # e.g., 7 for 7-day streak
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge")


# User's earned badges
class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)
    
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="badges")
    badge = relationship("Badge", back_populates="user_badges")

    __table_args__ = (
        Index('idx_user_badge_unique', 'user_id', 'badge_id', unique=True),
    )


# Food database tables. Owned by food_data/schema.sql (not Alembic); read through food_data.service.
# Generated columns (search_text, search_vec) are intentionally not declared.
class Food(Base):
    __tablename__ = "foods"
    __table_args__ = {"info": {"managed_by": "food_data"}}

    id = Column(Integer, primary_key=True)
    source = Column(String, nullable=False)
    source_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String)
    barcode = Column(String)
    kcal_100g = Column(Float, nullable=False)
    protein_100g = Column(Float, nullable=False, default=0)
    carbs_100g = Column(Float, nullable=False, default=0)
    fat_100g = Column(Float, nullable=False, default=0)
    fiber_100g = Column(Float)
    sugar_100g = Column(Float)
    sodium_mg_100g = Column(Float)
    serving_g = Column(Float)
    serving_label = Column(String)
    popularity = Column(Integer, nullable=False, default=0)
    quality = Column(String, nullable=False, default="ok")
    created_by_user = Column(Integer)
    updated_at = Column(DateTime(timezone=True))


class FoodPortion(Base):
    __tablename__ = "food_portions"
    __table_args__ = {"info": {"managed_by": "food_data"}}

    id = Column(Integer, primary_key=True)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    label = Column(String, nullable=False)
    grams = Column(Float, nullable=False)
    seq = Column(Integer, nullable=False, default=0)
