// public/icon.svg dan PWA PNG ikonkalarini yaratadi (192, 512, maskable 512, apple-touch 180).
// `npm run theme` avval SVG ni brend rangida yangilaydi; `npm run icons` PNG larni qayta chizadi.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const icon = readFileSync(join(pub, 'icon.svg'));
const maskable = readFileSync(join(pub, 'icon-maskable.svg'));
const jobs = [
  ['icon-192.png', icon, 192],
  ['icon-512.png', icon, 512],
  ['icon-maskable-512.png', maskable, 512],
  ['apple-touch-icon.png', maskable, 180],
];
for (const [name, src, size] of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(join(pub, name));
  console.log('yozildi:', name);
}
