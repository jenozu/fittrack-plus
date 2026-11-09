# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from database import Base, engine
import models
import sys
import os

# Import routers
from routers import auth_router, users_router, food_router, exercise_router, dashboard_router
from routers import water as water_router
from routers import measurements as measurements_router
from routers import export as export_router
from routers import recipes as recipes_router
from routers import ai_meal as ai_meal_router
from routers import coaching as coaching_router
from routers import meal_plans as meal_plans_router
from routers import gamification as gamification_router

# --- Initialize the FastAPI app ---
app = FastAPI(
    title="FitTrack+ API",
    description="Backend API for FitTrack+ fitness and nutrition tracker with food aggregation layer",
    version="1.0.0",
)

# --- CORS Configuration ---
# Allows your frontend (React/Vite) to communicate with the backend.
# Replace "*" with your actual domain when deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Initialization ---
try:
    with engine.connect():
        pass
    print("[OK] Database connected successfully.")
except OperationalError as e:
    print("[ERROR] Database connection failed. Check your .env file or PostgreSQL server.")
    print(e)
    sys.exit(1)

# --- Include Routers ---
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(food_router)
app.include_router(exercise_router)
app.include_router(dashboard_router)
app.include_router(water_router.router)
app.include_router(measurements_router.router)
app.include_router(export_router.router)
app.include_router(recipes_router.router)
app.include_router(ai_meal_router.router)
app.include_router(coaching_router.router)
app.include_router(meal_plans_router.router)
app.include_router(gamification_router.router)

# --- Root Route ---
@app.get("/")
def root():
    """
    Root route for quick status checks.
    """
    return {
        "message": "FitTrack+ API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "User Authentication (JWT)",
            "Food Logging with Aggregation Layer",
            "Barcode Scanning",
            "AI Meal Recognition (GPT-4 Vision)",
            "Smart Macro Coaching",
            "Recipe Builder with Auto Nutrition",
            "Meal Planning with Grocery Lists",
            "Exercise Tracking",
            "Water Tracking",
            "Body Measurements Tracking",
            "Data Export (CSV, JSON, PDF)",
            "Progress Analytics",
            "Gamification (Badges, XP, Levels)",
            "Streak System"
        ]
    }

# --- Health Check Endpoint ---
@app.get("/health")
def health_check():
    """
    Verifies that the backend and database are online.
    """
    try:
        engine.connect()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "detail": str(e)}

# --- Lifecycle Events ---
@app.on_event("startup")
async def startup_event():
    print("[STARTUP] FitTrack+ API starting up...")
    print("[INFO] API Documentation available at: /docs")
    print("[INFO] Food Aggregation Layer: Active (Nutritionix + USDA)")

@app.on_event("shutdown")
async def shutdown_event():
    print("[SHUTDOWN] FitTrack+ API shutting down...")
