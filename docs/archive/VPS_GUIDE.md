# 🚀 FitTrack+ VPS Deployment Guide

Complete guide to deploy FitTrack+ to your Ubuntu VPS in simple terms.

---

## 📋 Overview: What We're Going to Do

```
Your Computer → GitHub → Ubuntu VPS
                           ↓
                    Install Everything
                           ↓
                    Run FitTrack+
```

---

## 📦 Part 1: Push Your Code to GitHub

### Step 1: Initialize Git

- [ ] Open PowerShell in your FitTrack+ project folder
  ```bash
  cd C:\Users\andel\Desktop\FTP\fittrack-plus
  ```

- [ ] Initialize Git and commit your code
  ```bash
  git init
  git add .
  git commit -m "Initial FitTrack+ implementation"
  ```

### Step 2: Create GitHub Repository

- [ ] Go to https://github.com
- [ ] Click the **"+"** button (top right) → **"New repository"**
- [ ] Name it: `fittrack-plus`
- [ ] **Don't** check any boxes (no README, no .gitignore)
- [ ] Click **"Create repository"**

### Step 3: Push to GitHub

- [ ] Run these commands (replace `YOUR_USERNAME` with your GitHub username):
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/fittrack-plus.git
  git branch -M main
  git push -u origin main
  ```

✅ **Checkpoint**: Your code is now on GitHub!

---

## 🖥️ Part 2: Prepare Your Ubuntu VPS

### Step 1: Connect to Your VPS

- [ ] Connect via SSH:
  ```bash
  ssh root@YOUR_VPS_IP_ADDRESS
  ```
  Or if you have a username:
  ```bash
  ssh your_username@YOUR_VPS_IP_ADDRESS
  ```

### Step 2: Update System

- [ ] Update all software on your server:
  ```bash
  sudo apt update
  sudo apt upgrade -y
  ```

### Step 3: Install PostgreSQL (Database)

- [ ] Install PostgreSQL:
  ```bash
  sudo apt install postgresql postgresql-contrib -y
  ```

- [ ] Start PostgreSQL:
  ```bash
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  ```

- [ ] Create the database:
  ```bash
  sudo -u postgres psql
  ```

- [ ] Run these commands (you'll see `postgres=#` prompt):
  ```sql
  CREATE DATABASE fittrack_db;
  CREATE USER fittrack_user WITH PASSWORD 'your_secure_password';
  GRANT ALL PRIVILEGES ON DATABASE fittrack_db TO fittrack_user;
  \q
  ```
  **Note**: Replace `your_secure_password` with a strong password you'll remember!

### Step 4: Install Python & Dependencies

- [ ] Install Python:
  ```bash
  sudo apt install python3 python3-pip python3-venv -y
  ```

### Step 5: Install Nginx (Web Server)

- [ ] Install Nginx:
  ```bash
  sudo apt install nginx -y
  ```

### Step 6: Install Git

- [ ] Install Git:
  ```bash
  sudo apt install git -y
  ```

✅ **Checkpoint**: All software installed on VPS!

---

## 📥 Part 3: Get Your Code onto the VPS

### Step 1: Navigate to Web Directory

- [ ] Go to web directory:
  ```bash
  cd /var/www/
  ```

### Step 2: Clone Your GitHub Repository

- [ ] Clone your repository (replace `YOUR_USERNAME`):
  ```bash
  sudo git clone https://github.com/YOUR_USERNAME/fittrack-plus.git
  ```

### Step 3: Set Permissions

- [ ] Give yourself ownership of the files:
  ```bash
  sudo chown -R $USER:$USER /var/www/fittrack-plus
  cd /var/www/fittrack-plus
  ```

✅ **Checkpoint**: Your code is now on the VPS!

---

## 🔧 Part 4: Set Up the Backend

### Step 1: Go to Backend Folder

- [ ] Navigate to backend:
  ```bash
  cd /var/www/fittrack-plus/backend
  ```

### Step 2: Create Virtual Environment

- [ ] Create isolated Python environment:
  ```bash
  python3 -m venv venv
  ```

### Step 3: Activate Virtual Environment

