from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text, Index
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
    goal_type = Column(String, nullable=True)  # lose, maintain, gain
    
    # Target nutrition goals
    target_calories = Column(Integer, default=2000)
    target_protein_g = Column(Float, default=150)
    target_carbs_g = Column(Float, default=200)
    target_fat_g = Column(Float, default=65)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    food_entries = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    exercise_entries = relationship("ExerciseEntry", back_populates="user", cascade="all, delete-orphan")
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")


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
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="food_entries")
    
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'entry_date'),
    )


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
