# Hudud nazorat / davomat tizimi — Backend (NestJS)

O'z serveringda ishlaydigan davomat va hudud-nazorat backendi. GPS geofence,
rasm yuklash, tashrif yozuvlari, JWT avtorizatsiya. Tashqi davlat tizimlariga
bog'liq emas — hamma narsa o'zingda.

## Texnologiya
- **NestJS** (Node.js, TypeScript)
- **PostgreSQL** + **Prisma** ORM
- **JWT** avtorizatsiya (telefon + parol)
- Rasmlar — o'z serverdagi diskda (`/uploads`), kerak bo'lsa keyin S3'ga ko'chiriladi

## Ishga tushirish

```bash
# 1. PostgreSQL ko'taramiz (yoki o'z bazangni ulaysan)
docker compose up -d

# 2. Paketlar
npm install

# 3. .env sozlash
cp .env.example .env
#   DATABASE_URL va JWT_SECRET ni to'ldir

# 4. Baza jadvallarini yaratamiz
npx prisma migrate dev --name init

# 5. Namuna ma'lumot (tashkilot + admin + xodim + hudud)
npm run seed

# 6. Serverni ishga tushiramiz
npm run start:dev
```

Server: `http://localhost:3000/api`

Seed loginlari:
- **Admin:** `+998900000000` / `admin123`
- **Xodim:** `+998901111111` / `xodim123`

## API

Barcha himoyalangan endpointlar `Authorization: Bearer <token>` talab qiladi.

### Auth
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/auth/login` | `{ phone, password }` → `{ accessToken, user }` |
| GET | `/api/auth/me` | Joriy foydalanuvchi + biriktirilgan hududlar |

### Hududlar
| Metod | Yo'l | Kim | Izoh |
|---|---|---|---|
| POST | `/api/territories` | ADMIN | Hudud yaratish `{ name, latitude, longitude, radiusM, assigneeIds[] }` |
| GET | `/api/territories` | hamma | ADMIN — barchasi, xodim — faqat biriktirilgani |
| GET | `/api/territories/:id` | hamma | Bitta hudud |
| PUT | `/api/territories/:id/assignees` | ADMIN | Biriktirilgan xodimlarni almashtirish `{ assigneeIds[] }` |

### Davomat (geofence yadrosi)
| Metod | Yo'l | Kim | Izoh |
|---|---|---|---|
| POST | `/api/attendance/set` | xodim/admin | `{ territoryId, latitude, longitude, accuracy?, photoUrl? }` — masofa haversine bilan hisoblanadi, `withinZone` qaytadi |
| GET | `/api/attendance/my` | hamma | O'z davomati tarixi |
| GET | `/api/attendance/org` | ADMIN | Tashkilot bo'yicha barcha davomat |

### Tashrif yozuvlari
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/visit-records/create` | `{ territoryId?, latitude, longitude, address?, photoUrl?, comment? }` |
| GET | `/api/visit-records/my-records-list` | O'z yozuvlari |

### Fayllar
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/files/upload` | `multipart/form-data`, maydon nomi `file` → `{ url }` |

### Foydalanuvchilar (ADMIN)
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/users` | `{ fullName, phone, password, role? }` |
| GET | `/api/users` | Tashkilot xodimlari |

## Geofence qanday ishlaydi
`attendance/set` chaqirilganda xodimning GPS koordinatasi hududning markazidan
qancha uzoqligini **haversine** formulasi bilan metrda hisoblaydi. Agar masofa
hududning `radiusM` qiymatidan kichik bo'lsa — `withinZone: true` (davomat ichkarida).
Masofa va natija bazaga yoziladi, ya'ni "tashqarida" belgilashlar ham qoladi (tekshiruv uchun).

## Frontend (React) tomoni — keyingi qadam
- GPS: brauzerda `navigator.geolocation.getCurrentPosition()` → `latitude, longitude, accuracy`
- Rasm/kamera: `<input type="file" accept="image/*" capture="environment">` → `POST /files/upload` → qaytgan `url` ni `photoUrl` ga qo'yasan
- Oqim: login → hudud tanlash → GPS + foto → `attendance/set`
