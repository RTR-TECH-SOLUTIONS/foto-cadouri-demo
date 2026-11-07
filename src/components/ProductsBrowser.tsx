import { useEffect, useMemo, useState } from 'react';
import {
  categories, products, recipients, materials, occasions, meta, discount,
  type Category, type Recipient, type Material, type Occasion,
} from '../data/catalog';
import { addToCart, fmt } from '../lib/cart';

type Sort = 'recomandate' | 'pret-asc' | 'pret-desc' | 'reducere';
const presets = [
  { label: 'Sub 100 lei', min: '', max: '99' },
  { label: '100-150 lei', min: '100', max: '150' },
  { label: 'Peste 150 lei', min: '151', max: '' },
];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

interface Props {
  initialCat?: Category;
  lockCat?: boolean;
}

export default function ProductsBrowser({ initialCat, lockCat = false }: Props) {
  const [cats, setCats] = useState<Category[]>(initialCat ? [initialCat] : []);
  const [fors, setFors] = useState<Recipient[]>([]);
  const [occ, setOcc] = useState<Occasion[]>([]);
  const [mats, setMats] = useState<Material[]>([]);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [stock, setStock] = useState(false);
  const [sale, setSale] = useState(false);
  const [engr, setEngr] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('recomandate');
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const c = sp.get('cat');
    const f = sp.get('for');
    if (c && !lockCat) setCats([c as Category]);
    if (f) setFors([f as Recipient]);
    if (sp.get('reduceri')) setSale(true);
    setQ(sp.get('q') || '');
  }, [lockCat]);

  const base = useMemo(() => (lockCat && initialCat ? products.filter((p) => p.category === initialCat) : products), [lockCat, initialCat]);

  const list = useMemo(() => {
    const lo = min ? Number(min) : 0;
    const hi = max ? Number(max) : Infinity;
    let l = base.filter(
      (p) =>
        (!cats.length || cats.includes(p.category)) &&
        (!fors.length || p.for.some((f) => fors.includes(f))) &&
        (!occ.length || meta[p.slug]?.occ.some((o) => occ.includes(o))) &&
        (!mats.length || mats.includes(meta[p.slug]?.mat)) &&
        p.price >= lo && p.price <= hi &&
        (!stock || p.stock !== 'la-comanda') &&
        (!sale || !!p.oldPrice) &&
        (!engr || p.engravable) &&
        (!q || norm(`${p.name} ${p.short} ${p.material}`).includes(norm(q))),
    );
    if (sort === 'pret-asc') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'pret-desc') l = [...l].sort((a, b) => b.price - a.price);
    if (sort === 'reducere') l = [...l].sort((a, b) => discount(b) - discount(a));
    return l;
  }, [base, cats, fors, occ, mats, min, max, stock, sale, engr, q, sort]);

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const reset = () => {
    if (!lockCat) setCats([]);
    setFors([]); setOcc([]); setMats([]); setMin(''); setMax(''); setStock(false); setSale(false); setEngr(false); setQ('');
  };

  const chips: { label: string; off: () => void }[] = [
    ...(!lockCat ? cats.map((c) => ({ label: categories.find((x) => x.id === c)!.name, off: () => toggle(cats, c, setCats) })) : []),
    ...fors.map((f) => ({ label: recipients.find((x) => x.id === f)!.name, off: () => toggle(fors, f, setFors) })),
    ...occ.map((o) => ({ label: occasions.find((x) => x.id === o)!.name, off: () => toggle(occ, o, setOcc) })),
    ...mats.map((m) => ({ label: materials.find((x) => x.id === m)!.name, off: () => toggle(mats, m, setMats) })),
    ...(min || max ? [{ label: `${min || '0'} - ${max || 'max'} lei`, off: () => { setMin(''); setMax(''); } }] : []),
    ...(stock ? [{ label: 'În stoc', off: () => setStock(false) }] : []),
    ...(sale ? [{ label: 'Doar reduceri', off: () => setSale(false) }] : []),
    ...(engr ? [{ label: 'Se poate grava', off: () => setEngr(false) }] : []),
    ...(q ? [{ label: `„${q}”`, off: () => setQ('') }] : []),
  ];

  const count = (fn: (p: (typeof products)[number]) => boolean) => base.filter(fn).length;

  const Box = ({ checked, onChange, label, n }: { checked: boolean; onChange: () => void; label: string; n?: number }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1.5 text-[15px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-[18px] accent-[#8f6b39]" />
      <span className="flex-1">{label}</span>
      {n !== undefined && <span className="text-sm text-muted">{n}</span>}
    </label>
  );
  const Group = ({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) => (
    <details open={open} className="group border-b border-line pb-4 pt-4 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg font-bold text-ink">
        {title}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform group-open:rotate-180" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );

  const filters = (
    <div>
      {!lockCat && (
        <Group title="Categorie">
          {categories.map((c) => <Box key={c.id} checked={cats.includes(c.id)} onChange={() => toggle(cats, c.id, setCats)} label={c.name} n={count((p) => p.category === c.id)} />)}
        </Group>
      )}
      <Group title="Pentru cine">
        {recipients.map((r) => <Box key={r.id} checked={fors.includes(r.id)} onChange={() => toggle(fors, r.id, setFors)} label={r.name} n={count((p) => p.for.includes(r.id))} />)}
      </Group>
      <Group title="Ocazie">
        {occasions.map((o) => <Box key={o.id} checked={occ.includes(o.id)} onChange={() => toggle(occ, o.id, setOcc)} label={o.name} n={count((p) => !!meta[p.slug]?.occ.includes(o.id))} />)}
      </Group>
      <Group title="Preț">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="pmin">Preț minim</label>
          <input id="pmin" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} placeholder="min" className="field !min-h-10 !py-1.5 text-sm" />
          <span className="text-muted">-</span>
          <label className="sr-only" htmlFor="pmax">Preț maxim</label>
          <input id="pmax" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} placeholder="max" className="field !min-h-10 !py-1.5 text-sm" />
          <span className="text-sm text-muted">lei</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => {
            const on = min === p.min && max === p.max;
            return (
              <button key={p.label} type="button" onClick={() => { setMin(on ? '' : p.min); setMax(on ? '' : p.max); }} className={`h-9 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-line bg-white text-ink hover:border-accent-soft'}`}>
                {p.label}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Material">
        {materials.map((m) => <Box key={m.id} checked={mats.includes(m.id)} onChange={() => toggle(mats, m.id, setMats)} label={m.name} n={count((p) => meta[p.slug]?.mat === m.id)} />)}
      </Group>
      <Group title="Disponibilitate și ofertă">
        <Box checked={stock} onChange={() => setStock(!stock)} label="În stoc în magazin" n={count((p) => p.stock !== 'la-comanda')} />
        <Box checked={sale} onChange={() => setSale(!sale)} label="Doar reduceri" n={count((p) => !!p.oldPrice)} />
        <Box checked={engr} onChange={() => setEngr(!engr)} label="Se poate grava numele" n={count((p) => !!p.engravable)} />
      </Group>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">{filters}</aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
          <button type="button" className="btn btn-ghost !min-h-11 !px-4 lg:hidden" onClick={() => setPanel(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            Filtre {chips.length > 0 && <span className="rounded-md bg-accent px-1.5 text-xs text-white">{chips.length}</span>}
          </button>
          <p className="text-[15px] text-muted"><b className="text-ink">{list.length}</b> {list.length === 1 ? 'produs' : 'produse'}</p>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">Sortează</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !min-h-11 !w-auto !py-2 text-[15px] text-ink" aria-label="Sortează produsele">
              <option value="recomandate">Recomandate</option>
              <option value="pret-asc">Preț crescător</option>
              <option value="pret-desc">Preț descrescător</option>
              <option value="reducere">Cea mai mare reducere</option>
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button key={c.label} type="button" onClick={c.off} className="flex h-9 items-center gap-2 rounded-lg border border-line bg-cream-2 px-3 text-[13px] font-semibold text-ink hover:border-accent-soft" aria-label={`Scoate filtrul ${c.label}`}>
                {c.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            ))}
            <button type="button" onClick={reset} className="ml-1 text-sm font-semibold text-accent underline underline-offset-2">Șterge tot</button>
          </div>
        )}

        {list.length === 0 ? (
          <div className="mt-6 rounded-[10px] bg-cream-2 p-10 text-center">
            <p className="font-serif text-xl font-bold text-ink">Nu am găsit nimic pe site pentru filtrele alese.</p>
            <p className="mt-2 text-muted">În magazin avem mai multe modele. Scrie-ne pe WhatsApp și îți trimitem poze.</p>
            <button type="button" onClick={reset} className="btn btn-accent mt-5">Șterge filtrele</button>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3">
            {list.map((p) => {
              const off = discount(p);
              return (
                <li key={p.slug} className="group flex min-w-0 flex-col">
                  <a href={`/produs/${p.slug}`} className="relative block overflow-hidden rounded-[10px] bg-photo">
                    <img src={p.image} alt={p.name} width={600} height={600} loading="lazy" className="aspect-square w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
                    {(p.badge || off > 0) && <span className="absolute left-2.5 top-2.5 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-ink shadow-sm">{off > 0 ? `-${off}%` : p.badge}</span>}
                    {p.engravable && <span className="absolute bottom-2.5 left-2.5 rounded-md bg-ink/85 px-2 py-1 text-[11px] font-medium text-white sm:text-xs">Se poate grava</span>}
                  </a>
                  <a href={`/produs/${p.slug}`} className="mt-3 line-clamp-2 min-h-[2.8em] text-[14px] font-semibold leading-snug text-ink-2 hover:underline sm:text-[15px]">{p.name}</a>
                  <p className="mt-1 line-clamp-1 text-[13px] text-muted">{p.short}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="min-w-0 leading-tight">
                      <b className="text-[15px] sm:text-[16px]">{fmt(p.price)}</b>
                      {p.oldPrice && <s className="block text-[13px] text-muted sm:ml-1.5 sm:inline">{fmt(p.oldPrice)}</s>}
                    </p>
                    <button type="button" className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_4px_12px_-4px_rgb(118_86_40/0.6)] hover:bg-accent-dark" aria-label={`Adaugă în coș: ${p.name}`} onClick={() => addToCart({ slug: p.slug, name: p.name, price: p.price, image: p.image })}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanel(false)} />
          <div role="dialog" aria-modal="true" aria-label="Filtre" className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-serif text-xl font-bold text-ink">Filtre</h2>
              <button type="button" className="grid size-10 place-items-center rounded-lg" aria-label="Închide filtrele" onClick={() => setPanel(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filters}</div>
            <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-line p-4">
              <button type="button" className="btn btn-ghost !px-4" onClick={reset}>Șterge</button>
              <button type="button" className="btn btn-accent" onClick={() => setPanel(false)}>Vezi {list.length} produse</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
