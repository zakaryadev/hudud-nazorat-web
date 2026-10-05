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
| GET | `/api/auth/me` | Joriy foydalanuvchi + biriktirilgan faol hududlar + `todayStatus` (bugungi davomat holati) |

### Hududlar
| Metod | Yo'l | Kim | Izoh |
|---|---|---|---|
| POST | `/api/territories` | ADMIN | Hudud yaratish `{ name, latitude, longitude, radiusM, assigneeIds[] }` |
| GET | `/api/territories` | hamma | ADMIN — barchasi, xodim — faqat biriktirilgani |
| GET | `/api/territories/:id` | hamma | Bitta hudud |
| PATCH | `/api/territories/:id` | ADMIN | Tahrirlash `{ name?, address?, latitude?, longitude?, radiusM?, isActive? }` (`isActive=false` — yangi davomat qabul qilinmaydi) |
| PUT | `/api/territories/:id/assignees` | ADMIN | Biriktirilgan xodimlarni almashtirish `{ assigneeIds[] }` |

### Davomat (geofence yadrosi)
| Metod | Yo'l | Kim | Izoh |
|---|---|---|---|
| POST | `/api/attendance/set` | xodim/admin | `{ territoryId, latitude, longitude, accuracy?, photoUrl? }` — masofa haversine bilan hisoblanadi, `withinZone` qaytadi |
| GET | `/api/attendance/my` | hamma | O'z davomati tarixi |
| GET | `/api/attendance/org` | ADMIN | Tashkilot davomati. Filtrlar: `from`, `to` (YYYY-MM-DD), `userId`, `territoryId`, `limit` |
| GET | `/api/attendance/daily?date=YYYY-MM-DD` | ADMIN | Kunlik kesim: har bir faol xodim uchun `INSIDE` / `OUTSIDE_ONLY` / `NONE`, urinishlar, oxirgi belgilash |

### Tashrif yozuvlari
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/visit-records/create` | `{ territoryId?, latitude, longitude, address?, photoUrl?, comment? }` |
| GET | `/api/visit-records/my-records-list` | O'z yozuvlari |
| GET | `/api/visit-records/org` | ADMIN: tashkilot hisobotlari (`from`, `to`, `userId`, `territoryId`, `limit`) |

### Fayllar
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/files/upload` | `multipart/form-data`, maydon nomi `file` → `{ url }` |

### Foydalanuvchilar (ADMIN)
| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/users` | `{ fullName, phone, password, role? }` |
| GET | `/api/users` | Tashkilot xodimlari |
| PATCH | `/api/users/:id` | `{ fullName?, password?, isActive?, role? }` — nofaol qilish, parol almashtirish (o'zini nofaol qila olmaydi) |

## Geofence qanday ishlaydi
`attendance/set` chaqirilganda xodimning GPS koordinatasi hududning markazidan
qancha uzoqligini **haversine** formulasi bilan metrda hisoblaydi. Agar masofa
hududning `radiusM` qiymatidan kichik bo'lsa — `withinZone: true` (davomat ichkarida).
Masofa va natija bazaga yoziladi, ya'ni "tashqarida" belgilashlar ham qoladi (tekshiruv uchun).

## Frontend (React) tomoni — keyingi qadam
- GPS: brauzerda `navigator.geolocation.getCurrentPosition()` → `latitude, longitude, accuracy`
- Rasm/kamera: `<input type="file" accept="image/*" capture="environment">` → `POST /files/upload` → qaytgan `url` ni `photoUrl` ga qo'yasan
- Oqim: login → hudud tanlash → GPS + foto → `attendance/set`

## Sozlamalar (.env)
| O'zgaruvchi | Izoh |
|---|---|
| `DATABASE_URL` | PostgreSQL ulanishi |
| `JWT_SECRET` | **Majburiy**, kamida 16 belgi (yo'q bo'lsa server ishga tushmaydi) |
| `JWT_EXPIRES_IN` | Token muddati (standart `7d`) |
| `CORS_ORIGIN` | Ruxsat etilgan origin(lar), vergul bilan. Bo'sh = hamma (faqat dev) |
| `MAX_UPLOAD_MB` | Rasm hajmi chegarasi (standart 10) |
| `PUBLIC_BASE_URL` | Rasm URL prefiksi; bo'sh = nisbiy `/uploads/...` (tavsiya) |
| `TZ` | Kunlik hisobot chegarasi uchun vaqt zonasi (standart `Asia/Tashkent`) |

Har so'rovda foydalanuvchining `isActive`, roli va tashkiloti bazadan tekshiriladi — nofaol xodimning tokeni darhol ishlamay qoladi.

## Testlar
```bash
npm test        # jest: haversine (TZ jadvali), davomat/geofence, rol va biriktirish, JWT, config
```
Prod build: `npm run build && npm run start:prod` (`dist/main.js`). Seed productionda `ADMIN_PASSWORD` talab qiladi (`ORG_NAME`, `ADMIN_PHONE`, `SEED_DEMO` ham bor).
