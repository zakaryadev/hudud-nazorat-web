// `npm run theme [-- --seed "#RRGGBB"]` kirish nuqtasi: theme.mjs ni bundle qiladi (kutubxona faqat bundler bilan ishlaydi),
// argumentlarni unga uzatadi, so'ng PNG ikonkalarni yangilaydi.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

await build({ entryPoints: ['scripts/theme.mjs'], bundle: true, platform: 'node', format: 'esm', outfile: '.cache/theme.mjs', logLevel: 'error' });
for (const [file, args] of [['.cache/theme.mjs', process.argv.slice(2)], ['scripts/icons.mjs', []]]) {
  const r = spawnSync(process.execPath, [file, ...args], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
