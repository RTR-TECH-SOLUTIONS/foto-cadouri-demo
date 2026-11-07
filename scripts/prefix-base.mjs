// După `astro build` pentru GitHub Pages: site-ul stă sub /foto-cadouri-demo/, dar linkurile și pozele din cod
// încep cu "/". Le prefixăm în HTML și JS (asset-urile Astro sunt deja prefixate).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = '/foto-cadouri-demo';
const ROOTS = 'img|produs|cadouri|categorie|cos|finalizare|cont|studio-foto|personalizari|despre|favicon\\.svg';

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let files = 0;
for await (const f of walk('dist')) {
  if (!/\.(html|js|css)$/.test(f)) continue;
  const src = await readFile(f, 'utf8');
  const out = src
    .replace(new RegExp(`(["'\`(=])/(${ROOTS})(?=[/?#"'\`)$]|$)`, 'g'), `$1${BASE}/$2`)
    .replace(/href=(["'])\/(?=\1|#)/g, `href=$1${BASE}/`)
    .replace(new RegExp(`(&quot;)/(${ROOTS})(?=[/?#&])`, 'g'), `$1${BASE}/$2`);
  if (out !== src) {
    await writeFile(f, out);
    files++;
  }
}
console.log(`prefix-base: ${files} fișiere actualizate cu ${BASE}`);
