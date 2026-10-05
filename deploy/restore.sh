#!/usr/bin/env bash
# Zaxiradan tiklash (joriy bazani va fayllarni ALMASHTIRADI).
# Ishlatish:  ./deploy/restore.sh backups/db-XXXX.dump backups/uploads-XXXX.tar.gz [--yes]
set -euo pipefail
cd "$(dirname "$0")/.."

DB_FILE="${1:?Ishlatish: restore.sh <db.dump> <uploads.tar.gz> [--yes]}"
FILES_FILE="${2:?Ishlatish: restore.sh <db.dump> <uploads.tar.gz> [--yes]}"
COMPOSE=(docker compose -f "${COMPOSE_FILE:-docker-compose.prod.yml}")
[ -s "$DB_FILE" ] && [ -s "$FILES_FILE" ] || { echo "Zaxira fayllari topilmadi" >&2; exit 1; }

if [ "${3:-}" != "--yes" ]; then
  read -r -p "Joriy baza va fayllar zaxira bilan ALMASHTIRILADI. Davom etamizmi? [yes/NO] " ans
  [ "$ans" = "yes" ] || { echo "Bekor qilindi"; exit 1; }
fi

echo "Backend to'xtatilmoqda…"
"${COMPOSE[@]}" stop backend

echo "Baza tiklanmoqda…"
"${COMPOSE[@]}" exec -T db pg_restore -U hudud -d hudud --clean --if-exists --no-owner < "$DB_FILE"

echo "Backend ishga tushirilmoqda…"
"${COMPOSE[@]}" start backend

echo "Fayllar tiklanmoqda…"
# Backend ishga tushishini kutamiz
for _ in $(seq 1 30); do
  "${COMPOSE[@]}" exec -T backend true 2>/dev/null && break || sleep 1
done
"${COMPOSE[@]}" exec -T backend sh -c 'rm -rf /app/uploads/* && tar xzf - -C /app' < "$FILES_FILE"

echo "Tiklash tugadi."
