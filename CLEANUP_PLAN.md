# 🧹 FitTrack+ Cleanup & Sync Plan

> **Date**: November 4, 2025  
> **Goal**: Clean up duplicates, organize files, sync local with VPS

---

## 🚨 **ISSUES FOUND**

### **1. Duplicate Files in Root Directory** ❌

These files should NOT be in the root:
- `App.css` - Should be in `frontend/src/` only
- `App.jsx` - Should be in `frontend/src/` only  
- `index.html` - Should be in `frontend/` only (duplicate in root)

### **2. Too Many Documentation Files** 📚

You have 15+ markdown files in the root! Recommended organization:
- Keep: `README.md`, `upgrade-tasks.md`, `mfp-vs-ftp.md`, `IMPLEMENTATION_STATUS.md`
- Move to `docs/`: All other .md files
- Delete: Outdated or duplicate docs

### **3. Missing .gitignore** ⚠️

Need proper `.gitignore` to prevent:
- `.env` files from being committed
- `node_modules/` from being committed
- `venv/` from being committed
- `__pycache__/` directories
- Build files (`dist/`)

### **4. VPS Has OLD Code** 🔄

VPS is missing:
- `routers/water.py` (NEW)
- `routers/measurements.py` (NEW)
- `schemas/water_schemas.py` (NEW)
- `schemas/measurement_schemas.py` (NEW)
- `components/WaterWidget.jsx` (NEW)
- Updated `models.py`, `main.py`, `api.js`, `Dashboard.jsx`

---

## ✅ **CLEANUP ACTIONS**

### **Step 1: Delete Duplicate Files from Root**

```bash
# On your local computer (PowerShell)
cd C:\Users\andel\Desktop\FTP\fittrack-plus
Remove-Item App.css
Remove-Item App.jsx
Remove-Item index.html
```

### **Step 2: Organize Documentation**

Move to docs folder:
```bash
Move-Item "fit-plus-mvp.md" docs/
Move-Item "fit-plus-prd.md" docs/
Move-Item "FitTrack+ Application Design.md" docs/
Move-Item "MVP Specification_ FitTrack+.md" docs/
Move-Item "Product Requirements Document (PRD)_ FitTrack+.md" docs/
Move-Item "NUTRITION_CALCULATOR_FEATURE.md" docs/
Move-Item "PROJECT_SUMMARY.md" docs/
Move-Item "QUICK_REFERENCE.md" docs/
Move-Item "QUICK_START_FOOD_APIS.md" docs/
Move-Item "SETUP_GUIDE.md" docs/
Move-Item "Summary_ Food Aggregation and Normalization Layer for FitTrack+.md" docs/
Move-Item "FOOD_API_MIGRATION.md" docs/
Move-Item "API_SETUP_GUIDE.md" docs/
```

Keep in root:
- `README.md` (main project readme)
- `upgrade-tasks.md` (current implementation plan)
- `mfp-vs-ftp.md` (strategy document)
- `IMPLEMENTATION_STATUS.md` (progress tracking)
- `VPS_GUIDE.md` (deployment guide)

---

## 📋 **FINAL CLEAN STRUCTURE**

```
fittrack-plus/
├── README.md                      ← Main project info
├── upgrade-tasks.md               ← Implementation roadmap
├── mfp-vs-ftp.md                 ← Strategy document
├── IMPLEMENTATION_STATUS.md       ← Progress tracking
├── VPS_GUIDE.md                  ← Deployment guide
├── CLEANUP_PLAN.md               ← This file
├── .gitignore                    ← Git ignore rules
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── requirements.txt
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── food.py
│   │   ├── exercise.py
│   │   ├── dashboard.py
│   │   ├── water.py          ← NEW
│   │   └── measurements.py   ← NEW
│   ├── schemas/
│   │   ├── user_schemas.py
│   │   ├── food_schemas.py
│   │   ├── exercise_schemas.py
│   │   ├── streak_schemas.py
│   │   ├── water_schemas.py      ← NEW
│   │   └── measurement_schemas.py ← NEW
│   ├── services/
│   └── utils/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WaterWidget.jsx   ← NEW
│   │   │   └── ui/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── docs/                          ← All other documentation
    ├── fit-plus-mvp.md
    ├── fit-plus-prd.md
    ├── SETUP_GUIDE.md
    ├── API_SETUP_GUIDE.md
    └── ... (all other .md files)
```

---

## 🔄 **SYNC PLAN**

### **Priority 1: Fix Registration Issue First** 🚨

Before syncing, we need to fix registration. The issue is likely:
- CORS configuration
- Database permissions
- Old code on VPS

### **Priority 2: Push New Code to VPS** 📤

1. Create proper `.gitignore`
2. Commit all new files
3. Push to GitHub (or direct copy to VPS)
4. Pull on VPS
5. Restart services

### **Priority 3: Clean Up** 🧹

1. Delete duplicates from local
2. Organize docs folder
3. Update VPS with clean structure

---

## ⚠️ **REGISTRATION ISSUE - LIKELY CAUSES**

1. **VPS has OLD models.py** without new fields
2. **CORS not allowing your domain**
3. **Database user permissions**
4. **Frontend pointing to wrong API URL**

---

## 🔧 **IMMEDIATE FIX FOR REGISTRATION**

Let's check the backend logs on VPS to see the actual error.

Run on VPS:
```bash
sudo journalctl -u fittrack-backend -n 100 --no-pager | grep -i error
```

This shows what's failing!

---


