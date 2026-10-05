#!/usr/bin/env bash
# Qabul testi (TZ 14-bo'lim): ishlayotgan tizimga API orqali so'rov yuborib mezonlarni tekshiradi.
# Ishlatish:
#   BASE=http://localhost:8080 ADMIN_PHONE=+998901234567 ADMIN_PASSWORD=... ./scripts/acceptance.sh
# Dev (seed): BASE=http://localhost:3000 ./scripts/acceptance.sh   (standart admin: +998900000000 / admin123)
# Test ma'lumotlari ("ACC-<id>") yaratiladi va oxirida nofaol qilinadi (yozuvlar o'chirilmaydi — TZ talabi).
# Telefon brauzerida GPS/kamera va zaxira tiklash qo'lda tekshiriladi (deploy/README.md).
set -uo pipefail

BASE="${BASE:-http://localhost:3000}"
ADMIN_PHONE="${ADMIN_PHONE:-+998900000000}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
API="$BASE/api"
RUN="$(date +%s)"
PASS=0; FAIL=0

req() { # req METHOD PATH TOKEN [JSON]  -> $CODE, $BODY
  local m="$1" p="$2" t="${3:-}" d="${4:-}" out
  local args=(-s -w $'\n%{http_code}' -X "$m" "$API$p")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$d" ] && args+=(-H 'Content-Type: application/json' -d "$d")
  out="$(curl "${args[@]}")"
  CODE="${out##*$'\n'}"; BODY="${out%$'\n'*}"
}
jget() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval('d'+sys.argv[1]))" "$1" <<<"$BODY" 2>/dev/null; }
check() { # check "tavsif" "kutilgan" "haqiqiy"
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✓ $1"; else FAIL=$((FAIL+1)); echo "  ✗ $1 (kutilgan: $2, olingan: $3)"; fi
}
M_PER_DEG=111194.92664455873

echo "== 1. Kirish"
req POST /auth/login "" '{"phone":"'"$ADMIN_PHONE"'","password":"'"$ADMIN_PASSWORD"'"}'
check "admin to'g'ri parol bilan kiradi" 201 "$CODE"; ADMIN="$(jget "['accessToken']")"
req POST /auth/login "" '{"phone":"'"$ADMIN_PHONE"'","password":"xato-parol"}'
check "noto'g'ri parol rad etiladi (401)" 401 "$CODE"
check "xato xabari qaysi biri xatoligini aytmaydi" "Login yoki parol xato" "$(jget "['message']")"
req POST /auth/login "" '{"phone":"+998000000000","password":"xato-parol"}'
check "mavjud bo'lmagan telefon ham xuddi shunday" "Login yoki parol xato" "$(jget "['message']")"

echo "== 2. Admin hudud yaratadi va xodim biriktiradi"
PHONE="+9989$(printf '%08d' $((RUN % 100000000)))"
req POST /users "$ADMIN" '{"fullName":"ACC xodim","phone":"'"$PHONE"'","password":"acc12345","role":"EMPLOYEE"}'
check "xodim yaratiladi" 201 "$CODE"; EMP_ID="$(jget "['id']")"
req POST /users "$ADMIN" '{"fullName":"ACC xodim","phone":"'"$PHONE"'","password":"acc12345"}'
check "takroriy telefon — 409" 409 "$CODE"
LAT=42.4531; LON=59.6103
req POST /territories "$ADMIN" '{"name":"ACC-'"$RUN"'","latitude":'$LAT',"longitude":'$LON',"radiusM":150,"assigneeIds":["'"$EMP_ID"'"]}'
check "hudud yaratiladi va xodim biriktiriladi" 201 "$CODE"; TID="$(jget "['id']")"
req POST /territories "$ADMIN" '{"name":"ACC-boshqa-'"$RUN"'","latitude":41.3,"longitude":69.2,"radiusM":150}'
check "biriktirilmagan ikkinchi hudud yaratiladi" 201 "$CODE"; TID2="$(jget "['id']")"
req POST /territories "$ADMIN" '{"name":"x","latitude":41.3,"longitude":69.2,"radiusM":10}'
check "radius 20 m dan kichik rad etiladi (400)" 400 "$CODE"

req POST /auth/login "" '{"phone":"'"$PHONE"'","password":"acc12345"}'
check "xodim kiradi" 201 "$CODE"; EMP="$(jget "['accessToken']")"
req GET /territories "$EMP"
check "xodim faqat biriktirilgan hududni ko'radi" 1 "$(python3 -c "import sys,json;print(len([t for t in json.load(sys.stdin) if t['name'].startswith('ACC-')]))" <<<"$BODY")"

