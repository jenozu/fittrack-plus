#!/usr/bin/env bash
# Nightly Postgres backup. Installed to cron by setup_server.sh; run by hand any time:
#   sudo -u postgres bash /var/www/fittrack-plus/scripts/vps/backup_db.sh
# Keeps the last KEEP_DAYS (default 7) days. Copy them off the server now and then
# (e.g. scp from your computer) - a backup on the same disk doesn't survive losing the VPS.
set -euo pipefail
DB="${DB_NAME:-fittrack_db}"
DEST="${BACKUP_DIR:-/var/backups/fittrack}"
KEEP="${KEEP_DAYS:-7}"
mkdir -p "$DEST"
OUT="$DEST/$DB-$(date +%Y-%m-%d_%H%M).dump"
pg_dump -Fc "$DB" -f "$OUT"
find "$DEST" -name "$DB-*.dump" -mtime +"$KEEP" -delete
echo "Backup written: $OUT ($(du -h "$OUT" | cut -f1))"
