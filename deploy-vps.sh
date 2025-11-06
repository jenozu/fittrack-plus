#!/bin/bash
# Deployment script to run on VPS
# This file uses Unix line endings (LF)

VPS_PATH="/var/www/fittrack-plus"

echo "[1/8] Updating backend dependencies..."
cd $VPS_PATH/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

echo "[2/8] Running database migrations..."
python3 -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)'

echo "[3/8] Initializing badges..."
python init_badges.py

echo "[4/8] Deactivating venv..."
deactivate

echo "[5/8] Restarting backend service..."
sudo systemctl restart fittrack-backend

echo "[6/8] Installing frontend dependencies..."
cd $VPS_PATH/frontend
npm install

echo "[7/8] Building frontend..."
npm run build

echo "[8/8] Reloading nginx..."
sudo systemctl reload nginx

echo "[SUCCESS] Deployment complete!"

