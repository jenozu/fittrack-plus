# FitTrack+ Application Design

This document outlines the architectural and UI/UX design for the FitTrack+ Minimum Viable Product (MVP), a fitness tracking application inspired by MyFitnessPal. The primary goal is to provide a functional, reliable, and engaging platform for users to log meals, track exercise, and monitor progress, all while adhering to a visually appealing pastel pink and blue color scheme.

## 1. Core MVP Features

The MVP focuses on essential functionalities to ensure a robust and valuable initial release:

| Category                  | Feature               | Description                                       |
| :------------------------ | :-------------------- | :------------------------------------------------ |
| **Authentication**        | User Accounts         | Email + Password + OAuth (Google, Apple) login    |
|                           | Onboarding            | Collect weight, height, goal (lose/gain/maintain) |
| **Food Tracking**         | Food Search           | Search verified database (Edamam API or USDA)     |
|                           | Manual Entry          | Add custom meals and recipes                      |
| **Exercise Tracking**     | Workout Log           | Add custom workouts with calories burned          |
| **Analytics & Dashboard** | Progress View         | Visualize weight, calories, macros                |
|                           | Daily Summary         | Calorie in/out balance + macros                   |
| **Gamification**          | Streak System         | Reward consistent daily logs                      |

## 2. MVP User Flow

The core user journey is designed to be intuitive and streamlined:

1.  **Sign-Up / Login**: Users can register or log in via email, Google, or Apple.
2.  **Onboarding Wizard**: Users input personal details like age, gender, weight, height, and fitness goals.
3.  **Dashboard**: Displays a summary of progress and streak counter.
4.  **Log Meal**: Users can search for food or manually add entries to their daily log.
5.  **Log Exercise**: Users can add custom workouts.
6.  **View Analytics**: Provides visual representations of calories, macros, and progress charts.
7.  **Profile Settings**: Allows users to manage their account.

## 3. Architecture Design

The application will follow a client-server architecture, separating the frontend mobile application from the backend API and database.

### Frontend (Mobile Application)

*   **Technology**: React Native with Expo for cross-platform development (iOS and Android).
*   **Components**: Modular and reusable UI components for consistency and maintainability.
*   **State Management**: Context API or Redux for managing application state.
*   **Navigation**: React Navigation for handling screen transitions.

### Backend (API Server)

*   **Technology**: FastAPI (Python) for building a high-performance, asynchronous API.
*   **Web Server**: Uvicorn for serving the FastAPI application.
*   **ORM**: SQLAlchemy for object-relational mapping to interact with the database.
*   **Data Validation**: Pydantic for data parsing and validation.
*   **Migrations**: Alembic for database schema migrations.
*   **Authentication**: JWT (JSON Web Tokens) for secure user authentication and authorization.

### Database

*   **Technology**: PostgreSQL for robust and scalable relational data storage.
*   **Caching**: Redis for session management and frequently accessed data caching.

## 4. High-Level API Endpoints

The backend API will expose endpoints for managing users, food entries, exercise logs, and progress data.

| Endpoint                 | Method | Description                                    |
| :----------------------- | :----- | :--------------------------------------------- |
| `/auth/register`         | POST   | Register a new user                            |
| `/auth/login`            | POST   | Authenticate user and return JWT token         |
| `/users/me`              | GET    | Retrieve current user's profile                |
| `/users/me`              | PUT    | Update current user's profile                  |
| `/food_entries`          | POST   | Log a new food entry                           |
| `/food_entries/{id}`     | GET    | Retrieve a specific food entry                 |
| `/food_entries/{id}`     | PUT    | Update a food entry                            |
| `/food_entries/{id}`     | DELETE | Delete a food entry                            |
| `/exercise_entries`      | POST   | Log a new exercise entry                       |
| `/exercise_entries/{id}` | GET    | Retrieve a specific exercise entry             |
| `/exercise_entries/{id}` | PUT    | Update an exercise entry                       |
| `/exercise_entries/{id}` | DELETE | Delete an exercise entry                       |
| `/dashboard/summary`     | GET    | Get daily calorie/macro summary                |
| `/dashboard/progress`    | GET    | Get historical progress data for charts        |
| `/streaks`               | GET    | Retrieve user's current streak information     |

## 5. High-Level Database Schema

Key tables and their relationships:

*   **Users**: `id`, `email`, `hashed_password`, `first_name`, `last_name`, `gender`, `date_of_birth`, `height_cm`, `current_weight_kg`, `goal_weight_kg`, `activity_level`, `target_calories`, `target_protein`, `target_carbs`, `target_fat`, `created_at`, `updated_at`.
*   **FoodEntries**: `id`, `user_id` (FK to Users), `food_name`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `quantity`, `unit`, `meal_type`, `entry_date`, `created_at`.
*   **ExerciseEntries**: `id`, `user_id` (FK to Users), `exercise_name`, `calories_burned`, `duration_minutes`, `entry_date`, `created_at`.
*   **Streaks**: `id`, `user_id` (FK to Users), `current_streak`, `last_logged_date`, `longest_streak`, `created_at`, `updated_at`.

## 6. UI/UX Design Principles & Color Scheme

The user interface will prioritize **simplicity, clarity, and motivation**. The design will be clean, with intuitive navigation and clear data visualization.

### Color Palette

Adhering to the request for **pastel pinks and blues**, the primary color palette will be:

*   **Primary Blue**: `#A7D9F0` (Light Sky Blue) - Used for main interactive elements, headers, and positive indicators.
*   **Primary Pink**: `#F0A7D9` (Light Pink) - Used for accents, secondary interactive elements, and motivational elements.
*   **Secondary Blue**: `#6CA0D0` (Periwinkle) - For subtle backgrounds, borders, and less prominent text.
*   **Secondary Pink**: `#D06CA0` (Rose Pink) - For highlights, warnings, or complementary accents.
*   **Neutral Tones**: Soft grays (`#E0E0E0`, `#B0B0B0`) and white (`#FFFFFF`) for backgrounds, text, and card elements to ensure readability and a calming aesthetic.

### Typography

*   **Font Family**: A clean, modern sans-serif font (e.g., Inter, Lato, or Open Sans) for optimal readability across different screen sizes.
*   **Hierarchy**: Clear typographic hierarchy using varying font sizes and weights for headings, subheadings, and body text.

### Iconography

*   Simple, line-based icons that complement the pastel aesthetic and maintain a clean look.

### Overall Feel

The application will aim for a **calm, encouraging, and user-friendly** feel, avoiding overly vibrant or aggressive colors. The pastel scheme will contribute to a sense of well-being and ease of use, making the fitness tracking experience more pleasant.

## 7. Technology Stack Details

*   **Frontend:** React Native with Expo CLI for development and build process.
*   **Backend:** FastAPI, Uvicorn, SQLAlchemy (ORM), Pydantic (data validation), Alembic (migrations).
*   **Database:** PostgreSQL.
*   **Authentication:** JWT for API token management.
*   **External APIs:** Edamam (food database), Stripe (payments), Firebase (notifications, analytics).

This comprehensive design provides a solid foundation for the FitTrack+ MVP, focusing on core functionality, user experience, and the requested aesthetic. The next step will be to set up the development environment and begin implementing these features.