- [ ] Activate it (you'll see `(venv)` in terminal):
  ```bash
  source venv/bin/activate
  ```

### Step 4: Install Python Packages

- [ ] Install all required packages from requirements.txt:
  ```bash
  pip install -r requirements.txt
  ```
  **Note**: This installs FastAPI, SQLAlchemy, and all other dependencies.

### Step 5: Create .env File

- [ ] Create environment file:
  ```bash
  nano .env
  ```

- [ ] Paste this configuration (update password):
  ```env
  DATABASE_URL=postgresql://fittrack_user:your_secure_password@localhost:5432/fittrack_db
  SECRET_KEY=your-super-secret-key-change-this
  NUTRITIONIX_APP_ID=
  NUTRITIONIX_APP_KEY=
  USDA_API_KEY=
  ```
  **Save**: Press `Ctrl + X`, then `Y`, then `Enter`

### Step 6: Initialize Database Tables

- [ ] Create all database tables:
  ```bash
  python3 -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
  ```

### Step 7: Test Backend

- [ ] Test that backend runs:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
  Press `Ctrl + C` to stop after testing.

✅ **Checkpoint**: Backend is configured!

---

## 🌐 Part 5: Set Up Nginx (Make Backend Accessible)

### Step 1: Create Nginx Configuration

- [ ] Create config file:
  ```bash
  sudo nano /etc/nginx/sites-available/fittrack-api
  ```

- [ ] Paste this configuration:
  ```nginx
  server {
      listen 80;
      server_name api.andel-vps.space;

      location / {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
  **Save**: `Ctrl + X`, `Y`, `Enter`

### Step 2: Enable the Configuration

- [ ] Create symbolic link:
  ```bash
  sudo ln -s /etc/nginx/sites-available/fittrack-api /etc/nginx/sites-enabled/
  ```

### Step 3: Test Nginx Configuration

- [ ] Test for errors:
  ```bash
  sudo nginx -t
  ```
  Should say "syntax is ok"

### Step 4: Restart Nginx

- [ ] Restart the web server:
  ```bash
  sudo systemctl restart nginx
  ```

✅ **Checkpoint**: Nginx is configured!

---

## 🔐 Part 6: Add SSL Certificate (HTTPS)

### Step 1: Install Certbot

- [ ] Install SSL certificate tool:
  ```bash
  sudo apt install certbot python3-certbot-nginx -y
  ```

### Step 2: Get SSL Certificate

- [ ] Get free SSL certificate:
  ```bash
  sudo certbot --nginx -d api.andel-vps.space
  ```

- [ ] Follow the prompts:
  - [ ] Enter your email
  - [ ] Agree to terms
  - [ ] Choose redirect option (option 2)

✅ **Checkpoint**: Your API now has HTTPS!

---

## 🏃 Part 7: Keep Backend Running (24/7)

### Step 1: Create Service File

- [ ] Create systemd service:
  ```bash
  sudo nano /etc/systemd/system/fittrack-backend.service
  ```

- [ ] Paste this configuration:
  ```ini
  [Unit]
  Description=FitTrack+ Backend API
  After=network.target

  [Service]
  User=root
  WorkingDirectory=/var/www/fittrack-plus/backend
  Environment="PATH=/var/www/fittrack-plus/backend/venv/bin"
  ExecStart=/var/www/fittrack-plus/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
  Restart=always

  [Install]
  WantedBy=multi-user.target
  ```
  **Save**: `Ctrl + X`, `Y`, `Enter`

### Step 2: Start the Service

- [ ] Start and enable the service:
  ```bash
  sudo systemctl start fittrack-backend
  sudo systemctl enable fittrack-backend
  ```

### Step 3: Check Status

- [ ] Verify it's running:
  ```bash
  sudo systemctl status fittrack-backend
  ```
  Should show "active (running)" in green!

✅ **Checkpoint**: Backend is running 24/7!

---

## 🎨 Part 8: Deploy Frontend

Choose one option:

### Option A: Deploy on VPS (Same Server)

- [ ] Navigate to frontend folder:
  ```bash
  cd /var/www/fittrack-plus/frontend
  ```

- [ ] Install Node.js:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install nodejs -y
  ```

- [ ] Install dependencies:
  ```bash
  npm install
  ```

- [ ] Create .env file:
  ```bash
  nano .env
  ```

- [ ] Add this line:
  ```env
  VITE_API_URL=https://api.andel-vps.space
  ```
  **Save**: `Ctrl + X`, `Y`, `Enter`

- [ ] Build the frontend:
  ```bash
  npm run build
  ```

- [ ] Create nginx config for frontend:
  ```bash
  sudo nano /etc/nginx/sites-available/fittrack-app
  ```

- [ ] Paste this:
  ```nginx
  server {
      listen 80;
      server_name app.andel-vps.space;
      root /var/www/fittrack-plus/frontend/dist;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }
  }
  ```
  **Save**: `Ctrl + X`, `Y`, `Enter`

- [ ] Enable frontend config:
  ```bash
  sudo ln -s /etc/nginx/sites-available/fittrack-app /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  ```

- [ ] Get SSL for frontend:
  ```bash
  sudo certbot --nginx -d app.andel-vps.space
  ```

### Option B: Deploy on Vercel (Easier!)

- [ ] Go to https://vercel.com
- [ ] Click "Add New" → "Project"
- [ ] Import your GitHub repository
- [ ] Select `frontend` folder as root directory
- [ ] Add environment variable:
  - Name: `VITE_API_URL`
  - Value: `https://api.andel-vps.space`
- [ ] Click "Deploy"

✅ **Checkpoint**: Frontend is deployed!

---

## 📋 Part 9: Create DNS Records in Hostinger

### For Backend API:

- [ ] In Hostinger DNS panel, add A record:
  ```
  Type: A
  Name: api
  Points to: YOUR_VPS_IP_ADDRESS
  TTL: 14400
  ```
- [ ] Click "Add Record"

### For Frontend (if hosting on VPS):

- [ ] Add another A record:
  ```
  Type: A
  Name: app
  Points to: YOUR_VPS_IP_ADDRESS
  TTL: 14400
  ```
- [ ] Click "Add Record"

✅ **Checkpoint**: DNS is configured!

---

## ✅ Part 10: Test Everything

### Test Backend API:

- [ ] Open browser and visit:
  ```
  https://api.andel-vps.space/docs
  ```
  You should see the Swagger API documentation!

### Test Root Endpoint:

- [ ] Visit:
  ```
  https://api.andel-vps.space/
  ```
  Should show: "FitTrack+ API is running! 🚀"

### Test Frontend:

- [ ] Visit your frontend URL:
  ```
  https://app.andel-vps.space
  ```
  Or your Vercel URL if you used Option B.

- [ ] Try to register a new account
- [ ] Complete onboarding
- [ ] Log some food
- [ ] Check dashboard updates

✅ **Checkpoint**: Everything is working!

---

## 🔧 Useful Commands Reference

### View Backend Logs:
```bash
sudo journalctl -u fittrack-backend -f
```
Press `Ctrl + C` to stop viewing

### Restart Backend:
```bash
sudo systemctl restart fittrack-backend
```

### Check Backend Status:
```bash
sudo systemctl status fittrack-backend
```

### Stop Backend:
```bash
sudo systemctl stop fittrack-backend
```

### Update Code from GitHub:
```bash
cd /var/www/fittrack-plus
git pull origin main
sudo systemctl restart fittrack-backend
```

### Check Nginx Errors:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Check PostgreSQL Status:
```bash
sudo systemctl status postgresql
```

### Connect to Database:
```bash
sudo -u postgres psql fittrack_db
```

---

## 📝 What Each Part Does (Simple Explanation)

| Component | What It Does |
|-----------|-------------|
| **PostgreSQL** | Stores your data (users, food logs, exercises) |
| **Backend (FastAPI)** | Your API that handles requests - runs on port 8000 |
| **Nginx** | Acts as a "gatekeeper" - takes requests from the internet and sends them to your backend |
| **Systemd** | Keeps your backend running 24/7, even after server restarts |
| **Certbot** | Adds HTTPS (the lock icon in your browser) |
| **DNS** | Connects your domain name (api.andel-vps.space) to your VPS IP address |

---

## 🆘 Troubleshooting

### Backend won't start?

- [ ] Check the logs:
  ```bash
  sudo journalctl -u fittrack-backend -n 50
  ```

- [ ] Try running manually to see errors:
  ```bash
  cd /var/www/fittrack-plus/backend
  source venv/bin/activate
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```

### Can't connect to database?

- [ ] Check PostgreSQL is running:
  ```bash
  sudo systemctl status postgresql
  ```

- [ ] If stopped, start it:
  ```bash
  sudo systemctl start postgresql
  ```

- [ ] Check .env file has correct password:
  ```bash
  cd /var/www/fittrack-plus/backend
  cat .env
  ```

### Nginx error?

- [ ] Test configuration:
  ```bash
  sudo nginx -t
  ```

- [ ] Check error logs:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```

### DNS not working?

- [ ] Wait 5-10 minutes for DNS to propagate
- [ ] Check DNS with:
  ```bash
  nslookup api.andel-vps.space
  ```

### Port 8000 already in use?

- [ ] Find what's using it:
  ```bash
  sudo lsof -i :8000
  ```

- [ ] Kill the process or use a different port

---

## 🔐 Security Checklist

- [ ] Changed default PostgreSQL password to something strong
- [ ] Set a secure SECRET_KEY in .env
- [ ] SSL/HTTPS is enabled (green lock in browser)
- [ ] Firewall is configured:
  ```bash
  sudo ufw allow 22    # SSH
  sudo ufw allow 80    # HTTP
  sudo ufw allow 443   # HTTPS
  sudo ufw enable
  ```
- [ ] PostgreSQL only accepts local connections (localhost)
- [ ] Regular system updates scheduled

---

## 🎉 Deployment Complete!

Your FitTrack+ app is now:
- ✅ Running on your VPS
- ✅ Accessible via https://api.andel-vps.space
- ✅ Database is secure (not exposed to internet)
- ✅ Has HTTPS (secure connection)
- ✅ Stays running 24/7
- ✅ Automatically restarts if it crashes

### URLs to Remember:

- **API Documentation**: https://api.andel-vps.space/docs
- **API Root**: https://api.andel-vps.space/
- **Frontend**: https://app.andel-vps.space (or your Vercel URL)

---

## 📚 Next Steps

- [ ] Test all features thoroughly
- [ ] Set up regular backups of your database
- [ ] Monitor your server resources
- [ ] Consider adding monitoring (like UptimeRobot)
- [ ] Set up automated deployments from GitHub

---

**Need help with any step? Just ask!** 😊

**Good luck with your deployment!** 🚀

