import { useMemo, useState } from 'react';
import { useAdmin, type OrderFilter } from './ctx';
import { shortName, deliveryLabel, doneLabel, flow, lei2, paymentLabel, statusInfo, when, type AdminOrder, type Status } from './data';
import { Drawer, Ico, PageHead, StatusPill, Thumb, btn, input } from './ui';

const TABS: { id: OrderFilter; label: string }[] = [
  { id: 'toate', label: 'Toate' },
  { id: 'noua', label: 'Noi' },
  { id: 'pregatire', label: 'În pregătire' },
  { id: 'gata', label: 'De ridicat' },
  { id: 'trimisa', label: 'Trimise' },
  { id: 'finalizata', label: 'Finalizate' },
  { id: 'anulata', label: 'Anulate' },
];
const SPECIAL: Partial<Record<OrderFilter, string>> = { gravura: 'Gravuri de făcut', 'de-trimis': 'Colete de predat curierului' };

const match = (o: AdminOrder, f: OrderFilter) =>
  f === 'toate' ||
  (f === 'gravura' ? (o.status === 'noua' || o.status === 'pregatire') && o.items.some((i) => i.engraving) : f === 'de-trimis' ? o.status === 'pregatire' && o.delivery === 'curier' : o.status === f);

const NEXT: Partial<Record<Status, { ridicare: string; curier: string }>> = {
  noua: { ridicare: 'Confirmă și începe pregătirea', curier: 'Confirmă și începe pregătirea' },
  pregatire: { ridicare: 'Gata, anunță clientul', curier: 'Predă curierului (AWB)' },
  gata: { ridicare: 'Marchează ridicată', curier: '' },
  trimisa: { ridicare: '', curier: 'Marchează livrată' },
};
const NEXT_TOAST: Partial<Record<Status, string>> = {
  pregatire: 'Comanda e în pregătire. Clientul a primit confirmarea pe e-mail.',
  gata: 'Clientul a primit mesaj că poate veni după comandă.',
  trimisa: 'AWB generat. Clientul primește linkul de urmărire.',
  finalizata: 'Comandă finalizată.',
};

