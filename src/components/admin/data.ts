// Date demo pentru panoul de administrare: comenzi generate determinist pe ultimii 2 ani (aceeași zi dă mereu
// aceleași comenzi), plus comenzile plasate de vizitator pe site (localStorage `fc-orders`).
// TODO(real): totul vine din baza de date (Supabase / Medusa), nu e generat.
import { products, type Product } from '../../data/catalog';
import { readOrders } from '../../lib/cart';
import { readProductEdits, withEdit } from '../../lib/overrides';

export type Status = 'noua' | 'pregatire' | 'gata' | 'trimisa' | 'finalizata' | 'anulata';
export type Delivery = 'ridicare' | 'curier';
export type Payment = 'card' | 'ramburs' | 'magazin';

export interface OrderItem {
  slug?: string;
  name: string;
  image?: string;
  price: number;
  qty: number;
  engraving?: string;
}
export interface AdminOrder {
  id: string;
  ts: number;
  customer: { id: string; name: string; phone: string; city: string };
  delivery: Delivery;
  payment: Payment;
  items: OrderItem[];
  shipping: number;
  total: number;
  status: Status;
  awb?: string;
  note?: string;
  fromSite?: boolean;
}

export const statusInfo: Record<Status, { label: string; cls: string }> = {
  noua: { label: 'Nouă', cls: 'bg-[#f6e7cf] text-[#7a4a0e]' },
  pregatire: { label: 'În pregătire', cls: 'bg-[#e3ecf5] text-[#24507c]' },
  gata: { label: 'Gata de ridicare', cls: 'bg-[#e1efe3] text-[#2c5e35]' },
  trimisa: { label: 'Trimisă', cls: 'bg-[#e9e7f2] text-[#45406f]' },
  finalizata: { label: 'Finalizată', cls: 'bg-[#eeeae3] text-[#5d564b]' },
  anulata: { label: 'Anulată', cls: 'bg-[#f6e1dc] text-[#972f20]' },
};
export const flow: Record<Delivery, Status[]> = {
  ridicare: ['noua', 'pregatire', 'gata', 'finalizata'],
  curier: ['noua', 'pregatire', 'trimisa', 'finalizata'],
};
export const doneLabel: Record<Delivery, string> = { ridicare: 'Ridicată', curier: 'Livrată' };
export const paymentLabel: Record<Payment, string> = { card: 'Card online', ramburs: 'Ramburs', magazin: 'La ridicare' };
export const deliveryLabel: Record<Delivery, string> = { ridicare: 'Ridicare din magazin', curier: 'Curier' };

// ---------- utilitare ----------
export const DAY = 86_400_000;
export const startOfDay = (t: number | Date) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const dayNumber = (t: number) => Math.floor((startOfDay(t) - new Date(2020, 0, 1).getTime()) / DAY + 0.5);

