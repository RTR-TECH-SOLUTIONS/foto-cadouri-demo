import { useEffect, useMemo, useState } from 'react';
import { banners } from '../../data/banners';
import { shop } from '../../data/shop';
import { readBannerEdits, resetEdits, saveBannerEdit, type BannerEdit } from '../../lib/overrides';
import { useAdmin } from './ctx';
import { lei, lei2, shortDate, shortName, when, type AdminOrder } from './data';
import { OrderDrawer } from './Orders';
import { Card, Drawer, Ico, PageHead, StatusPill, Thumb, Toggle, btn, input } from './ui';
import { doneLabel } from './data';

// ---------------- Clienți ----------------
interface Cust {
  id: string;
  name: string;
  phone: string;
  city: string;
  orders: AdminOrder[];
  total: number;
  last: number;
}

export function Customers() {
  const { orders, now } = useAdmin();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'total' | 'last' | 'orders'>('total');
  const [open, setOpen] = useState<Cust | null>(null);
  const [order, setOrder] = useState<AdminOrder | null>(null);

  const all = useMemo(() => {
    const m = new Map<string, Cust>();
    for (const o of orders) {
      if (o.status === 'anulata') continue;
      const c = m.get(o.customer.id) ?? { id: o.customer.id, name: o.customer.name, phone: o.customer.phone, city: o.customer.city, orders: [], total: 0, last: 0 };
      c.orders.push(o);
      c.total += o.total;
      c.last = Math.max(c.last, o.ts);
      if (o.delivery === 'curier') c.city = o.customer.city;
      m.set(o.customer.id, c);
    }
    return [...m.values()];
  }, [orders]);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const l = all.filter((c) => !n || `${c.name} ${c.city}`.toLowerCase().includes(n));
    return l.sort((a, b) => (sort === 'total' ? b.total - a.total : sort === 'last' ? b.last - a.last : b.orders.length - a.orders.length)).slice(0, 60);
  }, [all, q, sort]);
  const loyal = all.filter((c) => c.orders.length > 1).length;

  return (
    <div className="adm-in">
      <PageHead title="Clienți" sub={`${all.length} clienți au cumpărat în ultimii 2 ani. ${loyal} dintre ei au revenit.`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-[300px]">
          <Ico name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nume sau oraș" aria-label="Caută client" className={`${input} pl-9`} />
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-muted">
          Ordonează după
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${input} w-auto`}>
            <option value="total">Total cumpărat</option>
            <option value="orders">Număr de comenzi</option>
            <option value="last">Ultima comandă</option>
          </select>
        </label>
      </div>
      <div className="overflow-hidden rounded-[12px] border border-[#e6ded0] bg-white">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_110px_140px_150px] gap-4 border-b border-[#efe9df] bg-[#faf7f1] px-5 py-3 text-[12.5px] font-semibold text-muted md:grid">
          <span>Client</span><span>Oraș</span><span className="text-right">Comenzi</span><span className="text-right">Total cumpărat</span><span className="text-right">Ultima comandă</span>
        </div>
        <ul className="divide-y divide-[#f1ece3]">
          {list.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setOpen(c)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 text-left hover:bg-[#faf7f1] sm:px-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_110px_140px_150px]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f3eee5] text-[13px] font-bold text-accent">{c.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-ink-2">{c.name}</span>
                    <span className="block text-[12.5px] text-muted">{c.phone}</span>
                  </span>
                </span>
                <span className="hidden truncate text-[13.5px] text-muted md:block">{c.city}</span>
                <span className="hidden text-right text-[14px] tabular-nums md:block">{c.orders.length}{c.orders.length > 2 && <span className="ml-1.5 rounded bg-[#f6e7cf] px-1.5 text-[11px] font-bold text-[#7a4a0e]">fidel</span>}</span>
                <b className="text-right text-[14px] tabular-nums text-ink-2">{lei(c.total)}<span className="block text-[12px] font-normal text-muted md:hidden">{c.orders.length} comenzi</span></b>
                <span className="hidden text-right text-[13.5px] text-muted md:block">{when(c.last, now)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open && (
        <Drawer open onClose={() => setOpen(null)} title={open.name} sub={`${open.phone} · ${open.city}`}>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Comenzi', String(open.orders.length)],
              ['Total cumpărat', lei(open.total)],
              ['Client din', shortDate(open.orders[open.orders.length - 1].ts)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[10px] border border-[#e6ded0] bg-white p-3">
                <p className="text-[12px] text-muted">{k}</p>
                <p className="mt-0.5 text-[16px] font-semibold text-ink-2">{v}</p>
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-6 text-[14px] font-semibold text-ink-2">Comenzile lui</h3>
          <ul className="divide-y divide-[#f1ece3] rounded-[12px] border border-[#e6ded0] bg-white">
            {open.orders.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setOrder(o)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#faf7f1]">
                  <Thumb src={o.items[0]?.image} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink-2">{o.items.map(shortName).join(', ')}</span>
                    <span className="block text-[12.5px] text-muted">{o.id} · {when(o.ts, now)}</span>
                  </span>
                  <span className="text-right">
                    <b className="block text-[13.5px] tabular-nums">{lei2(o.total)}</b>
                    <StatusPill status={o.status} done={doneLabel[o.delivery]} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Drawer>
      )}
      <OrderDrawer order={order ? orders.find((o) => o.id === order.id) ?? null : null} onClose={() => setOrder(null)} />
    </div>
  );
}

// ---------------- Bannere ----------------
const TONE: Record<string, string> = { ink: '#1f1912', forest: '#1e2a1d', sand: '#3a2c1c', wine: '#3b1418', cream: '#efe6d6' };

export function Banners() {
  const { toast } = useAdmin();
  const [edits, setEdits] = useState<Record<string, BannerEdit>>({});
  const [on, setOn] = useState<boolean[]>(banners.map(() => true));
  useEffect(() => setEdits(readBannerEdits()), []);
  const val = (k: number, f: keyof BannerEdit) => edits[k]?.[f] ?? banners[k][f];
  const set = (k: number, f: keyof BannerEdit, v: string) => setEdits((e) => ({ ...e, [k]: { ...e[k], [f]: v } }));

  return (
    <div className="adm-in">
      <PageHead title="Bannere și texte" sub="Bannerele mari din prima pagină. Schimbi textul, salvezi, și apare pe site.">
        <a href="/" target="_blank" rel="noopener" className={btn.ghost}><Ico name="external" size={17} /> Vezi prima pagină</a>
      </PageHead>
      <div className="grid grid-cols-1 gap-5">
        {banners.map((b, k) => {
          const light = b.tone === 'cream';
          return (
            <Card key={k} pad={false}>
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="relative isolate min-h-[200px] overflow-hidden rounded-t-[12px] lg:rounded-l-[12px] lg:rounded-tr-none" style={{ background: TONE[b.tone] }}>
                  <img src={`/img/banner/b${k + 1}.webp`} alt="" width={1600} height={700} loading="lazy" className="absolute inset-y-0 right-0 -z-10 h-full w-[70%] object-cover object-right" />
                  <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(90deg, ${TONE[b.tone]} 30%, transparent 80%)` }} />
                  <div className={`max-w-[62%] p-5 ${light ? 'text-ink' : 'text-white'}`}>
                    <p className={`text-[11px] font-semibold ${light ? 'text-accent' : 'text-[#dcc39a]'}`}>{val(k, 'label')}</p>
                    <p className="mt-1.5 font-serif text-[1.15rem] font-extrabold leading-tight">{val(k, 'title')}</p>
                    <p className={`mt-1.5 line-clamp-3 text-[12px] leading-snug ${light ? 'text-muted' : 'text-white/75'}`}>{val(k, 'text')}</p>
                  </div>
                  <span className="absolute bottom-3 left-5 rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink">Banner {k + 1} · previzualizare</span>
                </div>
                <div className="grid grid-cols-1 gap-3 p-5 sm:p-6">
                  <label className="grid grid-cols-1 gap-1.5 text-[13px] font-semibold text-ink">Etichetă mică<input value={val(k, 'label')} onChange={(e) => set(k, 'label', e.target.value)} className={input} /></label>
                  <label className="grid grid-cols-1 gap-1.5 text-[13px] font-semibold text-ink">Titlu<input value={val(k, 'title')} onChange={(e) => set(k, 'title', e.target.value)} className={input} /></label>
                  <label className="grid grid-cols-1 gap-1.5 text-[13px] font-semibold text-ink">Text<textarea value={val(k, 'text')} onChange={(e) => set(k, 'text', e.target.value)} rows={2} className={`${input} h-auto py-2 leading-snug`} /></label>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-[13.5px] text-ink"><Toggle checked={on[k]} onChange={(v) => setOn((l) => l.map((x, i) => (i === k ? v : x)))} label={`Banner ${k + 1} afișat`} /> {on[k] ? 'Afișat pe site' : 'Ascuns'}</span>
                    <button type="button" className={btn.dark} onClick={() => { saveBannerEdit(k, edits[k] ?? {}); toast('Banner salvat. Deschide prima pagină și îl vezi cu textul nou.'); }}>Salvează</button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Setări ----------------
