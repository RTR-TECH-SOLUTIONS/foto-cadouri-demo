// node cutout.mjs <input> <output.webp> [size] [pad]
// Decupează obiectul și îl pune centrat pe fundal crem uniform, cu umbră moale.
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const [, , input, output, sizeArg = '1000', padArg = '0.12'] = process.argv;
const size = Number(sizeArg), pad = Number(padArg);
const src = await sharp(await readFile(input)).rotate().resize(1600, 1600, { fit: 'inside' }).png().toBuffer();
const blob = await removeBackground(new Blob([src], { type: 'image/png' }), { output: { format: 'image/png' } });
const LO = Number(process.env.LO ?? 60), HI = Number(process.env.HI ?? 160);
const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 3; i < data.length; i += 4) { const a = data[i]; data[i] = a <= LO ? 0 : a >= HI ? 255 : Math.round(((a - LO) / (HI - LO)) * 255); }
const cutBuf = await sharp(data, { raw: info }).trim({ threshold: 10 }).png().toBuffer();
const inner = Math.round(size * (1 - pad * 2));
const obj = await sharp(cutBuf).resize(inner, inner, { fit: 'inside' }).png().toBuffer();
const m = await sharp(obj).metadata();
const left = Math.round((size - m.width) / 2), top = Math.round((size - m.height) / 2 + size * 0.02);
const shadowW = Math.round(m.width * 0.8), shadowH = Math.max(18, Math.round(size * 0.05));
const shadow = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><filter id="b"><feGaussianBlur stdDeviation="${size * 0.018}"/></filter></defs><ellipse cx="${size / 2}" cy="${top + m.height - shadowH * 0.2}" rx="${shadowW / 2}" ry="${shadowH / 2}" fill="#6b5a40" opacity="0.28" filter="url(#b)"/></svg>`)).png().toBuffer();
await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: shadow }, { input: obj, left, top }])
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile(output);
console.log('ok', output, m.width, m.height);
