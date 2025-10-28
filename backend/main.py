# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from database import Base, engine
import models
import sys

# Import routers
from routers import auth_router, users_router, food_router, exercise_router, dashboard_router

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
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Initialization ---
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database connected successfully and tables verified.")
except OperationalError as e:
    print("❌ Database connection failed. Check your .env file or PostgreSQL server.")
    print(e)
    sys.exit(1)

# --- Include Routers ---
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(food_router)
app.include_router(exercise_router)
app.include_router(dashboard_router)

# --- Root Route ---
@app.get("/")
def root():
    """
    Root route for quick status checks.
    """
    return {
        "message": "FitTrack+ API is running! 🚀",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "User Authentication (JWT)",
            "Food Logging with Aggregation Layer",
            "Exercise Tracking",
            "Progress Analytics",
            "Streak Gamification"
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
    print("🚀 FitTrack+ API starting up...")
    print("📚 API Documentation available at: /docs")
    print("🔍 Food Aggregation Layer: Active (Nutritionix + USDA)")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 FitTrack+ API shutting down...")
