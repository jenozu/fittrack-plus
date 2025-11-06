# 🚀 FitTrack+ Deployment Guide - Phase 1 & 2 Features

## Overview

This guide covers deploying all 8 new features to your VPS at `72.60.170.192`.

---

## Pre-Deployment Checklist

### ✅ Local Testing Complete
- [ ] All features tested locally
- [ ] Backend running without errors (`uvicorn main:app --reload`)
- [ ] Frontend running without errors (`npm run dev`)
- [ ] Database migrations successful
- [ ] Badges initialized (`python init_badges.py`)
- [ ] OpenAI API key working
- [ ] No linter errors

### ✅ Environment Setup
- [ ] OpenAI API key added to VPS `.env`
- [ ] New dependencies will be installed
- [ ] Database backup created (IMPORTANT!)

---

## Deployment Steps

### Step 1: Backup Database (CRITICAL!)

```bash
# On your VPS
ssh root@72.60.170.192
cd /var/www/fittrack-plus
pg_dump fittrack_plus > backup_before_phase2_$(date +%Y%m%d).sql
```

### Step 2: Update Backend Files

#### Option A: Using Updated PowerShell Script
```powershell
# Run from your local machine
.\deploy-phase-1-2.ps1
```

#### Option B: Manual SCP (if script fails)
```bash
# Copy all new/modified backend files
scp -r backend/routers/* root@72.60.170.192:/var/www/fittrack-plus/backend/routers/
scp -r backend/schemas/* root@72.60.170.192:/var/www/fittrack-plus/backend/schemas/
scp -r backend/services/* root@72.60.170.192:/var/www/fittrack-plus/backend/services/
scp backend/models.py root@72.60.170.192:/var/www/fittrack-plus/backend/
scp backend/main.py root@72.60.170.192:/var/www/fittrack-plus/backend/
scp backend/requirements.txt root@72.60.170.192:/var/www/fittrack-plus/backend/
scp backend/init_badges.py root@72.60.170.192:/var/www/fittrack-plus/backend/
```

### Step 3: Update Frontend Files

```bash
# Copy entire frontend (will be built on VPS)
scp -r frontend/src/* root@72.60.170.192:/var/www/fittrack-plus/frontend/src/
scp frontend/package.json root@72.60.170.192:/var/www/fittrack-plus/frontend/
```

### Step 4: Deploy on VPS

SSH into your VPS:
```bash
ssh root@72.60.170.192
```

Then run these commands:

#### 4.1 Update Backend Dependencies
```bash
cd /var/www/fittrack-plus/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

#### 4.2 Add OpenAI API Key to .env
```bash
nano .env
# Add this line:
# OPENAI_API_KEY=sk-your-actual-key-here
# Save and exit (Ctrl+X, Y, Enter)
```

#### 4.3 Run Database Migrations
```bash
# Still in backend directory with venv activated
python3 -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)'
```

#### 4.4 Initialize Default Badges
```bash
python init_badges.py
```

You should see: ✅ Default badges initialized successfully!

#### 4.5 Restart Backend Service
```bash
sudo systemctl restart fittrack-backend
sudo systemctl status fittrack-backend
```

Check that it's running (green "active").

#### 4.6 Update Frontend Dependencies
```bash
cd /var/www/fittrack-plus/frontend
npm install
```

#### 4.7 Build Frontend for Production
```bash
npm run build
```

This creates optimized production files in `frontend/dist/`.

#### 4.8 Restart Nginx (if needed)
```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 5: Verify Deployment

#### 5.1 Check Backend
```bash
curl http://localhost:8000/
```

Should show all 14 features including new ones.

#### 5.2 Check Frontend
Visit: `http://72.60.170.192` (or your domain)

#### 5.3 Test Key Features
- [ ] Can log in
- [ ] Dashboard loads with smart coach
- [ ] Can create a recipe
- [ ] Can scan barcode (if camera available)
- [ ] Can view achievements
- [ ] Can export data

---

## Alternative: Docker Deployment (Recommended)

If you want containerized deployment, I can create Docker configurations. Benefits:
- Isolated environments
- Easy rollbacks
- Consistent deployments
- Better resource management

Would you like Docker setup files?

---

## Rollback Plan (If Something Goes Wrong)

### Restore Database
```bash
ssh root@72.60.170.192
psql fittrack_plus < backup_before_phase2_YYYYMMDD.sql
```

### Restore Code
```bash
cd /var/www/fittrack-plus
git stash  # If you have git
# Or manually restore from backup
```

### Restart Services
```bash
sudo systemctl restart fittrack-backend
sudo systemctl reload nginx
```

---

## Common Deployment Issues

### Issue: "Module not found" errors
**Solution:**
```bash
cd /var/www/fittrack-plus/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### Issue: OpenAI API errors
**Solution:**
- Verify API key in `.env`
- Check OpenAI account has credits
- Test with: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Issue: Database errors about missing columns
**Solution:**
```bash
# Option 1: Auto-create (safe with SQLAlchemy)
python3 -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)'

# Option 2: Use Alembic migrations (better for production)
alembic revision --autogenerate -m "Phase 1 and 2 features"
alembic upgrade head
```

### Issue: Frontend not updating
**Solution:**
```bash
cd /var/www/fittrack-plus/frontend
rm -rf dist node_modules
npm install
npm run build
sudo systemctl reload nginx
```

### Issue: CORS errors
**Solution:**
Check `backend/main.py` CORS settings:
```python
allow_origins=["http://72.60.170.192", "https://yourdomain.com"]
```

---

## Performance Optimization (After Deploy)

### Backend:
```bash
# Use multiple workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend:
```bash
# Already optimized by Vite build
# Check bundle size:
npm run build -- --report
```

### Database:
```sql
-- Add indexes for new tables (if not already there)
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_badges_slug ON badges(slug);
```

---

## Monitoring After Deployment

### Check Logs:
```bash
# Backend logs
sudo journalctl -u fittrack-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check API Health:
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "ok", "database": "connected"}
```

---

## Security Checklist

- [ ] OpenAI API key is in `.env` (not committed to git)
- [ ] `.env` file has proper permissions (chmod 600)
- [ ] Database credentials secure
- [ ] CORS configured for your domain only
- [ ] SSL/HTTPS enabled (recommended)
- [ ] Rate limiting configured (optional)

---

## Quick Deploy Commands (All-in-One)

```bash
# On VPS (after files are copied)
cd /var/www/fittrack-plus/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
python3 -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)'
python init_badges.py
deactivate
sudo systemctl restart fittrack-backend

cd /var/www/fittrack-plus/frontend
npm install
npm run build
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

---

## Post-Deployment Testing

1. **Visit your site**: `http://72.60.170.192`
2. **Create test account**
3. **Test each new feature:**
   - Create a recipe ✓
   - Log body measurements ✓
   - Try AI photo scan ✓
   - Check achievements ✓
   - Plan a meal ✓
   - Export data ✓

---

## Need Help?

- **Backend not starting**: Check `sudo journalctl -u fittrack-backend -f`
- **Frontend 404s**: Rebuild with `npm run build`
- **Database errors**: Check migrations and `.env`
- **API errors**: Check OpenAI key and credits

---

**Next:** Run the updated deployment script to push all changes to your VPS!

