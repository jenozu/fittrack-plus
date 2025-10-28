# FitTrack+ Quick Reference

## 🚀 Quick Start Commands

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```
**Runs on**: http://localhost:8000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
**Runs on**: http://localhost:3000

## 📁 Key Files

### Backend
```
backend/
├── main.py                    # Entry point + routers
├── models.py                  # Database models
├── database.py                # DB configuration
├── .env                       # Environment variables (create from .env.example)
├── routers/                   # API endpoints
├── services/                  # Food aggregation layer
├── schemas/                   # Pydantic validation
└── utils/                     # Auth & security
```

### Frontend
```
frontend/
├── src/
│   ├── App.jsx               # Main app + routing
│   ├── main.jsx              # Entry point
│   ├── components/ui/        # Reusable components
│   ├── pages/                # Page components
│   ├── context/              # Auth context
│   └── services/api.js       # API client
├── .env                       # API URL (create from .env.example)
└── tailwind.config.js        # Pastel theme colors
```

## 🎨 Color Palette

```
Primary Pink:    #F0A7D9
Primary Blue:    #A7D9F0
Secondary Pink:  #D06CA0
Secondary Blue:  #6CA0D0
Accent Pink:     #FFC0E0
Accent Blue:     #C0E0FF
```

## 🔑 API Endpoints Summary

### Auth
- `POST /auth/register` - Register
- `POST /auth/login` - Login

### Users
- `GET /users/me` - Get profile
- `PUT /users/me` - Update profile
- `POST /users/onboarding` - Complete onboarding

### Food
- `GET /food/search?q={query}` - Search food
- `POST /food/entries` - Log food
- `GET /food/entries?entry_date={date}` - Get logs

### Exercise
- `POST /exercise/entries` - Log exercise
- `GET /exercise/entries?entry_date={date}` - Get logs

### Dashboard
- `GET /dashboard/summary?summary_date={date}` - Daily summary
- `GET /dashboard/progress/calories?days={days}` - Trends
- `GET /dashboard/streak` - Get streak

## 💡 Key Features

✅ **Food Aggregation**: Multi-source (Nutritionix + USDA) with intelligent caching  
✅ **Calorie Formula**: `Target - Consumed + Burned = Remaining`  
✅ **Streak System**: Automatic updates on daily logging  
✅ **JWT Auth**: Secure token-based authentication  
✅ **Pastel Theme**: Beautiful pink and blue UI  
✅ **Responsive**: Mobile, tablet, and desktop support  
✅ **Charts**: Interactive progress visualization  

## 🔧 Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fittrack_db
SECRET_KEY=your-secret-key-here
NUTRITIONIX_APP_ID=optional
NUTRITIONIX_APP_KEY=optional
USDA_API_KEY=optional
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
```

## 🛠️ Common Tasks

### Reset Database
```bash
cd backend
python -c "from database import Base, engine; import models; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"
```

### Install New Backend Dependency
```bash
cd backend
venv\Scripts\activate
pip install package-name
pip freeze > requirements.txt
```

### Install New Frontend Dependency
```bash
cd frontend
npm install package-name
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

### Access API Docs
http://localhost:8000/docs (Swagger UI)

## 🐛 Troubleshooting

### "Database connection failed"
- Check if PostgreSQL is running
- Verify `DATABASE_URL` in `backend/.env`
- Ensure database `fittrack_db` exists

### "Cannot connect to backend"
- Verify backend is running on port 8000
- Check `VITE_API_URL` in `frontend/.env`
- Look for CORS errors in browser console

### "Port already in use"
```bash
# Backend - use different port
uvicorn main:app --reload --port 8001

# Frontend - use different port
npm run dev -- --port 3001
```

### Frontend shows blank page
- Check browser console for errors
- Check terminal for build errors
- Try clearing browser cache
- Try `npm install` again

## 📊 Database Schema

### Main Tables
- **users**: User accounts and fitness profile
- **food_master**: Aggregated food database
- **food_entries**: User's food logs
- **exercise_entries**: User's workouts
- **streaks**: Gamification tracking
- **weight_logs**: Weight history

## 🎯 User Flow

1. **Register** → Create account
2. **Onboarding** → Set up fitness profile
3. **Dashboard** → View daily summary
4. **Log Food** → Search or add manually
5. **Log Exercise** → Track workouts
6. **Progress** → View charts and trends
7. **Profile** → Manage settings

## 📚 Documentation Files

- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup instructions
- `PROJECT_SUMMARY.md` - Complete implementation details
- `backend/README.md` - Backend documentation
- `frontend/README.md` - Frontend documentation
- `QUICK_REFERENCE.md` - This file

## 🔐 Security Notes

- JWT tokens stored in localStorage
- Passwords hashed with bcrypt
- Change `SECRET_KEY` in production
- HTTPS recommended for production
- CORS configured for all origins in dev (update for prod)

## 📦 Tech Stack

**Backend**: FastAPI, PostgreSQL, SQLAlchemy, Pydantic, JWT  
**Frontend**: React 18, Vite, Tailwind CSS, React Router, Recharts, Axios  

## 🎊 Status

✅ **Complete MVP Implementation**  
✅ **All Features Functional**  
✅ **Production-Ready Structure**  
✅ **Comprehensive Documentation**  

---

**Need detailed help?** → See `SETUP_GUIDE.md`  
**Want implementation details?** → See `PROJECT_SUMMARY.md`  
**API documentation?** → http://localhost:8000/docs  