export function OrderDrawer({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const { setStatus, toast, now } = useAdmin();
  if (!order) return null;
  const o = order;
  const steps = flow[o.delivery];
  const idx = o.status === 'anulata' ? -1 : steps.indexOf(o.status);
  const next = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null;
  const label = NEXT[o.status]?.[o.delivery];
  const sub = o.items.reduce((s, i) => s + i.price * i.qty, 0);
  const advance = () => {
    if (!next) return;
    setStatus(o.id, next);
    toast(NEXT_TOAST[next] ?? 'Status actualizat.');
  };
  const demo = (msg: string) => toast(msg);

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Comanda ${o.id}`}
      sub={<span className="flex flex-wrap items-center gap-2">{when(o.ts, now)} <StatusPill status={o.status} done={doneLabel[o.delivery]} /></span>}
      footer={
        <>
          {next && label && (
            <button type="button" className={btn.accent} onClick={advance}>
              <Ico name={next === 'trimisa' ? 'truck' : 'check'} size={18} /> {label}
            </button>
          )}
          <button type="button" className={btn.ghost} onClick={() => demo('Bonul s-a trimis la imprimantă (demo).')}><Ico name="printer" size={17} /> Tipărește</button>
          {o.status !== 'anulata' && o.status !== 'finalizata' && (
            <button type="button" className="ml-auto h-10 px-2 text-[14px] font-semibold text-[#972f20] hover:underline" onClick={() => { setStatus(o.id, 'anulata'); toast('Comanda a fost anulată.'); }}>Anulează</button>
          )}
        </>
      }
    >
      {o.fromSite && (
        <p className="mb-5 flex gap-3 rounded-[10px] border border-[#e2d3b6] bg-[#fbf5ea] p-4 text-[14px] leading-relaxed text-ink">
          <Ico name="sparkle" size={19} className="mt-0.5 text-accent" />
          <span><b>Comanda ta de test.</b> Ai plasat-o pe site, din pagina de finalizare. Exact așa ajunge aici fiecare comandă a unui client. Schimbă-i statusul și clientul îl vede în contul lui.</span>
        </p>
      )}

      {o.status !== 'anulata' && (
        <ol className="mb-6 grid grid-cols-4 gap-1.5" aria-label="Pașii comenzii">
          {steps.map((st, i) => (
            <li key={st} className="min-w-0">
              <span className={`block h-1.5 rounded-full ${i <= idx ? 'bg-accent' : 'bg-[#e8e1d5]'}`} />
              <span className={`mt-1.5 block truncate text-[12px] ${i === idx ? 'font-semibold text-ink-2' : 'text-muted'}`}>{st === 'finalizata' ? doneLabel[o.delivery] : statusInfo[st].label}</span>
            </li>
          ))}
        </ol>
      )}

      <section className="rounded-[12px] border border-[#e6ded0] bg-white">
        <h3 className="border-b border-[#f1ece3] px-4 py-3 text-[14px] font-semibold text-ink-2">Produse</h3>
        <ul className="divide-y divide-[#f1ece3]">
          {o.items.map((it, i) => (
            <li key={i} className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Thumb src={it.image} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug text-ink-2">{it.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{it.qty} × {lei2(it.price)}</p>
                </div>
                <b className="whitespace-nowrap text-[14px] tabular-nums">{lei2(it.price * it.qty)}</b>
              </div>
              {it.engraving && (
                <div className="mt-3 rounded-[10px] bg-[#faf7f1] p-3">
                  <p className="text-[12px] font-semibold text-muted">Text de gravat</p>
                  <div className="mt-1.5 grid h-12 place-items-center overflow-hidden rounded-lg bg-[#d9b98c] px-3 shadow-[inset_0_1px_4px_rgb(90_60_20/0.25)]">
                    <span className="truncate font-serif text-[17px] font-bold italic text-[#5a3b17]/85">{it.engraving}</span>
                  </div>
                  <button type="button" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#17834a] hover:underline" onClick={() => demo('Pe panoul real se deschide WhatsApp cu proba pentru client.')}>
                    <Ico name="wa" size={16} /> Trimite proba pe WhatsApp
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-1 gap-1.5 border-t border-[#f1ece3] px-4 py-3.5 text-[14px]">
          <div className="flex justify-between"><dt className="text-muted">Produse</dt><dd className="tabular-nums">{lei2(sub)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Livrare</dt><dd className="tabular-nums">{o.shipping ? lei2(o.shipping) : 'gratuit'}</dd></div>
          <div className="mt-1 flex justify-between border-t border-[#f1ece3] pt-2.5 text-[15.5px] font-bold"><dt>Total</dt><dd className="tabular-nums">{lei2(o.total)}</dd></div>
        </dl>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-[12px] border border-[#e6ded0] bg-white p-4">
          <h3 className="text-[14px] font-semibold text-ink-2">Client</h3>
          <p className="mt-2 text-[14.5px] text-ink-2">{o.customer.name}</p>
          <p className="text-[13.5px] text-muted">{o.customer.phone}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className={`${btn.wa} h-9 px-3 text-[13px]`} onClick={() => demo('Pe panoul real se deschide conversația de WhatsApp cu clientul.')}><Ico name="wa" size={16} /> WhatsApp</button>
            <button type="button" className={`${btn.ghost} h-9 px-3 text-[13px]`} onClick={() => demo('Pe telefon, butonul sună direct clientul.')}><Ico name="phone" size={15} /> Sună</button>
          </div>
        </section>
        <section className="rounded-[12px] border border-[#e6ded0] bg-white p-4">
          <h3 className="text-[14px] font-semibold text-ink-2">Livrare și plată</h3>
          <p className="mt-2 flex items-center gap-2 text-[14px] text-ink-2"><Ico name={o.delivery === 'curier' ? 'truck' : 'store'} size={17} className="text-accent" />{deliveryLabel[o.delivery]}{o.delivery === 'curier' && `, ${o.customer.city}`}</p>
          {o.awb && <p className="mt-1 pl-[25px] text-[12.5px] text-muted">{o.awb}</p>}
          <p className="mt-2 flex items-center gap-2 text-[14px] text-ink-2"><Ico name={o.payment === 'card' ? 'card' : 'cash'} size={17} className="text-accent" />{paymentLabel[o.payment]}</p>
          <p className="pl-[25px] text-[12.5px] text-muted">{o.payment === 'card' ? 'Plătită online' : o.payment === 'ramburs' ? 'Se încasează la livrare' : 'Se plătește la ridicare'}</p>
        </section>
      </div>
      {o.note && (
        <section className="mt-4 rounded-[12px] border border-[#e6ded0] bg-white p-4">
          <h3 className="text-[14px] font-semibold text-ink-2">Mesaj de la client</h3>
          <p className="mt-1.5 text-[14px] italic text-ink">„{o.note}”</p>
        </section>
      )}
    </Drawer>
  );
}

export default function Orders() {
  const { orders, nav, now, toast } = useAdmin();
  const [filter, setFilter] = useState<OrderFilter>(nav.filter ?? 'toate');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(30);
  const [openId, setOpenId] = useState<string | null>(nav.open ?? null);

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = useMemo(() => {
    const n = norm(q.trim());
    return orders.filter((o) => match(o, filter) && (!n || norm(`${o.id} ${o.customer.name} ${o.customer.city} ${o.items.map((i) => i.name).join(' ')}`).includes(n)));
  }, [orders, filter, q]);
  const count = (f: OrderFilter) => (f === 'toate' || f === 'finalizata' ? null : orders.filter((o) => match(o, f)).length);
  const open = openId ? orders.find((o) => o.id === openId) ?? null : null;

  return (
    <div className="adm-in">
      <PageHead title="Comenzi" sub="Fiecare comandă de pe site ajunge aici, cu tot ce trebuie pregătit.">
        <button type="button" className={btn.ghost} onClick={() => toast('Se descarcă fișierul cu comenzile, pentru contabilă (demo).')}><Ico name="upload" size={17} className="rotate-180" /> Exportă pentru contabilitate</button>
      </PageHead>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filtrează după status">
          {TABS.map((t) => {
            const n = count(t.id);
            const on = filter === t.id;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => { setFilter(t.id); setLimit(30); }} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[13.5px] font-semibold transition-colors ${on ? 'bg-ink-2 text-white' : 'bg-white text-muted ring-1 ring-[#e6ded0] hover:text-ink'}`}>
                {t.label}
                {n !== null && n > 0 && <span className={`rounded px-1.5 text-[11.5px] ${on ? 'bg-white/20' : 'bg-[#f3efe8] text-ink'}`}>{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="relative lg:w-[300px]">
          <Ico name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Număr, client, oraș, produs" aria-label="Caută comenzi" className={`${input} pl-9`} />
        </div>
      </div>
      {SPECIAL[filter] && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-[9px] bg-[#f6ecdb] py-1.5 pl-3 pr-1.5 text-[13.5px] font-semibold text-[#7a4a0e]">
          Filtru: {SPECIAL[filter]}
          <button type="button" className="grid size-6 place-items-center rounded-md hover:bg-white/60" onClick={() => setFilter('toate')} aria-label="Scoate filtrul"><Ico name="x" size={14} /></button>
        </p>
      )}

      <div className="overflow-hidden rounded-[12px] border border-[#e6ded0] bg-white">
        <div className="hidden grid-cols-[minmax(0,1.05fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_150px_150px_120px] gap-4 border-b border-[#efe9df] bg-[#faf7f1] px-5 py-3 text-[12.5px] font-semibold text-muted lg:grid">
          <span>Comanda</span><span>Client</span><span>Produse</span><span>Livrare și plată</span><span>Status</span><span className="text-right">Total</span>
        </div>
        {list.length === 0 && <p className="px-5 py-12 text-center text-[14.5px] text-muted">Nicio comandă aici. {filter !== 'toate' && 'Încearcă alt filtru.'}</p>}
        <ul className="divide-y divide-[#f1ece3]">
          {list.slice(0, limit).map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => setOpenId(o.id)} className={`grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-[#faf7f1] sm:px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_150px_150px_120px] lg:items-center ${o.fromSite ? 'bg-[#fdf9f1]' : ''}`}>
                <span className="min-w-0">
                  <b className="block text-[14px] text-ink-2">{o.id}</b>
                  <span className="block text-[12.5px] text-muted">{when(o.ts, now)}</span>
                </span>
                <span className="text-right lg:order-last">
                  <b className="block whitespace-nowrap text-[14.5px] tabular-nums text-ink-2">{lei2(o.total)}</b>
                  <span className="text-[12px] text-muted lg:hidden">{((n) => `${n} ${n === 1 ? 'produs' : 'produse'}`)(o.items.reduce((s, i) => s + i.qty, 0))}</span>
                </span>
                <span className="col-span-2 min-w-0 lg:col-span-1">
                  <span className="block truncate text-[14px] font-medium text-ink-2">{o.customer.name}{o.fromSite && <span className="ml-2 rounded bg-[#f6e7cf] px-1.5 py-px text-[11px] font-bold text-[#7a4a0e]">comanda ta</span>}</span>
                  <span className="block truncate text-[12.5px] text-muted">{o.customer.city}</span>
                </span>
                <span className="col-span-2 flex min-w-0 items-center gap-2 lg:col-span-1">
                  <span className="flex -space-x-2">{o.items.slice(0, 3).map((i, k) => <span key={k} className="rounded-lg ring-2 ring-white"><Thumb src={i.image} size={34} /></span>)}</span>
                  <span className="min-w-0 truncate text-[13px] text-muted">
                    {o.items[0] && shortName(o.items[0])}
                    {o.items.length > 1 && ` + încă ${o.items.length - 1}`}
                  </span>
                  {o.items.some((i) => i.engraving) && <span className="shrink-0 rounded bg-[#f3efe8] px-1.5 py-px text-[11.5px] font-semibold text-ink" title="Are gravură">gravură</span>}
                </span>
                <span className="hidden text-[13px] leading-snug text-muted lg:block">
                  <span className="flex items-center gap-1.5 text-ink"><Ico name={o.delivery === 'curier' ? 'truck' : 'store'} size={15} />{o.delivery === 'curier' ? 'Curier' : 'Ridicare'}</span>
                  {paymentLabel[o.payment]}
                </span>
                <span className="col-span-2 flex items-center justify-between gap-2 lg:col-span-1">
                  <StatusPill status={o.status} done={doneLabel[o.delivery]} />
                  <span className="text-[12.5px] text-muted lg:hidden">{o.delivery === 'curier' ? 'Curier' : 'Ridicare'} · {paymentLabel[o.payment]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {list.length > limit && (
          <div className="border-t border-[#efe9df] p-4 text-center">
            <button type="button" className={btn.ghost} onClick={() => setLimit(limit + 40)}>Arată mai multe ({list.length - limit} rămase)</button>
          </div>
        )}
      </div>
      <OrderDrawer order={open} onClose={() => setOpenId(null)} />
    </div>
  );
}
