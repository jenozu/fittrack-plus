# FitTrack+ Phase 1 & 2 Deployment Script
# Deploys all new features to VPS

$VPS_IP = "72.60.170.192"
$VPS_USER = "root"
$VPS_PATH = "/var/www/fittrack-plus"

Write-Host "[DEPLOY] Deploying FitTrack+ Phase 1 & 2 to VPS..." -ForegroundColor Cyan
Write-Host "[TARGET] ${VPS_USER}@${VPS_IP}:${VPS_PATH}" -ForegroundColor Yellow

# Backend Files
Write-Host "`n[BACKEND] Copying backend files..." -ForegroundColor Yellow

# Routers (all of them)
scp backend/routers/*.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/routers/

# Schemas (all of them)
scp backend/schemas/*.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/schemas/

# Services (all of them)
scp backend/services/*.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/services/

# Core files
scp backend/models.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/
scp backend/main.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/
scp backend/requirements.txt ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/
scp backend/init_badges.py ${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/

# Frontend Files
Write-Host "`n[FRONTEND] Copying frontend files..." -ForegroundColor Yellow

# All source files
scp -r frontend/src/* ${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/src/
scp frontend/package.json ${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/
scp frontend/vite.config.js ${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/

Write-Host "`n[OK] Files copied successfully!" -ForegroundColor Green

# Copy deployment script
Write-Host "`n[SCRIPT] Copying deployment script to VPS..." -ForegroundColor Yellow
scp deploy-vps.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

# Execute deployment on VPS
Write-Host "`n[DEPLOY] Running deployment commands on VPS..." -ForegroundColor Cyan
ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && chmod +x deploy-vps.sh && ./deploy-vps.sh"

Write-Host "`n[SUCCESS] Deployment Complete!" -ForegroundColor Green
Write-Host "`n[NEXT STEPS]:" -ForegroundColor Cyan
Write-Host "   1. Visit: http://${VPS_IP}" -ForegroundColor White
Write-Host "   2. Test all new features" -ForegroundColor White
Write-Host "   3. Monitor logs: ssh ${VPS_USER}@${VPS_IP} 'sudo journalctl -u fittrack-backend -f'" -ForegroundColor White
Write-Host "`n[IMPORTANT] Don't forget to add OPENAI_API_KEY to VPS .env file!" -ForegroundColor Yellow

