# 🔄 Quick Sync Guide - Local to VPS

> **Use this guide whenever you make changes locally and want to deploy them to VPS**

---

## 🚀 **Method 1: Direct File Copy (Fastest)**

### **Copy New Files to VPS:**

**On your local PowerShell:**

```powershell
cd C:\Users\andel\Desktop\FTP\fittrack-plus

# Use SCP to copy files to VPS
scp backend/routers/water.py root@72.60.170.192:/var/www/fittrack-plus/backend/routers/
scp backend/routers/measurements.py root@72.60.170.192:/var/www/fittrack-plus/backend/routers/
scp backend/schemas/water_schemas.py root@72.60.170.192:/var/www/fittrack-plus/backend/schemas/
scp backend/schemas/measurement_schemas.py root@72.60.170.192:/var/www/fittrack-plus/backend/schemas/
scp backend/models.py root@72.60.170.192:/var/www/fittrack-plus/backend/
scp backend/main.py root@72.60.170.192:/var/www/fittrack-plus/backend/
scp frontend/src/components/WaterWidget.jsx root@72.60.170.192:/var/www/fittrack-plus/frontend/src/components/
scp frontend/src/services/api.js root@72.60.170.192:/var/www/fittrack-plus/frontend/src/services/
scp frontend/src/pages/Dashboard.jsx root@72.60.170.192:/var/www/fittrack-plus/frontend/src/pages/
```

### **Then on VPS:**

```bash
# Recreate database tables
cd /var/www/fittrack-plus/backend
source venv/bin/activate
python3 -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
deactivate

# Restart backend
sudo systemctl restart fittrack-backend

# Rebuild frontend
cd /var/www/fittrack-plus/frontend
npm run build

# Done!
```

---

## 🔄 **Method 2: Git Workflow (Proper Way)**

### **Step 1: On Local Computer**

```powershell
cd C:\Users\andel\Desktop\FTP\fittrack-plus
git add .
git commit -m "Add water tracking and body measurements features"
git push origin main
```

### **Step 2: On VPS**

```bash
cd /var/www/fittrack-plus
git pull origin main

# Recreate tables
cd backend
source venv/bin/activate
python3 -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
deactivate

# Restart backend
sudo systemctl restart fittrack-backend

# Rebuild frontend
cd ../frontend
npm run build
```

---

## ⚡ **One-Line Update Script (For VPS)**

Save this on your VPS:

```bash
sudo nano /root/update-fittrack.sh
```

Paste:
```bash
#!/bin/bash
echo "🔄 Updating FitTrack+..."
cd /var/www/fittrack-plus
git pull origin main
cd backend
source venv/bin/activate
python3 -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
deactivate
sudo systemctl restart fittrack-backend
cd ../frontend
npm run build
echo "✅ Update complete!"
sudo systemctl status fittrack-backend --no-pager | head -10
```

Make executable:
```bash
chmod +x /root/update-fittrack.sh
```

Use it:
```bash
/root/update-fittrack.sh
```

---

## 🎯 **Current Priority: Fix Registration**

Before syncing, let's check what's causing registration to fail.

**On VPS, check backend logs:**
```bash
sudo journalctl -u fittrack-backend -n 100 --no-pager | tail -30
```

**Or check real-time:**
```bash
sudo journalctl -u fittrack-backend -f
```
(Then try registering, watch errors appear)

---


