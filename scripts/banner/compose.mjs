// node compose.mjs <cut.png> <out.webp> : produs transparent centrat pe pătrat 1000, cu umbră moale (ca în catalog)
import sharp from 'sharp';
const [, , input, output] = process.argv;
const size = 1000, inner = 800;
const obj = await sharp(input).resize(inner, inner, { fit: 'inside' }).png().toBuffer();
const m = await sharp(obj).metadata();
const left = Math.round((size - m.width) / 2), top = Math.round((size - m.height) / 2 + size * 0.02);
const shadow = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><filter id="b"><feGaussianBlur stdDeviation="18"/></filter></defs><ellipse cx="${size / 2}" cy="${top + m.height - 9}" rx="${m.width * 0.4}" ry="45" fill="#6b5a40" opacity="0.28" filter="url(#b)"/></svg>`)).png().toBuffer();
await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: shadow }, { input: obj, left, top }]).webp({ quality: 86, alphaQuality: 90 }).toFile(output);
console.log('ok');
