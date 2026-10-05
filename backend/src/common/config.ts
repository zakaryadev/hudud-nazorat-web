import { Module } from '@nestjs/common';
import { config } from './load-env';

config();
// Kunlik hisobot chegaralari uchun vaqt zonasi
process.env.TZ = process.env.TZ || 'Asia/Tashkent';

@Module({})
export class ConfigModuleStub {}

// JWT_SECRET majburiy: zaif standart kalit bilan ishga tushmaymiz
export function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET sozlanmagan yoki juda qisqa (kamida 16 belgi). .env faylini tekshiring.');
  }
  return s;
}

// CORS_ORIGIN="https://a.uz,https://b.uz"; bo'sh bo'lsa (faqat dev) hamma origin
export function corsOrigin(): string[] | true {
  const list = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : true;
}

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB);
  return (mb > 0 ? mb : 10) * 1024 * 1024;
}
