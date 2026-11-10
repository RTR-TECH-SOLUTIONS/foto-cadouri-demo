import { useEffect, useMemo, useRef, useState } from 'react';
import { categories, products, type Category } from '../../data/catalog';
import { readProductEdits, saveProductEdit, withEdit } from '../../lib/overrides';
import { useAdmin } from './ctx';
import { DAY, STOCK, lei, startOfDay } from './data';
import { Drawer, Ico, PageHead, Thumb, Toggle, btn, input } from './ui';

// Produse adăugate din panou (doar în demo, în localStorage). TODO(real): tabel `products` + upload în storage.
const ADDED = 'fc-admin-added';
const META = 'fc-admin-meta';

interface Row {
  slug: string;
  name: string;
  short: string;
  description: string;
  category: Category | 'rame-albume';
  image?: string;
  price: number;
  oldPrice?: number;
  qty: number;
  hidden: boolean;
  engravable: boolean;
  added?: boolean;
}

const get = <T,>(k: string, e: T): T => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null') ?? e;
  } catch {
    return e;
  }
};
const put = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // ignorat
  }
};

function loadRows(): Row[] {
  const edits = readProductEdits();
  const meta = get<Record<string, Partial<Row>>>(META, {});
  const base: Row[] = products.map((p) => {
    const e = edits[p.slug];
    const live = withEdit(p, e);
    return {
      slug: p.slug,
      name: p.name,
      short: p.short,
      description: p.description.join('\n\n'),
      category: p.category,
      image: p.image,
      price: live.price,
      oldPrice: live.oldPrice,
      qty: e?.qty ?? STOCK[p.slug] ?? 0,
      hidden: !!e?.hidden,
      engravable: !!p.engravable,
      ...meta[p.slug],
    };
  });
  return [...get<Row[]>(ADDED, []), ...base];
}

function resize(file: File): Promise<string> {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 520 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = fail;
    img.src = URL.createObjectURL(file);
  });
}

