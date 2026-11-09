# FitTrack+ Deployment Script
# Run this from your local computer to sync all files to VPS

$VPS_IP = "72.60.170.192"
$VPS_USER = "root"
$VPS_PATH = "/var/www/fittrack-plus"

Write-Host "🚀 Deploying FitTrack+ to VPS..." -ForegroundColor Cyan

# Copy new backend files
Write-Host "`n📦 Copying backend files..." -ForegroundColor Yellow
scp backend/routers/water.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/routers/
scp backend/routers/measurements.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/routers/
scp backend/schemas/water_schemas.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/schemas/
scp backend/schemas/measurement_schemas.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/schemas/
scp backend/models.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/
scp backend/main.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/

# Copy new frontend files
Write-Host "`n📦 Copying frontend files..." -ForegroundColor Yellow
scp frontend/src/components/WaterWidget.jsx ${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/src/components/
scp frontend/src/services/api.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/src/services/
scp frontend/src/pages/Dashboard.jsx ${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/src/pages/

Write-Host "`n✅ Files copied!" -ForegroundColor Green
Write-Host "`n⚡ Now run these commands on your VPS:" -ForegroundColor Cyan
Write-Host "   ssh root@72.60.170.192" -ForegroundColor White
Write-Host "   cd /var/www/fittrack-plus/backend && source venv/bin/activate && python3 -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)' && deactivate" -ForegroundColor White
Write-Host "   sudo systemctl restart fittrack-backend" -ForegroundColor White
Write-Host "   cd /var/www/fittrack-plus/frontend && npm run build" -ForegroundColor White

