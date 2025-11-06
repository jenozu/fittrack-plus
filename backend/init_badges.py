"""
Initialize Default Badges
Run this script once to populate the badge definitions in the database.
"""

from database import SessionLocal
from services.gamification_service import initialize_default_badges

def main():
    db = SessionLocal()
    try:
        print("Initializing default badges...")
        initialize_default_badges(db)
        print("✅ Default badges initialized successfully!")
        print("Check /docs endpoint to see the gamification API endpoints.")
    except Exception as e:
        print(f"❌ Error initializing badges: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()

