// node scene2.mjs <bg.jpg> <tone> <product.png> <out.webp> <productH> <cx> [blur] [brightness]
// Cameră reală estompată în spate + raft din lemn în față + produsul clar pe raft.
import sharp from 'sharp';
const [, , bgPath, tone, prodPath, out, hArg = '440', cxArg = '1150', blurArg = '6', brArg = '0.8'] = process.argv;
const W = 1600, H = 700, T = 566;
const wood = {
  ink: { top: '#4a3221', edge: '#24180f', grain: 1.2, tint: '#2a1c10', tintOp: 0.25 },
  forest: { top: '#4f3824', edge: '#271b11', grain: 1.1, tint: '#16210f', tintOp: 0.22 },
  wine: { top: '#4d2f1d', edge: '#26170e', grain: 1.1, tint: '#3a120e', tintOp: 0.22 },
  sand: { top: '#a77c4f', edge: '#7a5634', grain: 0.9, tint: '#f3e6d0', tintOp: 0.12 },
  cream: { top: '#b48a5c', edge: '#86603b', grain: 0.85, tint: '#f6efe3', tintOp: 0.14 },
}[tone];
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let grain = '';
for (let k = 0; k < 80; k++) {
  const y = T + 2 + rnd() * 84, amp = 0.6 + rnd() * 2.2, ph = rnd() * 6.28, op = (0.05 + rnd() * 0.13) * wood.grain;
  let d = `M0 ${y.toFixed(1)}`;
  for (let x = 0; x <= W; x += 80) d += ` L${x} ${(y + Math.sin(x / 260 + ph) * amp).toFixed(1)}`;
  grain += `<path d="${d}" stroke="${rnd() > 0.5 ? '#000' : '#fff'}" stroke-opacity="${op.toFixed(3)}" stroke-width="${(0.6 + rnd() * 1.6).toFixed(2)}" fill="none"/>`;
}
const fg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<linearGradient id="ao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
<linearGradient id="ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient>
<radialGradient id="vig" cx="0.65" cy="0.45" r="0.85"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient>
</defs>
<rect width="${W}" height="${T}" fill="${wood.tint}" opacity="${wood.tintOp}"/>
<rect y="${T - 60}" width="${W}" height="60" fill="url(#ao)"/>
<rect y="${T}" width="${W}" height="86" fill="${wood.top}"/>${grain}
<rect y="${T}" width="${W}" height="86" fill="url(#ts)"/>
<rect y="${T}" width="${W}" height="1.5" fill="#fff" opacity="0.18"/>
<rect y="${T + 86}" width="${W}" height="${H - T - 86}" fill="${wood.edge}"/>
<rect y="${T + 86}" width="${W}" height="2" fill="#fff" opacity="0.1"/>
<rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`);
const bg = await sharp(bgPath).resize(W, T + 40, { fit: 'cover', position: 'centre' }).blur(Number(blurArg)).modulate({ brightness: Number(brArg), saturation: 0.9 }).extend({ bottom: H - T - 40, background: '#000' }).png().toBuffer();
const prod = await sharp(prodPath).resize({ height: Number(hArg), width: 760, fit: 'inside' }).png().toBuffer();
const m = await sharp(prod).metadata();
const cx = Number(cxArg), base = T + 54;
const sh = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="b"><feGaussianBlur stdDeviation="9"/></filter><filter id="b2"><feGaussianBlur stdDeviation="24"/></filter></defs>
<ellipse cx="${cx + 40}" cy="${base - 2}" rx="${m.width * 0.6}" ry="22" fill="#000" opacity="0.4" filter="url(#b2)"/>
<ellipse cx="${cx}" cy="${base - 4}" rx="${m.width * 0.42}" ry="10" fill="#000" opacity="0.6" filter="url(#b)"/></svg>`);
await sharp(bg).composite([{ input: fg }, { input: sh }, { input: prod, left: Math.round(cx - m.width / 2), top: Math.round(base - m.height) }]).webp({ quality: 85 }).toFile(out);
console.log('ok', out);
