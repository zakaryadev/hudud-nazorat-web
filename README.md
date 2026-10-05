# Hudud nazorat / davomat tizimi

- `backend/` — NestJS + PostgreSQL (Prisma), JWT, GPS geofence (haversine). Batafsil: [backend/README.md](backend/README.md)
- `frontend/` — React + Vite + TypeScript: login, hudud tanlash, GPS + kamera orqali davomat, tarix. Admin uchun: tashkilot davomati, xodim qo'shish, hudud yaratish (xaritada nuqta + radius) va xodimlarni biriktirish.

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

## Eslatma
- `navigator.geolocation` va kamera faqat **HTTPS** (yoki `localhost`) da ishlaydi. Telefonda sinash/productionda sertifikat kerak (masalan nginx + Let's Encrypt).
- Geofence yakuniy tekshiruvi serverda; frontenddagi masofa faqat taxminiy ko'rsatkich.
