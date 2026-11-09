#!/usr/bin/env bash
# Restore a backup made by backup_db.sh. DESTROYS the current database contents.
#   sudo bash scripts/vps/restore_db.sh /var/backups/fittrack/fittrack_db-2026-11-08_0315.dump
set -euo pipefail
FILE="${1:?usage: restore_db.sh <file.dump>}"
DB="${DB_NAME:-fittrack_db}"
[[ -f "$FILE" ]] || { echo "No such file: $FILE" >&2; exit 1; }
read -r -p "This replaces everything in '$DB' with $FILE. Type the database name to continue: " ans
[[ "$ans" == "$DB" ]] || { echo "Aborted."; exit 1; }
systemctl stop fittrack-backend
sudo -u postgres pg_restore --clean --if-exists -d "$DB" "$FILE"
systemctl start fittrack-backend
echo "Restored $FILE into $DB."
