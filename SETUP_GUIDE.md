# FitTrack+ Complete Setup Guide

This guide will walk you through setting up the FitTrack+ application from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Python 3.8+** installed (`python --version`)
- [ ] **Node.js 16+** and npm installed (`node --version`, `npm --version`)
- [ ] **PostgreSQL 12+** installed and running
- [ ] A terminal/command prompt
- [ ] A code editor (VS Code recommended)

## 🗄️ Database Setup

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and follow prompts
- Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fittrack_db;

# Create user (optional, for better security)
CREATE USER fittrack_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fittrack_db TO fittrack_user;

# Exit
\q
```

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Your terminal should now show (venv) prefix
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- FastAPI
- Uvicorn
- SQLAlchemy
- Psycopg2 (PostgreSQL adapter)
- Pydantic
- Python-Jose (JWT)
- Passlib (Password hashing)
- And more...

### 4. Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
# Copy the example file
cp .env.example .env

# Edit with your favorite editor
# Windows: notepad .env
# macOS/Linux: nano .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fittrack_db

# Security - IMPORTANT: Change this to a random secret key
SECRET_KEY=your-super-secret-key-change-this-in-production

# Optional: External API Keys (System uses mock data if not provided)
# Sign up at https://developer.nutritionix.com/
NUTRITIONIX_APP_ID=your_app_id_here
NUTRITIONIX_APP_KEY=your_app_key_here

# Sign up at https://fdc.nal.usda.gov/api-key-signup.html
USDA_API_KEY=your_usda_api_key_here
```

**💡 Tip:** To generate a secure SECRET_KEY, run:
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Initialize Database Tables

The application will automatically create tables on first run, but you can verify:

```bash
python -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine); print('✅ Database tables created successfully!')"
```

### 6. Start the Backend Server

```bash
uvicorn main:app --reload
```

You should see:
```
✅ Database connected successfully and tables verified.
🚀 FitTrack+ API starting up...
📚 API Documentation available at: /docs
🔍 Food Aggregation Layer: Active (Nutritionix + USDA)
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 7. Verify Backend

Open your browser to:
- http://localhost:8000 - Should show API welcome message
- http://localhost:8000/docs - Interactive API documentation (Swagger UI)

**Keep this terminal running!** Open a new terminal for the frontend.

## 🎨 Frontend Setup

### 1. Open New Terminal and Navigate to Frontend

```bash
# From project root
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- And more...

Wait for installation to complete (may take a few minutes).

### 3. Configure Environment Variables

The frontend `.env.example` should already be present. Create your `.env`:

```bash
# Copy example
cp .env.example .env
```

The default configuration should work:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Start the Frontend Server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 5. Open the Application

Open your browser to:
- http://localhost:3000

You should see the FitTrack+ login page with the beautiful pastel pink and blue theme!

## 🎉 First Time Usage

### 1. Register an Account

- Click "Sign Up" on the login page
- Fill in your information:
  - Email
  - Password (minimum 6 characters)
  - First and Last Name (optional)
- Click "Create Account"

### 2. Complete Onboarding

You'll be guided through a 3-step onboarding process:

**Step 1: Personal Information**
- Gender
- Date of Birth

**Step 2: Physical Stats**
- Height (cm)
- Current Weight (kg)
- Goal Weight (kg)

**Step 3: Fitness Goals**
- Activity Level
- Goal Type (Lose, Maintain, or Gain Weight)

The system will automatically calculate your target calories and macros!

### 3. Explore the Dashboard

After onboarding, you'll see:
- Your daily calorie summary
- Macronutrient breakdown
- Current streak (starts at 0)
- Quick action buttons

### 4. Log Your First Meal

1. Click "Log Food" or navigate to Food section
2. Click "Search Food"
3. Try searching for "chicken breast" or "banana"
4. Click on a search result to add it
5. Watch your dashboard update in real-time!

### 5. Log an Exercise

1. Navigate to Exercise section
2. Click "Log Exercise"
3. Enter exercise name (e.g., "Running")
4. Enter duration (e.g., 30 minutes)
5. Optionally add calories burned
6. Submit

### 6. Check Your Progress

1. Navigate to Progress section
2. View your calorie and macro trends
3. Change the time period (7, 14, 30, or 90 days)

## 🛠️ Development Workflow

### Running Both Servers

You need TWO terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Making Code Changes

**Backend Changes:**
- Edit Python files in `backend/`
- Server auto-reloads with `--reload` flag
- Check terminal for errors

**Frontend Changes:**
- Edit React files in `frontend/src/`
- Vite hot-reloads automatically
- Check browser console for errors

### Accessing API Documentation

While backend is running, visit:
- http://localhost:8000/docs - Interactive Swagger UI
- Test endpoints directly from the browser
- See all request/response schemas

## 🐛 Troubleshooting

### Backend Issues

**"Database connection failed"**
```bash
# Check if PostgreSQL is running
# Windows: Check Services app
# macOS: brew services list
# Linux: sudo systemctl status postgresql

# Verify database exists
psql -U postgres -c "\l"

# Check DATABASE_URL in .env matches your setup
```

**"Module not found" errors**
```bash
# Make sure virtual environment is activated
# Should see (venv) in terminal prompt

# Reinstall dependencies
pip install -r requirements.txt
```

**Port 8000 already in use**
```bash
# Kill the process or use different port
uvicorn main:app --reload --port 8001

# Update frontend/.env to match:
VITE_API_URL=http://localhost:8001
```

### Frontend Issues

**"Cannot connect to backend"**
- Verify backend is running on correct port
- Check `VITE_API_URL` in `frontend/.env`
- Check browser console for CORS errors
- Backend CORS is configured to allow all origins in development

**"npm install" fails**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Page is blank**
- Check browser console for errors
- Check terminal for build errors
- Try clearing browser cache
- Try incognito/private browsing mode

## 🚀 Next Steps

### Development
- Explore the codebase
- Read backend/README.md and frontend/README.md
- Check out the API documentation at /docs
- Modify colors in tailwind.config.js

### Production Deployment
- See deployment sections in respective READMEs
- Update SECRET_KEY to production value
- Configure production DATABASE_URL
- Set up production environment variables
- Build frontend: `npm run build`
- Deploy backend to Heroku/AWS/Railway
- Deploy frontend to Vercel/Netlify

### Adding Real API Keys

To enable real food data (optional):

1. **Nutritionix:**
   - Sign up at https://developer.nutritionix.com/
   - Get App ID and App Key
   - Add to `backend/.env`

2. **USDA:**
   - Sign up at https://fdc.nal.usda.gov/api-key-signup.html
   - Get API Key
   - Add to `backend/.env`

Without these keys, the system uses comprehensive mock data for development.

## 📚 Additional Resources

- **Main README.md** - Project overview
- **backend/README.md** - Backend documentation
- **frontend/README.md** - Frontend documentation
- **PRD and MVP docs** - Product specifications

## ✅ Setup Verification Checklist

Before considering setup complete:

- [ ] PostgreSQL is running and database created
- [ ] Backend server starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Frontend server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can register a new account
- [ ] Can complete onboarding process
- [ ] Can see dashboard with data
- [ ] Can search for food and add entries
- [ ] Can log exercise
- [ ] Can view progress charts

## 🎊 Congratulations!

You've successfully set up FitTrack+! Start tracking your fitness journey and enjoy the beautiful interface.

**Need help?** Check the troubleshooting section or review the detailed READMEs in each directory.

Happy tracking! 💪🏃‍♀️🥗