function PriceInput({ value, onCommit, placeholder, label }: { value?: number; onCommit: (v: number | null) => void; placeholder?: string; label: string }) {
  const [v, setV] = useState(value ? String(value) : '');
  useEffect(() => setV(value ? String(value) : ''), [value]);
  const commit = () => {
    const n = Number(v.replace(',', '.'));
    if (!v.trim()) onCommit(null);
    else if (n > 0 && n !== value) onCommit(Math.round(n * 100) / 100);
    else setV(value ? String(value) : '');
  };
  return (
    <span className="relative block">
      <input
        value={v}
        onChange={(e) => setV(e.target.value.replace(/[^\d.,]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        inputMode="decimal"
        placeholder={placeholder}
        aria-label={label}
        className={`${input} pr-10 text-right tabular-nums`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">lei</span>
    </span>
  );
}

function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <span className="inline-flex h-10 items-center rounded-[9px] border border-[#e0d7c8] bg-white" role="group" aria-label={label}>
      <button type="button" className="h-full w-9 text-lg text-muted hover:text-ink" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Scade stocul">−</button>
      <span className="w-7 text-center text-[14px] font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="h-full w-9 text-lg text-muted hover:text-ink" onClick={() => onChange(value + 1)} aria-label="Crește stocul">+</button>
    </span>
  );
}

const stockTag = (q: number) =>
  q === 0 ? <span className="text-[12px] font-semibold text-[#972f20]">epuizat, apare „la comandă”</span> : q <= 2 ? <span className="text-[12px] font-semibold text-[#7a4a0e]">pe terminate</span> : <span className="text-[12px] text-muted">în stoc</span>;

function Editor({ row, onClose, onSave }: { row: Row; onClose: () => void; onSave: (r: Row) => void }) {
  const [r, setR] = useState<Row>(row);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Row>(k: K, v: Row[K]) => setR((x) => ({ ...x, [k]: v }));
  const isNew = !row.name;
  const off = r.oldPrice && r.oldPrice > r.price ? Math.round((1 - r.price / r.oldPrice) * 100) : 0;
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      set('image', await resize(f));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Drawer
      open
      wide
      onClose={onClose}
      title={isNew ? 'Produs nou' : 'Editează produsul'}
      sub={isNew ? 'Completezi, apeși Salvează și produsul apare în magazin.' : r.name}
      footer={
        <>
          <button type="button" className={btn.accent} disabled={!r.name.trim() || !r.price} onClick={() => onSave(r)}>
            <Ico name="check" size={18} /> {isNew ? 'Adaugă produsul' : 'Salvează'}
          </button>
          <button type="button" className={btn.ghost} onClick={onClose}>Renunță</button>
          {!isNew && !r.added && (
            <a href={`/produs/${r.slug}`} target="_blank" rel="noopener" className="ml-auto inline-flex h-10 items-center gap-1.5 px-2 text-[14px] font-semibold text-ink underline-offset-2 hover:underline">Vezi pe site <Ico name="external" size={15} /></a>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5">
        <section>
          <p className="text-[13.5px] font-semibold text-ink">Poze</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {r.image && (
              <span className="relative">
                <Thumb src={r.image} size={104} cover={r.image.startsWith('data:')} />
                <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 text-[11px] font-semibold text-ink">principală</span>
              </span>
            )}
            {!isNew && !r.added && <Thumb src={`/img/orig/${r.slug}.jpg`} size={104} cover />}
            <button
              type="button"
              onClick={() => file.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files[0]);
              }}
              className="grid size-[104px] place-items-center rounded-lg border-2 border-dashed border-[#d8ccb7] bg-white text-center text-[12px] font-semibold text-muted hover:border-accent hover:text-accent"
            >
              <span className="grid place-items-center gap-1"><Ico name="upload" size={20} />{busy ? 'Se încarcă…' : 'Adaugă poză'}</span>
            </button>
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <p className="mt-2 text-[12.5px] text-muted">Faci poza cu telefonul și o încarci de aici. Fundalul îl curățăm noi la pornirea site-ului.</p>
        </section>

        <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
          Nume produs
          <input value={r.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="ex. Suport sticlă din rășină cu urs" />
        </label>
        <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
          Descriere scurtă <span className="-mt-1 text-[12px] font-normal text-muted">apare sub nume, pe card</span>
          <input value={r.short} onChange={(e) => set('short', e.target.value)} className={input} placeholder="ex. Pictat manual, ține o sticlă de 0,75 l" />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
            Categorie
            <select value={r.category} onChange={(e) => set('category', e.target.value as Row['category'])} className={input}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="rame-albume">Rame și albume</option>
            </select>
          </label>
          <div className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
            Bucăți în stoc
            <Stepper value={r.qty} onChange={(n) => set('qty', n)} label="Stoc" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 rounded-[12px] border border-[#e6ded0] bg-white p-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
            Preț
            <PriceInput value={r.price || undefined} onCommit={(v) => set('price', v ?? 0)} label="Preț" />
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
            Preț vechi, tăiat <span className="-mt-1 text-[12px] font-normal text-muted">gol = fără reducere</span>
            <PriceInput value={r.oldPrice} onCommit={(v) => set('oldPrice', v ?? undefined)} placeholder="fără reducere" label="Preț vechi" />
          </div>
          <p className="text-[13px] text-muted sm:col-span-2">
            {off > 0 ? <>Pe site apare cu <b className="text-ink">-{off}%</b> și prețul vechi tăiat.</> : 'Pune un preț vechi mai mare și pe site apare reducerea.'}
          </p>
        </div>
        <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">
          Descriere
          <textarea value={r.description} onChange={(e) => set('description', e.target.value)} rows={5} className={`${input} h-auto py-2.5 leading-relaxed`} placeholder="Din ce e făcut, cât de mare e, pentru cine e potrivit." />
        </label>
        <div className="grid grid-cols-1 gap-3 rounded-[12px] border border-[#e6ded0] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <span><b className="block text-[14px] text-ink-2">Se poate grava</b><span className="text-[12.5px] text-muted">Pe pagina produsului apare câmpul pentru text</span></span>
            <Toggle checked={r.engravable} onChange={(v) => set('engravable', v)} label="Se poate grava" />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#f1ece3] pt-3">
            <span><b className="block text-[14px] text-ink-2">Afișat pe site</b><span className="text-[12.5px] text-muted">Îl ascunzi când nu-l mai ai, fără să-l ștergi</span></span>
            <Toggle checked={!r.hidden} onChange={(v) => set('hidden', !v)} label="Afișat pe site" />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function Catalog() {
  const { orders, now, nav, toast } = useAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [cat, setCat] = useState<Row['category'] | 'toate'>('toate');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Row | null>(null);

  useEffect(() => {
    const r = loadRows();
    setRows(r);
    if (nav.open) setEdit(r.find((x) => x.slug === nav.open) ?? null);
  }, [nav.open]);

  const sold = useMemo(() => {
    const from = startOfDay(now) - 29 * DAY;
    const m = new Map<string, number>();
    for (const o of orders) {
      if (o.ts < from) break;
      if (o.status === 'anulata') continue;
      for (const i of o.items) if (i.slug) m.set(i.slug, (m.get(i.slug) ?? 0) + i.qty);
    }
    return m;
  }, [orders, now]);

  const persist = (r: Row, msg?: string) => {
    if (r.added) {
      const added = get<Row[]>(ADDED, []).map((x) => (x.slug === r.slug ? r : x));
      put(ADDED, added);
    } else {
      saveProductEdit(r.slug, { price: r.price, oldPrice: r.oldPrice ?? null, hidden: r.hidden, qty: r.qty });
      const meta = get<Record<string, Partial<Row>>>(META, {});
      const p = products.find((x) => x.slug === r.slug)!;
      meta[r.slug] = { name: r.name, short: r.short, description: r.description, category: r.category, engravable: r.engravable };
      if (r.name === p.name && r.short === p.short && r.category === p.category) delete meta[r.slug];
      put(META, meta);
    }
    setRows((list) => list.map((x) => (x.slug === r.slug ? r : x)));
    if (msg) toast(msg);
  };

  const save = (r: Row) => {
    if (!r.slug) {
      const nr: Row = { ...r, slug: `nou-${Date.now().toString(36)}`, added: true };
      put(ADDED, [nr, ...get<Row[]>(ADDED, [])]);
      setRows((l) => [nr, ...l]);
      toast(`„${nr.name}” a fost adăugat. Pe site-ul real apare imediat în magazin.`);
    } else persist(r, 'Produs salvat. Deschide magazinul să vezi schimbarea.');
    setEdit(null);
  };

  const list = rows.filter((r) => (cat === 'toate' || r.category === cat) && (!q || r.name.toLowerCase().includes(q.toLowerCase())));
  const changed = (r: Row) => {
    const p = products.find((x) => x.slug === r.slug);
    return !!p && (p.price !== r.price || (p.oldPrice ?? 0) !== (r.oldPrice ?? 0) || r.hidden);
  };

  const fresh: Row = { slug: '', name: '', short: '', description: '', category: 'suporturi-sticle', price: 0, qty: 1, hidden: false, engravable: false };

  return (
    <div className="adm-in">
      <PageHead title="Produse și prețuri" sub={`${rows.length} produse · schimbi prețul aici și se schimbă pe site, pe loc.`}>
        <button type="button" className={btn.accent} onClick={() => setEdit(fresh)}><Ico name="plus" size={18} stroke={2.2} /> Adaugă produs</button>
      </PageHead>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {[{ id: 'toate' as const, name: 'Toate' }, ...categories].map((c) => (
            <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)} className={`h-9 shrink-0 rounded-[9px] px-3.5 text-[13.5px] font-semibold transition-colors ${cat === c.id ? 'bg-ink-2 text-white' : 'bg-white text-muted ring-1 ring-[#e6ded0] hover:text-ink'}`}>{c.name}</button>
          ))}
        </div>
        <div className="relative lg:w-[280px]">
          <Ico name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută produs" aria-label="Caută produs" className={`${input} pl-9`} />
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#e6ded0] bg-white">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_130px_140px_150px_90px_64px_44px] items-center gap-4 border-b border-[#efe9df] bg-[#faf7f1] px-5 py-3 text-[12.5px] font-semibold text-muted xl:grid">
          <span>Produs</span><span className="text-right">Preț</span><span className="text-right">Preț vechi (reducere)</span><span>Stoc</span><span className="whitespace-nowrap text-right">Vândute, 30 zile</span><span>Pe site</span><span />
        </div>
        <ul className="divide-y divide-[#f1ece3]">
          {list.map((r) => {
            const off = r.oldPrice && r.oldPrice > r.price ? Math.round((1 - r.price / r.oldPrice) * 100) : 0;
            return (
              <li key={r.slug} className={`relative grid grid-cols-2 gap-x-3 gap-y-3 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,2.2fr)_130px_140px_150px_112px_64px_44px] xl:items-center xl:gap-4 ${r.hidden ? 'bg-[#faf8f4]' : ''}`}>
                <div className="col-span-2 flex min-w-0 items-center gap-3.5 pr-11 xl:col-span-1 xl:pr-0">
                  <span className={r.hidden ? 'opacity-40' : ''}><Thumb src={r.image} size={56} cover={r.image?.startsWith('data:')} /></span>
                  <div className="min-w-0">
                    <button type="button" onClick={() => setEdit(r)} className="line-clamp-2 text-left text-[14.5px] font-semibold leading-snug text-ink-2 hover:underline">{r.name}</button>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                      {categories.find((c) => c.id === r.category)?.name ?? 'Rame și albume'}
                      {off > 0 && <span className="rounded bg-[#f6e7cf] px-1.5 font-bold text-[#7a4a0e]">-{off}%</span>}
                      {r.added && <span className="rounded bg-[#e1efe3] px-1.5 font-bold text-[#2c5e35]">nou adăugat</span>}
                      {changed(r) && !r.added && (
                        <a href={`/produs/${r.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">modificat · vezi pe site <Ico name="external" size={12} /></a>
                      )}
                    </p>
                  </div>
                </div>
                <label className="grid grid-cols-1 gap-1 text-[12px] text-muted xl:block">
                  <span className="xl:sr-only">Preț</span>
                  <PriceInput value={r.price} label={`Preț ${r.name}`} onCommit={(v) => v && persist({ ...r, price: v, oldPrice: r.oldPrice && r.oldPrice > v ? r.oldPrice : undefined }, `Prețul e acum ${lei(v)}. Deschide magazinul și îl vezi schimbat.`)} />
                </label>
                <label className="grid grid-cols-1 gap-1 text-[12px] text-muted xl:block">
                  <span className="xl:sr-only">Preț vechi</span>
                  <PriceInput value={r.oldPrice} placeholder="fără" label={`Preț vechi ${r.name}`} onCommit={(v) => persist({ ...r, oldPrice: v && v > r.price ? v : undefined }, v && v > r.price ? `Reducere de ${Math.round((1 - r.price / v) * 100)}% pusă pe site.` : 'Reducerea a fost scoasă.')} />
                </label>
                <div className="col-span-2 flex items-center gap-3 sm:col-span-1 xl:block">
                  <Stepper value={r.qty} label={`Stoc ${r.name}`} onChange={(n) => persist({ ...r, qty: n })} />
                  <span className="whitespace-nowrap xl:mt-1 xl:block">{stockTag(r.qty)}</span>
                </div>
                <p className="flex items-center text-[14px] tabular-nums text-ink-2 sm:justify-end xl:block xl:text-right"><span className="text-[12px] text-muted xl:hidden">vândute în 30 de zile</span><b className="ml-1.5 xl:ml-0">{sold.get(r.slug) ?? 0}</b></p>
                <div className="flex items-center gap-2">
                  <Toggle checked={!r.hidden} label={`Afișat pe site: ${r.name}`} onChange={(v) => persist({ ...r, hidden: !v }, v ? 'Produsul apare din nou pe site.' : 'Produsul e ascuns de pe site. Nu l-ai șters, îl poți reafișa oricând.')} />
                  <span className="text-[12.5px] text-muted xl:hidden">{r.hidden ? 'ascuns' : 'pe site'}</span>
                </div>
                <button type="button" onClick={() => setEdit(r)} className="absolute right-3 top-3.5 grid size-10 place-items-center rounded-[9px] text-muted hover:bg-[#f3efe8] hover:text-ink xl:static" aria-label={`Editează ${r.name}`}>
                  <Ico name="edit" size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {edit && <Editor row={edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}

