# Hudud nazorat / davomat tizimi

- `backend/` — NestJS + PostgreSQL (Prisma), JWT, GPS geofence (haversine). Batafsil: [backend/README.md](backend/README.md)
- `frontend/` — React + Vite + TypeScript: login, hudud tanlash, GPS + kamera orqali davomat, tarix. Admin uchun: kunlik kesim paneli, davomat va hisobotlar jurnali (sana/xodim/hudud filtri, CSV eksport), xodim boshqaruvi (qo'shish, nofaol qilish, parol), hudud yaratish/tahrirlash (xaritada nuqta + radius) va xodimlarni biriktirish.

## Ishga tushirish

```bash
# Backend (http://localhost:3000/api)
cd backend && docker compose up -d && npm install
cp .env.example .env            # JWT_SECRET ni o'zgartiring
npx prisma migrate dev --name init && npm run seed
npm run start:dev

# Frontend (http://localhost:5173) — /api va /uploads backendga proksi qilinadi
cd frontend && npm install && npm run dev
```

Backend boshqa manzilda bo'lsa: `VITE_BACKEND=http://host:3000 npm run dev`.

## Dizayn va brend rangi
Interfeys Material 3 uslubida (mobil birinchi, och/qorong'i rejim, PWA: bosh ekranga qo'shish mumkin).
Butun rang palitrasi **bitta tokendan** hosil bo'ladi: `frontend/brand.json` ichidagi `seed`.

```bash
cd frontend
npm run theme -- --seed "#1D4ED8"   # brend rangini almashtirish (brand.json yangilanadi)
```
Bu `src/theme.generated.css` (och va qorong'i palitra), `<meta theme-color>`, PWA manifest va ikonkalarni qayta yaratadi
(`npm run dev` va `npm run build` ham buni avtomatik bajaradi). `variant`: `"tonalSpot"` (standart, yumshoq) yoki `"content"` (brend rangi to'yinganligini saqlaydi).
Holat ranglari (ichkarida yashil, tashqarida sariq, belgilanmagan qizil) brend rangiga bog'liq emas.

## Production (Docker)
```bash
cp .env.prod.example .env       # POSTGRES_PASSWORD, JWT_SECRET ni to'ldiring
docker compose -f docker-compose.prod.yml up -d --build
```
nginx (frontend + `/api`, `/uploads` proksi), HTTPS, birinchi admin, yangilash, **kunlik zaxira va tiklash** — [deploy/README.md](deploy/README.md).

## Testlar
- `cd backend && npm test` — birlik testlar (jest). CI: `.github/workflows/ci.yml`.
- `BASE=http://localhost:3000 ./scripts/acceptance.sh` — TZ 14-bo'lim qabul mezonlari bo'yicha API testi (ishlayotgan tizimga qarshi, 34 tekshiruv).
- Qo'lda: telefon brauzerida GPS/kamera (HTTPS kerak) va zaxiradan tiklash.

## Eslatma
- `navigator.geolocation` va kamera faqat **HTTPS** (yoki `localhost`) da ishlaydi. Telefonda sinash/productionda sertifikat kerak (masalan nginx + Let's Encrypt).
- Geofence yakuniy tekshiruvi serverda; frontenddagi masofa faqat taxminiy ko'rsatkich.