echo "== 3-4. Davomat (geofence)"
IN="$(python3 -c "print($LAT + 34/$M_PER_DEG)")"
OUT="$(python3 -c "print($LAT + 320/$M_PER_DEG)")"
req POST /attendance/set "$EMP" '{"territoryId":"'"$TID"'","latitude":'$IN',"longitude":'$LON',"accuracy":12}'
check "hudud ichida: qabul (201)" 201 "$CODE"
check "withinZone=true" True "$(jget "['withinZone']")"
check "masofa ≈ 34 m" 34 "$(jget "['distanceM']")"
req POST /attendance/set "$EMP" '{"territoryId":"'"$TID"'","latitude":'$OUT',"longitude":'$LON',"accuracy":15}'
check "tashqarida ham saqlanadi (201)" 201 "$CODE"
check "withinZone=false" False "$(jget "['withinZone']")"
check "ogohlantirish xabarida masofa va ruxsat bor" True "$(python3 -c "import sys,json;m=json.load(sys.stdin)['message'];print('320' in m and '150' in m)" <<<"$BODY")"
req GET /attendance/my "$EMP"
check "tarixda ikkala yozuv bor (tashqarida ham)" 2 "$(python3 -c "import sys,json;print(len(json.load(sys.stdin)))" <<<"$BODY")"

echo "== 5. Foto"
printf '\x89PNG\r\n\x1a\n' > /tmp/acc-photo.png; head -c 2000 /dev/urandom >> /tmp/acc-photo.png
UP="$(curl -s -w $'\n%{http_code}' -X POST "$API/files/upload" -H "Authorization: Bearer $EMP" -F "file=@/tmp/acc-photo.png;type=image/png")"
CODE="${UP##*$'\n'}"; BODY="${UP%$'\n'*}"
check "rasm yuklanadi" 201 "$CODE"; PHOTO="$(jget "['url']")"
TXT="$(curl -s -w $'\n%{http_code}' -X POST "$API/files/upload" -H "Authorization: Bearer $EMP" -F "file=@/tmp/acc-photo.png;type=text/plain")"
check "rasm bo'lmagan fayl rad etiladi (400)" 400 "${TXT##*$'\n'}"
case "$PHOTO" in http*) PURL="$PHOTO" ;; *) PURL="$BASE$PHOTO" ;; esac
check "yuklangan rasm URL orqali ochiladi" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$PURL")"
req POST /attendance/set "$EMP" '{"territoryId":"'"$TID"'","latitude":'$IN',"longitude":'$LON',"accuracy":10,"photoUrl":"'"$PHOTO"'"}'
check "davomatga foto biriktiriladi" 201 "$CODE"
req GET /attendance/my "$EMP"
check "foto tarixda ko'rinadi" True "$(python3 -c "import sys,json;print(any(a.get('photoUrl')=='$PHOTO' for a in json.load(sys.stdin)))" <<<"$BODY")"

echo "== 6. Biriktirilmagan hudud"
req POST /attendance/set "$EMP" '{"territoryId":"'"$TID2"'","latitude":41.3,"longitude":69.2}'
check "boshqa hududga davomat — 403" 403 "$CODE"

echo "== 7. Tashrif yozuvi"
req POST /visit-records/create "$EMP" '{"territoryId":"'"$TID"'","latitude":'$IN',"longitude":'$LON',"comment":"ACC izoh","photoUrl":"'"$PHOTO"'"}'
check "tashrif foto va izoh bilan yaratiladi" 201 "$CODE"
req GET /visit-records/my-records-list "$EMP"
check "o'z tashrifi ro'yxatda" True "$(python3 -c "import sys,json;print(any(r.get('comment')=='ACC izoh' for r in json.load(sys.stdin)))" <<<"$BODY")"

echo "== 8. Ko'rinish huquqlari"
req GET /attendance/org "$ADMIN"
check "admin tashkilot davomatini ko'radi" 200 "$CODE"
check "admin ro'yxatida xodim davomati bor" True "$(python3 -c "import sys,json;print(any(a['user']['id']=='$EMP_ID' for a in json.load(sys.stdin)))" <<<"$BODY")"
req GET /attendance/org "$EMP";            check "xodim tashkilot davomatini ko'ra olmaydi (403)" 403 "$CODE"
req GET /users "$EMP";                      check "xodim xodimlar ro'yxatini ko'ra olmaydi (403)" 403 "$CODE"
req POST /territories "$EMP" '{"name":"x","latitude":41.3,"longitude":69.2}'; check "xodim hudud yarata olmaydi (403)" 403 "$CODE"
req GET /attendance/org ""; check "tokensiz — 401" 401 "$CODE"

echo "== Nofaol xodim"
req PATCH /users/"$EMP_ID" "$ADMIN" '{"isActive":false}'
req GET /auth/me "$EMP"; check "nofaol xodimning eski tokeni ishlamaydi (401)" 401 "$CODE"
req POST /auth/login "" '{"phone":"'"$PHONE"'","password":"acc12345"}'; check "nofaol xodim kira olmaydi (401)" 401 "$CODE"
req PATCH /territories/"$TID" "$ADMIN" '{"isActive":false}'; req PATCH /territories/"$TID2" "$ADMIN" '{"isActive":false}'

echo
echo "Natija: $PASS o'tdi, $FAIL yiqildi"
[ "$FAIL" -eq 0 ]
