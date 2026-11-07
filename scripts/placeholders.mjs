// Placeholder-e crem până vin pozele clientei. Rulează: node scripts/placeholders.mjs
import sharp from 'sharp';
import { existsSync } from 'node:fs';
const slugs = ['suport-sticla-vanatoare-mistret','suport-sticla-caine-rata','suport-sticla-cerb','cutie-cadou-rosie-vin-pahare','suport-servire-bulldog-verde','suport-servire-panda','barca-lemn-suport-sticla','masina-retro-lemn-pahare-shot','camion-lemn-vin-pahare'];
const make = async (file, label, w = 900, h = 900) => {
  if (existsSync(file)) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#f3eee5"/><text x="50%" y="50%" text-anchor="middle" font-family="Georgia" font-size="30" fill="#b3a58f">${label}</text></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(file);
};
for (const s of slugs) await make(`public/img/p/${s}.webp`, s.replace(/-/g, ' '));
await make('public/img/hero.webp', 'poza hero', 1200, 1200);
