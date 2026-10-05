// Brend rangidan (brand.json -> seed) butun Material 3 palitrasini hosil qiladi.
//   npm run theme                      brand.json dagi seed bilan
//   npm run theme -- --seed "#1d4ed8"  seed'ni almashtiradi (brand.json ham yangilanadi)
// brand.json: { seed, variant: "tonalSpot" | "content", name, shortName }
// Kutubxona faqat bundler bilan ishlaydi, shuning uchun `npm run theme` avval esbuild bilan .cache/ ga yig'adi.
// Yaratiladigan fayllar: src/theme.generated.css, src/theme.meta.json, public/manifest.webmanifest, public/icon.svg
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  argbFromHex, hexFromArgb, Hct, SchemeTonalSpot, SchemeContent, MaterialDynamicColors as M,
} from '@material/material-color-utilities';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandPath = join(root, 'brand.json');
const brand = JSON.parse(readFileSync(brandPath, 'utf8'));

const arg = process.argv.indexOf('--seed');
if (arg > -1) {
  const v = process.argv[arg + 1];
  if (!/^#[0-9a-fA-F]{6}$/.test(v || '')) {
    console.error('Xato: --seed "#RRGGBB" ko‘rinishida bo‘lsin');
    process.exit(1);
  }
  brand.seed = v.toUpperCase();
  writeFileSync(brandPath, JSON.stringify(brand, null, 2) + '\n');
}
if (!/^#[0-9a-fA-F]{6}$/.test(brand.seed)) throw new Error('brand.json: seed noto‘g‘ri');

const ROLES = {
  '--primary': M.primary, '--on-primary': M.onPrimary,
  '--primary-container': M.primaryContainer, '--on-primary-container': M.onPrimaryContainer,
  '--secondary-container': M.secondaryContainer, '--on-secondary-container': M.onSecondaryContainer,
  '--surface': M.surface, '--sc-low': M.surfaceContainerLow, '--sc': M.surfaceContainer,
  '--sc-high': M.surfaceContainerHigh, '--sc-highest': M.surfaceContainerHighest,
  '--on-surface': M.onSurface, '--on-surface-variant': M.onSurfaceVariant,
  '--outline': M.outline, '--outline-variant': M.outlineVariant,
  '--error': M.error, '--error-container': M.errorContainer, '--on-error-container': M.onErrorContainer,
  '--inverse-surface': M.inverseSurface, '--inverse-on-surface': M.inverseOnSurface,
};
// Holat ranglari brend rangiga bog'liq emas: "ichkarida / tashqarida" ma'nosi doim bir xil qoladi
const STATUS = {
  light: { '--ok': '#1b6e2d', '--ok-container': '#c4efc8', '--on-ok-container': '#00210a',
           '--warn': '#8a5100', '--warn-container': '#ffddb5', '--on-warn-container': '#2c1600' },
  dark:  { '--ok': '#8bd88f', '--ok-container': '#0d3a18', '--on-ok-container': '#c4efc8',
           '--warn': '#ffb95c', '--warn-container': '#4a2d00', '--on-warn-container': '#ffddb5' },
};

// variant: "tonalSpot" (standart, yumshoq/to'yinganligi pasaytirilgan) yoki "content" (brend rangi to'yinganligini saqlaydi)
const Scheme = brand.variant === 'content' ? SchemeContent : SchemeTonalSpot;
const source = Hct.fromInt(argbFromHex(brand.seed));
function tokens(dark) {
  const scheme = new Scheme(source, dark, 0);
  const out = {};
  for (const [name, role] of Object.entries(ROLES)) out[name] = hexFromArgb(role.getArgb(scheme));
  return { ...out, ...STATUS[dark ? 'dark' : 'light'] };
}
const block = (t, extra = '') =>
  Object.entries(t).map(([k, v]) => `  ${k}: ${v};`).join('\n') + (extra ? `\n  ${extra}` : '');

const light = tokens(false), dark = tokens(true);
const css = `/* Avtomatik yaratilgan: npm run theme (seed ${brand.seed}). Qo'lda tahrirlamang — brand.json ni o'zgartiring. */
:root {
${block(light)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${block(dark, 'color-scheme: dark;').replace(/^/gm, '  ')}
  }
}
:root[data-theme="dark"] {
${block(dark, 'color-scheme: dark;')}
}
`;
writeFileSync(join(root, 'src/theme.generated.css'), css);
writeFileSync(join(root, 'src/theme.meta.json'), JSON.stringify({ light: light['--surface'], dark: dark['--surface'], seed: brand.seed }, null, 2) + '\n');

writeFileSync(join(root, 'public/manifest.webmanifest'), JSON.stringify({
  name: brand.name, short_name: brand.shortName, lang: 'uz', start_url: '/', scope: '/', display: 'standalone',
  orientation: 'portrait', theme_color: light['--surface'], background_color: light['--surface'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n');

// Ikonka: brend rangidagi yumaloq kvadrat + joylashuv belgisi
const pin = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z';
const svg = (radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${radius}" fill="${light['--primary']}"/><g transform="translate(106 96) scale(12.5)" fill="${light['--on-primary']}"><path d="${pin}"/></g></svg>\n`;
writeFileSync(join(root, 'public/icon.svg'), svg(112));
writeFileSync(join(root, 'public/icon-maskable.svg'), svg(0));
console.log(`Tema tayyor: seed ${brand.seed}, primary ${light['--primary']} / ${dark['--primary']}`);
