// node polyerase.mjs in.png out.png "x,y x,y ..." : poligon în coordonatele pătratului 1000 din compose.mjs
import sharp from 'sharp';
const [, , input, output, pts] = process.argv;
const m = await sharp(input).metadata();
const s = Math.min(800 / m.width, 800 / m.height);
const left = (1000 - m.width * s) / 2, top = (1000 - m.height * s) / 2 + 20;
const poly = pts.split(' ').map((p) => p.split(',').map(Number)).map(([x, y]) => `${((x - left) / s).toFixed(1)},${((y - top) / s).toFixed(1)}`).join(' ');
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><polygon points="${poly}" fill="#000"/></svg>`);
await sharp(input).composite([{ input: mask, blend: 'dest-out' }]).png().toFile(output);
console.log('erased');
