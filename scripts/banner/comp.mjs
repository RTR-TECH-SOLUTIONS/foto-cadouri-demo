// node comp.mjs in.png out.png [minFrac] : păstrează doar componentele opace mari (scoate resturi desprinse)
import sharp from 'sharp';
const [, , input, output, fracArg = '0.04'] = process.argv;
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const lab = new Int32Array(W * H).fill(-1);
const sizes = [];
const stack = new Int32Array(W * H);
for (let s = 0; s < W * H; s++) {
  if (lab[s] !== -1 || data[s * 4 + 3] < 100) continue;
  const id = sizes.length; let n = 0, top = 0; stack[top++] = s; lab[s] = id;
  while (top) {
    const p = stack[--top]; n++;
    const x = p % W, y = (p / W) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
      if (q >= 0 && lab[q] === -1 && data[q * 4 + 3] >= 100) { lab[q] = id; stack[top++] = q; }
    }
  }
  sizes.push(n);
}
const big = Math.max(...sizes), keep = new Set(sizes.map((n, i) => (n >= big * Number(fracArg) ? i : -1)).filter((i) => i >= 0));
for (let p = 0; p < W * H; p++) {
  const l = lab[p];
  if (data[p * 4 + 3] >= 100 ? !keep.has(l) : false) data[p * 4 + 3] = 0;
}
// pixelii semi-transparenți izolați (sub prag) rămân doar lângă componente păstrate
for (let p = 0; p < W * H; p++) {
  if (data[p * 4 + 3] > 0 && data[p * 4 + 3] < 100) {
    const x = p % W, y = (p / W) | 0; let near = false;
    for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) { const l = lab[yy * W + xx]; if (l >= 0 && keep.has(l) && data[(yy * W + xx) * 4 + 3] >= 100) { near = true; break; } } }
    if (!near) data[p * 4 + 3] = 0;
  }
}
await sharp(data, { raw: info }).trim({ threshold: 10 }).png().toFile(output);
console.log('components', sizes.length, 'kept', keep.size);
