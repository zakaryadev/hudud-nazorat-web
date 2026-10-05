#!/usr/bin/env bash
# Kunlik zaxira: PostgreSQL (pg_dump) + yuklangan fayllar (uploads/).
# Ishlatish:  ./deploy/backup.sh      (cron: 0 2 * * * /path/to/deploy/backup.sh >> /var/log/hudud-backup.log 2>&1)
# Sozlamalar (env): BACKUP_DIR (standart ./backups), KEEP_DAYS (standart 14), COMPOSE_FILE
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COMPOSE=(docker compose -f "${COMPOSE_FILE:-docker-compose.prod.yml}")
STAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="$BACKUP_DIR/db-$STAMP.dump"
FILES_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
umask 077

"${COMPOSE[@]}" exec -T db pg_dump -U hudud -d hudud -Fc > "$DB_FILE"
"${COMPOSE[@]}" exec -T backend tar czf - -C /app uploads > "$FILES_FILE"

# Fayllar bo'sh yoki yaroqsiz bo'lsa — xato (jimgina buzuq zaxira qoldirmaymiz)
[ -s "$DB_FILE" ] && "${COMPOSE[@]}" exec -T db pg_restore --list < "$DB_FILE" > /dev/null \
  || { echo "XATO: baza zaxirasi yaroqsiz: $DB_FILE" >&2; rm -f "$DB_FILE"; exit 1; }
tar tzf "$FILES_FILE" > /dev/null \
  || { echo "XATO: fayllar zaxirasi yaroqsiz: $FILES_FILE" >&2; rm -f "$FILES_FILE"; exit 1; }

# Eski zaxiralarni tozalash
find "$BACKUP_DIR" -maxdepth 1 \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime "+$KEEP_DAYS" -delete

echo "$(date -Is) zaxira tayyor: $DB_FILE ($(du -h "$DB_FILE" | cut -f1)), $FILES_FILE ($(du -h "$FILES_FILE" | cut -f1))"
