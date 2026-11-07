// node scene3.mjs <config.json> : scenă cu mai multe produse pe raft, dimensiuni libere
// config: { bg, out, W, H, T, blur, brightness, tone, items: [{ png, h, cx, dy }] } (items: din spate în față)
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const c = JSON.parse(await readFile(process.argv[2], 'utf8'));
const { W, H, T } = c;
const wood = { top: '#4d2f1d', edge: '#26170e', tint: '#3a120e', tintOp: 0.2 };
let seed = 41;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const depth = Math.round((H - T) * 0.55);
let grain = '';
for (let k = 0; k < 90; k++) {
  const y = T + 2 + rnd() * (depth - 4), amp = 0.6 + rnd() * 2.2, ph = rnd() * 6.28, op = 0.05 + rnd() * 0.14;
  let d = `M0 ${y.toFixed(1)}`;
  for (let x = 0; x <= W; x += 60) d += ` L${x} ${(y + Math.sin(x / 220 + ph) * amp).toFixed(1)}`;
  grain += `<path d="${d}" stroke="${rnd() > 0.5 ? '#000' : '#fff'}" stroke-opacity="${op.toFixed(3)}" stroke-width="${(0.6 + rnd() * 1.6).toFixed(2)}" fill="none"/>`;
}
const fg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<linearGradient id="ao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.38"/></linearGradient>
<linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>
</defs>
<rect width="${W}" height="${T}" fill="${wood.tint}" opacity="${wood.tintOp}"/>
<rect y="${T - 70}" width="${W}" height="70" fill="url(#ao)"/>
<rect y="${T}" width="${W}" height="${depth}" fill="${wood.top}"/>${grain}
<rect y="${T}" width="${W}" height="${depth}" fill="url(#ts)"/>
<rect y="${T}" width="${W}" height="1.5" fill="#fff" opacity="0.2"/>
<rect y="${T + depth}" width="${W}" height="${H - T - depth}" fill="${wood.edge}"/>
<rect y="${T + depth}" width="${W}" height="2" fill="#fff" opacity="0.1"/></svg>`);
const bg = await sharp(c.bg).resize(W, T + 50, { fit: 'cover', position: c.position || 'centre' }).blur(c.blur).modulate({ brightness: c.brightness, saturation: 0.9 }).extend({ bottom: H - T - 50, background: '#000' }).png().toBuffer();
const layers = [{ input: fg }];
for (const it of c.items) {
  const prod = await sharp(it.png).resize({ height: it.h, width: Math.round(W * 0.7), fit: 'inside' }).png().toBuffer();
  const m = await sharp(prod).metadata();
  const base = T + (it.dy ?? 40);
  layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="b"><feGaussianBlur stdDeviation="8"/></filter><filter id="b2"><feGaussianBlur stdDeviation="20"/></filter></defs>
<ellipse cx="${it.cx + 26}" cy="${base - 2}" rx="${m.width * 0.58}" ry="18" fill="#000" opacity="0.42" filter="url(#b2)"/>
<ellipse cx="${it.cx}" cy="${base - 4}" rx="${m.width * 0.42}" ry="9" fill="#000" opacity="0.6" filter="url(#b)"/></svg>`) });
  layers.push({ input: prod, left: Math.round(it.cx - m.width / 2), top: Math.round(base - m.height) });
}
await sharp(bg).composite(layers).webp({ quality: 84 }).toFile(c.out);
console.log('ok', c.out);
