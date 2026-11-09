# Direct VPS Deployment Commands

Run these commands on your VPS (you're already SSH'd in):

```bash
# Navigate to project
cd /var/www/fittrack-plus

# 1. Add OpenAI API key to .env (if not already there)
nano backend/.env
# Add this line at the bottom:
# OPENAI_API_KEY=sk-your-actual-key-here
# Save: Ctrl+X, Y, Enter

# 2. Install new backend dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# 3. Run database migrations (creates new tables)
python3 -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)'

# 4. Initialize default badges
python init_badges.py

# 5. Deactivate venv and restart backend
deactivate
sudo systemctl restart fittrack-backend

# 6. Install frontend dependencies
cd /var/www/fittrack-plus/frontend
npm install

# 7. Build frontend for production
npm run build

# 8. Reload nginx
sudo systemctl reload nginx

# 9. Verify everything works
curl http://localhost:8000/
curl http://localhost:8000/health

# 10. Check backend logs
sudo journalctl -u fittrack-backend -n 50
```

Done! Visit http://72.60.170.192 to see your new features!