export const lei = (n: number) => `${Math.round(n).toLocaleString('ro-RO')} lei`;
export const lei2 = (n: number) => `${n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
export const shortDate = (t: number) => new Date(t).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }).replace('.', '');
export const timeOf = (t: number) => new Date(t).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
export function when(t: number, now = Date.now()) {
  const a = startOfDay(now) - startOfDay(t);
  if (a <= 0) return `azi, ${timeOf(t)}`;
  if (a <= DAY) return `ieri, ${timeOf(t)}`;
  return `${shortDate(t)}, ${timeOf(t)}`;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];
function weighted<T>(r: () => number, list: readonly (readonly [T, number])[]) {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of list) if ((x -= w) <= 0) return v;
  return list[list.length - 1][0];
}
function poisson(r: () => number, lambda: number) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= r();
  } while (p > L);
  return k - 1;
}

// ---------- clienți (fictivi) ----------
const FIRST = ['Andreea', 'Mihai', 'Ioana', 'Alexandru', 'Elena', 'Bogdan', 'Cristina', 'Adrian', 'Maria', 'Florin', 'Gabriela', 'Radu', 'Simona', 'Ionuț', 'Diana', 'Marius', 'Raluca', 'Cătălin', 'Alina', 'Vlad', 'Larisa', 'Sorin', 'Oana', 'Daniel', 'Roxana', 'Cosmin', 'Mirela', 'Paul', 'Bianca', 'George'];
const LAST = ['Popescu', 'Ionescu', 'Popa', 'Dumitrescu', 'Stan', 'Stoica', 'Gheorghe', 'Matei', 'Ciobanu', 'Rusu', 'Munteanu', 'Constantin', 'Marin', 'Tudor', 'Dinu', 'Neagu', 'Barbu', 'Lungu', 'Moldovan', 'Enache', 'Nistor', 'Toma', 'Sandu', 'Preda'];
const CITIES = ['București', 'Ploiești', 'Brașov', 'Pitești', 'Constanța', 'Cluj-Napoca', 'Iași', 'Craiova', 'Buzău', 'Târgoviște', 'Sibiu', 'Galați', 'Timișoara', 'Bacău', 'Oradea'];
function person(seed: number, id: string) {
  const r = rng(seed);
  const name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
  const phone = `07${Math.floor(20 + r() * 70)} ••• ${String(Math.floor(r() * 900) + 100)}`;
  return { id, name, phone, city: pick(r, CITIES) };
}
// clienți care revin (fideli) + clienți noi, unici pe fiecare comandă
const CUSTOMERS = Array.from({ length: 140 }, (_, i) => person(9000 + i, `c${i}`));

export const SHORT: Record<string, string> = {
  'suport-sticla-vanatoare-mistret': 'Suport sticlă cu mistreț',
  'suport-sticla-caine-rata': 'Suport sticlă cu câine și rață',
  'suport-sticla-cerb': 'Suport sticlă cu cerb',
  'cutie-cadou-rosie-vin-pahare': 'Cutie cadou cu vin',
  'suport-servire-bulldog-verde': 'Suport de servire bulldog',
  'suport-servire-panda': 'Suport de servire panda',
  'barca-lemn-suport-sticla': 'Barcă din lemn',
  'masina-retro-lemn-pahare-shot': 'Mașinuță retro din lemn',
  'camion-lemn-vin-pahare': 'Camion din lemn',
};
export const shortName = (it: { slug?: string; name: string }): string => (it.slug && SHORT[it.slug]) || it.name.split(',')[0];

const ENGRAVINGS = ['Pentru tata, de la Andrei', 'La mulți ani, Bogdan!', 'B 07 MIH', 'Nașilor noștri, cu drag', 'Căpitanul Radu', 'PH 22 SOR', 'Bunicului, cu dor', 'Mihai & Elena, 2026', 'Pescar de meserie', 'CJ 10 ALX', 'Pentru cel mai bun șofer', 'Pensionar fericit'];
const POPULAR: Record<string, number> = {
  'suport-sticla-vanatoare-mistret': 1.7,
  'suport-sticla-caine-rata': 1.1,
  'suport-sticla-cerb': 0.9,
  'cutie-cadou-rosie-vin-pahare': 1.5,
  'suport-servire-bulldog-verde': 1.0,
  'suport-servire-panda': 1.2,
  'barca-lemn-suport-sticla': 0.9,
  'masina-retro-lemn-pahare-shot': 1.4,
  'camion-lemn-vin-pahare': 0.6,
};
const MONTH = [0.72, 1.05, 1.15, 1.0, 0.9, 1.02, 0.85, 0.9, 1.0, 1.06, 1.3, 1.9];
const WEEKDAY = [0.75, 1.0, 0.95, 1.0, 1.05, 1.15, 1.2];

function ordersForDay(day0: number, today0: number, now: number, catalog: Product[]): AdminOrder[] {
  const d = new Date(day0);
  const n = dayNumber(day0);
  const r = rng(n * 7919 + 17);
  const age = Math.round((today0 - day0) / DAY);
  let lambda = 2.5 * MONTH[d.getMonth()] * WEEKDAY[d.getDay()] * (1 - 0.2 * (age / 365));
  if (d.getMonth() === 10) lambda *= 1.15; // Black Friday, toată luna noiembrie
  if (d.getMonth() === 11 && d.getDate() >= 8 && d.getDate() <= 22) lambda *= 1.35;
  // azi: câteva comenzi din ultimele ore, ca panoul să arate viu la orice oră
  const count = age === 0 ? 3 + poisson(r, lambda * 0.4) : poisson(r, lambda);
  const sinceOpen = Math.max(20 * 60_000, Math.min(now - day0 - 60_000, 9 * 3_600_000));
  const out: AdminOrder[] = [];
  const weights = catalog.map((p) => [p, POPULAR[p.slug] ?? 1] as const);
  for (let i = 0; i < count; i++) {
    const hour = weighted(r, [[9, 1], [10, 1.3], [11, 1.4], [12, 1.4], [13, 1.2], [14, 1.1], [15, 1.1], [16, 1.2], [17, 1.3], [18, 1.4], [19, 1.6], [20, 1.8], [21, 1.6], [22, 0.9], [23, 0.4], [7, 0.3], [8, 0.6]] as const);
    const jitter = r();
    const ts = age === 0 ? now - Math.floor(((count - 1 - i + jitter) / (count + 0.5)) * sinceOpen) - 4 * 60_000 : day0 + hour * 3_600_000 + Math.floor(jitter * 3_600_000);
    const nItems = weighted(r, [[1, 70], [2, 24], [3, 6]] as const);
    const items: OrderItem[] = [];
    for (let k = 0; k < nItems; k++) {
      const p = weighted(r, weights);
      if (items.some((x) => x.slug === p.slug)) continue;
      items.push({
        slug: p.slug,
        name: p.name,
        image: p.image,
        price: p.price,
        qty: r() < 0.1 ? 2 : 1,
        engraving: p.engravable && r() < 0.65 ? pick(r, ENGRAVINGS) : undefined,
      });
    }
    const loyal = r() < 0.3;
    const ci = r();
    const customer = loyal ? CUSTOMERS[Math.floor(Math.pow(ci, 1.3) * CUSTOMERS.length)] : person(n * 131 + i * 7 + 3, `n${n}-${i}`);
    const delivery: Delivery = r() < 0.43 ? 'ridicare' : 'curier';
    const payment: Payment = delivery === 'ridicare' ? (r() < 0.55 ? 'magazin' : 'card') : r() < 0.56 ? 'card' : 'ramburs';
    const sub = items.reduce((s, x) => s + x.price * x.qty, 0);
    const shipping = delivery === 'curier' && sub < 250 ? 19 : 0;

    const x = r();
    let status: Status;
    if (age === 0) status = i >= count - 2 ? 'noua' : x < 0.35 ? 'noua' : x < 0.88 ? 'pregatire' : delivery === 'ridicare' ? 'gata' : 'trimisa';
    else if (age === 1) status = x < 0.08 ? 'noua' : x < 0.35 ? 'pregatire' : x < 0.85 ? (delivery === 'ridicare' ? 'gata' : 'trimisa') : 'finalizata';
    else if (age <= 3) status = x < 0.08 ? 'pregatire' : x < 0.45 ? (delivery === 'ridicare' ? 'gata' : 'trimisa') : 'finalizata';
    else status = x < 0.025 ? 'anulata' : 'finalizata';

    // toate valorile se trag din generator și pentru comenzile „din viitor”, ca ziua de azi să rămână stabilă
    const order: AdminOrder = {
      id: `FC-${(n - 1400) * 10 + i}`,
      ts,
      customer: { ...customer, city: delivery === 'ridicare' ? 'Ridicare din magazin' : customer.city },
      delivery,
      payment,
      items,
      shipping,
      total: sub + shipping,
      status,
      awb: delivery === 'curier' && (status === 'trimisa' || status === 'finalizata') ? `${r() < 0.5 ? 'Sameday' : 'Fan Courier'} · ${Math.floor(1e9 + r() * 9e9)}` : undefined,
      note: r() < 0.08 ? pick(r, ['Vă rog ambalare de cadou, e pentru nași.', 'Sunați înainte de livrare, vă rog.', 'Ridic sâmbătă dimineață.', 'Puteți pune o felicitare?']) : undefined,
    };
    if (ts <= now) out.push(order);
  }
  return out;
}

const STATUS_FROM_SITE: Record<string, Status> = { Nouă: 'noua', 'În pregătire': 'pregatire', 'Gata de ridicare': 'gata', Trimisă: 'trimisa' };

/** Comenzile din ultimele `days` zile, cele mai noi primele. */
export function buildOrders(days = 760, now = Date.now()): AdminOrder[] {
  const edits = readProductEdits();
  const catalog = products.map((p) => withEdit(p, edits[p.slug]));
  const today0 = startOfDay(now);
  const list: AdminOrder[] = [];
  for (let a = 0; a < days; a++) list.push(...ordersForDay(today0 - a * DAY, today0, now, catalog).reverse());
  list.sort((a, b) => b.ts - a.ts);

  const site: AdminOrder[] = readOrders().map((o, i) => {
    const items = o.items.map((it) => {
      const p = catalog.find((x) => x.name === it.name);
      return { slug: p?.slug, name: it.name, image: p?.image, price: p?.price ?? 0, qty: it.qty, engraving: it.engraving };
    });
    return {
      id: o.number,
      ts: new Date(o.date).getTime(),
      customer: { id: `site-${i}`, name: o.name || 'Client site', phone: o.phone || '', city: o.delivery === 'ridicare' ? 'Ridicare din magazin' : 'Livrare prin curier' },
      delivery: o.delivery,
      payment: o.payment,
      items,
      shipping: Math.max(0, o.total - items.reduce((s, x) => s + x.price * x.qty, 0)),
      total: o.total,
      status: STATUS_FROM_SITE[o.status] ?? 'noua',
      fromSite: true,
    };
  });
  return [...site, ...list].sort((a, b) => b.ts - a.ts);
}

// ---------- statistici ----------
export type Range = '7' | '30' | '90' | '365';
export const rangeLabel: Record<Range, string> = { '7': '7 zile', '30': '30 de zile', '90': '3 luni', '365': '12 luni' };
export const rangePrev: Record<Range, string> = {
  '7': 'față de cele 7 zile dinainte',
  '30': 'față de cele 30 de zile dinainte',
  '90': 'față de cele 3 luni dinainte',
  '365': 'față de anul trecut',
};

export interface Point {
  label: string;
  full: string;
  cur: number;
  prev: number;
  orders: number;
}

const counts = (o: AdminOrder) => o.status !== 'anulata';

export function stats(all: AdminOrder[], range: Range, now = Date.now()) {
  const days = Number(range);
  const today0 = startOfDay(now);
  const from = today0 - (days - 1) * DAY;
  const prevFrom = from - days * DAY;
  const cur = all.filter((o) => counts(o) && o.ts >= from);
  const prev = all.filter((o) => counts(o) && o.ts >= prevFrom && o.ts < from);
  const sum = (l: AdminOrder[]) => l.reduce((s, o) => s + o.total, 0);

  const firstSeen = new Map<string, number>();
  for (let i = all.length - 1; i >= 0; i--) {
    const o = all[i];
    if (!firstSeen.has(o.customer.id)) firstSeen.set(o.customer.id, o.ts);
  }
  const newIn = (a: number, b: number) => [...firstSeen.values()].filter((t) => t >= a && t < b).length;

  // serie pentru grafic: zile (7/30), săptămâni (90), luni (365)
  const points: Point[] = [];
  if (range === '365') {
    const d = new Date(today0);
    for (let m = 11; m >= 0; m--) {
      const a = new Date(d.getFullYear(), d.getMonth() - m, 1).getTime();
      const b = new Date(d.getFullYear(), d.getMonth() - m + 1, 1).getTime();
      const pa = new Date(d.getFullYear() - 1, d.getMonth() - m, 1).getTime();
      const pb = new Date(d.getFullYear() - 1, d.getMonth() - m + 1, 1).getTime();
      const inA = all.filter((o) => counts(o) && o.ts >= a && o.ts < b);
      const month = new Date(a).toLocaleDateString('ro-RO', { month: 'short' }).replace('.', '');
      points.push({
        label: month,
        full: new Date(a).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
        cur: sum(inA),
        prev: sum(all.filter((o) => counts(o) && o.ts >= pa && o.ts < pb)),
        orders: inA.length,
      });
    }
  } else {
    const step = range === '90' ? 7 : 1;
    const n = Math.ceil(days / step);
    for (let k = n - 1; k >= 0; k--) {
      const b = today0 + DAY - k * step * DAY;
      const a = b - step * DAY;
      const inA = all.filter((o) => counts(o) && o.ts >= a && o.ts < b);
      const pa = a - days * DAY;
      const pb = b - days * DAY;
      const day = new Date(a);
      points.push({
        label: range === '7' ? day.toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '') : shortDate(a),
        full: step === 7 ? `săptămâna ${shortDate(a)} - ${shortDate(b - DAY)}` : day.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }),
        cur: sum(inA),
        prev: sum(all.filter((o) => counts(o) && o.ts >= pa && o.ts < pb)),
        orders: inA.length,
      });
    }
  }

  const bySlug = new Map<string, { qty: number; revenue: number }>();
  for (const o of cur)
    for (const it of o.items) {
      if (!it.slug) continue;
      const v = bySlug.get(it.slug) ?? { qty: 0, revenue: 0 };
      v.qty += it.qty;
      v.revenue += it.price * it.qty;
      bySlug.set(it.slug, v);
    }
  const top = [...bySlug.entries()]
    .map(([slug, v]) => ({ product: products.find((p) => p.slug === slug)!, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const share = <K extends string>(key: (o: AdminOrder) => K) => {
    const m = new Map<K, number>();
    for (const o of cur) m.set(key(o), (m.get(key(o)) ?? 0) + 1);
    return m;
  };

  return {
    revenue: sum(cur),
    revenuePrev: sum(prev),
    orders: cur.length,
    ordersPrev: prev.length,
    avg: cur.length ? sum(cur) / cur.length : 0,
    avgPrev: prev.length ? sum(prev) / prev.length : 0,
    newCustomers: newIn(from, today0 + DAY),
    newCustomersPrev: newIn(prevFrom, from),
    points,
    top,
    delivery: share((o) => o.delivery),
    payment: share((o) => o.payment),
    engraved: cur.filter((o) => o.items.some((i) => i.engraving)).length,
  };
}

// ---------- stoc (demo) ----------
export const STOCK: Record<string, number> = {
  'suport-sticla-vanatoare-mistret': 3,
  'suport-sticla-caine-rata': 2,
  'suport-sticla-cerb': 1,
  'cutie-cadou-rosie-vin-pahare': 8,
  'suport-servire-bulldog-verde': 4,
  'suport-servire-panda': 6,
  'barca-lemn-suport-sticla': 5,
  'masina-retro-lemn-pahare-shot': 7,
  'camion-lemn-vin-pahare': 0,
};

// ---------- programări studio ----------
export interface Appointment {
  id: string;
  ts: number;
  minutes: number;
  service: string;
  price: number;
  name: string;
  phone: string;
  people?: number;
  status: 'confirmata' | 'venit' | 'anulata';
  note?: string;
}
export const SERVICES = [
  { name: 'Poze buletin / pașaport', price: 30, minutes: 15 },
  { name: 'Poze viză SUA / Canada', price: 40, minutes: 15 },
  { name: 'Ședință foto familie', price: 350, minutes: 60 },
  { name: 'Ședință foto copii', price: 250, minutes: 45 },
  { name: 'Restaurare poze vechi', price: 60, minutes: 20 },
  { name: 'Printare și înrămare', price: 85, minutes: 20 },
  { name: 'Transfer casete video', price: 70, minutes: 15 },
] as const;

export function buildAppointments(now = Date.now()): Appointment[] {
  const today0 = startOfDay(now);
  const out: Appointment[] = [];
  for (let a = -3; a <= 10; a++) {
    const day0 = today0 + a * DAY;
    const d = new Date(day0);
    if (d.getDay() === 0) continue;
    const r = rng(dayNumber(day0) * 31 + 5);
    const close = d.getDay() === 6 ? 14 : 19;
    const n = Math.floor(2 + r() * (d.getDay() === 6 ? 3 : 5));
    const slots = new Set<number>();
    for (let i = 0; i < n; i++) slots.add(9 * 2 + Math.floor(r() * (close - 9.5) * 2));
    [...slots].sort((x, y) => x - y).forEach((s, i) => {
      const svc = weighted(r, SERVICES.map((v, k) => [v, [5, 2, 1.2, 1.2, 1, 1.4, 0.8][k]] as const));
      const c = CUSTOMERS[Math.floor(r() * CUSTOMERS.length)];
      const ts = day0 + (s / 2) * 3_600_000;
      out.push({
        id: `P-${dayNumber(day0)}-${i}`,
        ts,
        minutes: svc.minutes,
        service: svc.name,
        price: svc.price,
        name: c.name,
        phone: c.phone,
        people: svc.name.startsWith('Poze') && r() < 0.35 ? 2 : undefined,
        status: ts + svc.minutes * 60_000 < now ? (r() < 0.92 ? 'venit' : 'anulata') : 'confirmata',
        note: r() < 0.15 ? pick(r, ['Vine cu un bebeluș de 4 luni', 'Fundal alb, pentru viză', 'Aduce pozele pe stick', 'Ședință în exterior, dacă e soare']) : undefined,
      });
    });
  }
  return out;
}
