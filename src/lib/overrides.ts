// Legătura dintre panoul de administrare demo și site: ce schimbă proprietarul în /admin (preț, reducere,
// produs ascuns, textele bannerelor) se salvează în localStorage și se aplică peste paginile statice.
// TODO(real): datele vin din baza de date (admin real), paginile se randează direct cu ele.
import { products, discount, type Product } from '../data/catalog';
import { fmt } from './cart';

export interface ProductEdit {
  price?: number;
  oldPrice?: number | null;
  hidden?: boolean;
  qty?: number;
}
export type BannerEdit = Partial<Record<'label' | 'title' | 'text', string>>;

const PRODUCTS = 'fc-admin-products';
const BANNERS = 'fc-admin-banners';

function read<T>(key: string, empty: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? empty;
  } catch {
    return empty;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocat: modificarea rămâne doar în pagina curentă
  }
}

export const readProductEdits = () => read<Record<string, ProductEdit>>(PRODUCTS, {});
export const readBannerEdits = () => read<Record<string, BannerEdit>>(BANNERS, {});

export function saveProductEdit(slug: string, edit: ProductEdit) {
  const all = readProductEdits();
  all[slug] = { ...all[slug], ...edit };
  write(PRODUCTS, all);
}
export function saveBannerEdit(index: number, edit: BannerEdit) {
  const all = readBannerEdits();
  all[index] = { ...all[index], ...edit };
  write(BANNERS, all);
}
export function resetEdits() {
  try {
    localStorage.removeItem(PRODUCTS);
    localStorage.removeItem(BANNERS);
  } catch {
    // ignorat
  }
}

/** Produsul cu modificările din admin aplicate (preț nou, reducere scoasă sau pusă). */
export function withEdit<T extends Pick<Product, 'price' | 'oldPrice'>>(p: T, e?: ProductEdit): T {
  if (!e) return p;
  const price = e.price && e.price > 0 ? e.price : p.price;
  const old = e.oldPrice === undefined ? p.oldPrice : e.oldPrice ?? undefined;
  return { ...p, price, oldPrice: old && old > price ? old : undefined };
}

/** Lista de produse pentru insulele React: prețuri din admin, fără produsele ascunse. */
export function liveProducts(list: Product[] = products): Product[] {
  const edits = readProductEdits();
  return list.filter((p) => !edits[p.slug]?.hidden).map((p) => withEdit(p, edits[p.slug]));
}

/** Aplică modificările din admin peste HTML-ul static (carduri, pagina de produs, bannere). */
export function patchPage(root: ParentNode = document) {
  const edits = readProductEdits();
  for (const [slug, e] of Object.entries(edits)) {
    const base = products.find((p) => p.slug === slug);
    if (!base) continue;
    const p = withEdit(base, e);
    const off = discount(p);
    const q = (attr: string) => root.querySelectorAll<HTMLElement>(`[${attr}="${slug}"]`);
    q('data-now').forEach((el) => (el.textContent = fmt(p.price)));
    q('data-old').forEach((el) => {
      el.hidden = !p.oldPrice;
      if (p.oldPrice) el.textContent = fmt(p.oldPrice);
    });
    q('data-save').forEach((el) => {
      el.hidden = off <= 0;
      if (p.oldPrice) el.textContent = `economisești ${p.oldPrice - p.price} lei`;
    });
    q('data-off').forEach((el) => {
      const badge = el.dataset.badge;
      el.hidden = off <= 0 && !badge;
      (el.querySelector('[data-n]') ?? el).textContent = off > 0 ? `-${off}%` : badge ?? '';
    });
    root.querySelectorAll<HTMLElement>(`[data-add][data-slug="${slug}"]`).forEach((el) => (el.dataset.price = String(p.price)));
    q('data-card').forEach((el) => (el.hidden = !!e.hidden));
  }
  const banners = readBannerEdits();
  for (const [k, e] of Object.entries(banners)) {
    for (const [field, value] of Object.entries(e)) {
      if (!value) continue;
      root.querySelectorAll<HTMLElement>(`[data-banner="${k}"][data-f="${field}"]`).forEach((el) => (el.textContent = value));
    }
  }
}
