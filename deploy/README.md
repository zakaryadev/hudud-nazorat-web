# Deploy (o'z serveringda)

Stack: **PostgreSQL 16** + **backend (NestJS)** + **nginx** (frontend statik fayllari, `/api` va `/uploads` backendga proksi).
Tashqi bulut/davlat xizmatlariga bog'liq emas. Minimal server: 2 CPU, 2 GB RAM, 20 GB disk.

## 1. Birinchi ishga tushirish

```bash
cp .env.prod.example .env
# .env ni to'ldiring: POSTGRES_PASSWORD (faqat harf/raqam), JWT_SECRET (>=16 belgi)
#   openssl rand -hex 16   # POSTGRES_PASSWORD
#   openssl rand -hex 32   # JWT_SECRET

docker compose -f docker-compose.prod.yml up -d --build
```

Backend har ishga tushganda `prisma migrate deploy` ni o'zi bajaradi.

Birinchi admin (bir marta). Productionda `ADMIN_PASSWORD` majburiy, namuna ma'lumotlar yaratilmaydi:

```bash
docker compose -f docker-compose.prod.yml run --rm \
  -e ORG_NAME="Tashkilot nomi" -e ADMIN_PHONE="+998901234567" -e ADMIN_PASSWORD="kuchli-parol" \
  backend npm run seed
```

Tekshirish: `http://SERVER/` — login sahifasi; `http://SERVER/api/auth/me` — 401 (token yo'q).

## 2. HTTPS (majburiy)

Brauzerda **GPS va kamera faqat HTTPS** da ishlaydi (`localhost` bundan mustasno).

1. Sertifikatni `deploy/certs/fullchain.pem` va `deploy/certs/privkey.pem` ga qo'ying.
   - Tashqi domen: Let's Encrypt (`certbot certonly --standalone -d nazorat.example.uz`, so'ng fayllarni nusxalang/symlink qiling).
   - Ichki tarmoq: ichki CA yoki o'z-o'zidan imzolangan sertifikat (xodimlar qurilmasiga CA ni ishonchli qilib o'rnating).
2. `.env` da: `NGINX_CONF=nginx.tls.conf`, kerak bo'lsa `CORS_ORIGIN=https://nazorat.example.uz`.
3. `docker compose -f docker-compose.prod.yml up -d` (nginx qayta yuklanadi).

## 3. Yangilash

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 4. Zaxira va tiklash

Kunlik zaxira (baza `pg_dump` + `uploads/` arxivi), standart 14 kun saqlanadi:

```bash
./deploy/backup.sh
# cron (har kuni 02:00):
# 0 2 * * * /srv/hudud-nazorat-web/deploy/backup.sh >> /var/log/hudud-backup.log 2>&1
```

`BACKUP_DIR` (standart `./backups`) ni alohida diskka yo'naltiring; `KEEP_DAYS` — saqlash muddati.

Tiklash (joriy baza va fayllarni **almashtiradi**):

```bash
./deploy/restore.sh backups/db-YYYYMMDD-HHMMSS.dump backups/uploads-YYYYMMDD-HHMMSS.tar.gz
```

Tiklashni muntazam sinab turing (masalan, oyda bir marta alohida serverda).

## 5. Muhit o'zgaruvchilari

| O'zgaruvchi | Izoh |
|---|---|
| `POSTGRES_PASSWORD` | Baza paroli (majburiy; faqat harf/raqam) |
| `JWT_SECRET` | Token kaliti (majburiy, >=16 belgi) |
| `JWT_EXPIRES_IN` | Token muddati (standart `7d`) |
| `CORS_ORIGIN` | Ruxsat etilgan brauzer manzillari, vergul bilan. Bir domen (nginx) bo'lsa bo'sh qoldirish mumkin |
| `PUBLIC_BASE_URL` | Rasm URL'lari prefiksi; bo'sh = nisbiy `/uploads/...` (tavsiya) |
| `MAX_UPLOAD_MB` | Rasm hajmi chegarasi (standart 10). `deploy/nginx*.conf` dagi `client_max_body_size` dan kichik bo'lsin |
| `TZ` | Kunlik hisobot chegarasi uchun vaqt zonasi (standart `Asia/Tashkent`) |
| `WEB_PORT`, `WEB_TLS_PORT` | nginx portlari (80/443) |
| `NGINX_CONF` | `nginx.conf` (HTTP) yoki `nginx.tls.conf` (HTTPS) |
| `NODE_IMAGE` | Backend asos image'i (standart `node:20-slim`; offline build uchun libssl bor image bering, masalan `node:20-bookworm`) |

## 6. Foydali buyruqlar

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml exec db psql -U hudud -d hudud
```