function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-[#f1ece3] py-4 first:border-0 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center sm:gap-6">
      <div>
        <p className="text-[14px] font-semibold text-ink-2">{title}</p>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Settings() {
  const { toast } = useAdmin();
  const [pay, setPay] = useState({ card: true, ramburs: true, magazin: true });
  const [notif, setNotif] = useState({ wa: true, mail: true, stock: true });
  const [pickup, setPickup] = useState(true);
  return (
    <div className="adm-in">
      <PageHead title="Setări" sub="Datele magazinului, livrarea, plățile și notificările.">
        <button type="button" className={btn.accent} onClick={() => toast('Setările au fost salvate.')}><Ico name="check" size={18} /> Salvează</button>
      </PageHead>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Datele magazinului" sub="Apar în subsolul site-ului, pe pagina de contact și pe hartă">
          <Row title="Numele magazinului"><input defaultValue={shop.name} className={input} /></Row>
          <Row title="Telefon și WhatsApp"><input defaultValue={shop.phone} className={input} /></Row>
          <Row title="E-mail pentru comenzi"><input defaultValue={shop.email} className={input} /></Row>
          <Row title="Adresa" hint="Se pune și pe harta Google"><input defaultValue={shop.address} className={input} /></Row>
          <Row title="Program">
            <div className="grid grid-cols-1 gap-2">{shop.hours.map((h) => <div key={h.days} className="flex items-center gap-2 text-[13.5px]"><span className="w-28 shrink-0 text-muted">{h.days}</span><input defaultValue={h.time} className={input} /></div>)}</div>
          </Row>
        </Card>
        <div className="grid grid-cols-1 content-start gap-5">
          <Card title="Livrare">
            <Row title="Livrare gratuită de la" hint="Sub suma asta clientul plătește curierul"><span className="relative block"><input defaultValue={shop.freeShipping} className={`${input} pr-10`} inputMode="numeric" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">lei</span></span></Row>
            <Row title="Cost curier"><span className="relative block"><input defaultValue={shop.shipping} className={`${input} pr-10`} inputMode="numeric" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">lei</span></span></Row>
            <Row title="Ridicare din magazin" hint="Gratuită, clientul e sunat când e gata"><Toggle checked={pickup} onChange={setPickup} label="Ridicare din magazin" /></Row>
          </Card>
          <Card title="Plăți" sub="Banii din plățile cu cardul intră direct în contul firmei">
            {([['card', 'Card online', 'Visa, Mastercard, prin procesatorul de plăți'], ['ramburs', 'Ramburs', 'Clientul plătește curierului'], ['magazin', 'La ridicare', 'Cash sau card, în magazin']] as const).map(([k, t, h]) => (
              <Row key={k} title={t} hint={h}><Toggle checked={pay[k]} onChange={(v) => setPay({ ...pay, [k]: v })} label={t} /></Row>
            ))}
          </Card>
          <Card title="Notificări">
            {([['wa', 'Comandă nouă pe WhatsApp', 'Primești un mesaj pe telefon la fiecare comandă'], ['mail', 'Comandă nouă pe e-mail', 'Cu toate detaliile, gata de tipărit'], ['stock', 'Stoc pe terminate', 'Când rămân 2 bucăți dintr-un produs']] as const).map(([k, t, h]) => (
              <Row key={k} title={t} hint={h}><Toggle checked={notif[k]} onChange={(v) => setNotif({ ...notif, [k]: v })} label={t} /></Row>
            ))}
          </Card>
          <Card title="Demo" sub="Doar pentru prezentare">
            <Row title="Readu prețurile și bannerele inițiale" hint="Șterge modificările făcute în panou pe acest dispozitiv">
              <button type="button" className={btn.ghost} onClick={() => { resetEdits(); try { ['fc-admin-added', 'fc-admin-meta', 'fc-admin-status', 'fc-admin-appts', 'fc-admin-appts-status', 'fc-admin-intro'].forEach((k) => localStorage.removeItem(k)); } catch { /* ignorat */ } toast('Gata, totul e ca la început. Pagina se reîncarcă.'); setTimeout(() => location.reload(), 900); }}>Resetează demo</button>
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
}
