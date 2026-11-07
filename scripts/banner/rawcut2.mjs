// node rawcut.mjs <input> <out.png> : decupaj transparent, margini întărite
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const [, , input, output] = process.argv;
const LO = Number(process.env.LO ?? 60), HI = Number(process.env.HI ?? 160);
const src = await sharp(await readFile(input)).rotate().resize(1600, 1600, { fit: 'inside' }).png().toBuffer();
const blob = await removeBackground(new Blob([src], { type: 'image/png' }), { output: { format: 'image/png' } });
const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 3; i < data.length; i += 4) { const a = data[i]; data[i] = a <= LO ? 0 : a >= HI ? 255 : Math.round(((a - LO) / (HI - LO)) * 255); }
await sharp(data, { raw: info }).trim({ threshold: 10 }).png().toFile(output);
