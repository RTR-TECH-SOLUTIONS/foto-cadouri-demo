import { useEffect, useMemo, useState } from 'react';
import { useAdmin, type OrderFilter } from './ctx';
import { STOCK, shortName, doneLabel, lei, lei2, paymentLabel, rangeLabel, rangePrev, startOfDay, stats, timeOf, when, type Range } from './data';
import { C1, C2, C3, RevenueChart, SegBar, Sparkline } from './charts';
import { Card, Delta, Ico, Segmented, StatusPill, Thumb, btn } from './ui';
import { products } from '../../data/catalog';
import { readProductEdits } from '../../lib/overrides';

const INTRO = 'fc-admin-intro';

function greeting(now: number) {
  const h = new Date(now).getHours();
  return h < 11 ? 'Bună dimineața' : h < 18 ? 'Bună ziua' : 'Bună seara';
}

function Tile({ label, value, children, spark }: { label: string; value: string; children?: React.ReactNode; spark?: number[] }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#e6ded0] bg-white p-4 shadow-[0_1px_2px_rgb(44_36_25/0.04)] sm:p-5">
      <p className="text-[13px] leading-snug text-muted sm:text-[13.5px]">{label}</p>
      <p className="mt-1.5 text-[1.45rem] font-semibold leading-none tracking-tight text-ink-2 sm:text-[1.75rem]">{value}</p>
      {children}
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

export default function Dashboard() {
  const { orders, now, go, appointments } = useAdmin();
  const [range, setRange] = useState<Range>('30');
  const [table, setTable] = useState(false);
  const [intro, setIntro] = useState(false);
  useEffect(() => {
    try {
      setIntro(localStorage.getItem(INTRO) !== '0');
    } catch {
      setIntro(true);
    }
  }, []);
  const closeIntro = () => {
    setIntro(false);
    try {
      localStorage.setItem(INTRO, '0');
    } catch {
      // ignorat
    }
  };

  const s = useMemo(() => stats(orders, range, now), [orders, range, now]);
  const today0 = startOfDay(now);
  const todo: { n: number; label: [string, string]; hint: string; icon: string; filter?: OrderFilter; studio?: boolean }[] = [
    { n: orders.filter((o) => o.status === 'noua').length, label: ['comandă nouă de confirmat', 'comenzi noi de confirmat'], hint: 'Le confirmi și clientul primește mesaj', icon: 'bell', filter: 'noua' },
    { n: orders.filter((o) => (o.status === 'noua' || o.status === 'pregatire') && o.items.some((i) => i.engraving)).length, label: ['gravură de făcut', 'gravuri de făcut'], hint: 'Textul e trecut la fiecare comandă', icon: 'pen', filter: 'gravura' },
    { n: orders.filter((o) => o.status === 'pregatire' && o.delivery === 'curier').length, label: ['colet de predat curierului', 'colete de predat curierului'], hint: 'Generezi AWB-ul dintr-un click', icon: 'truck', filter: 'de-trimis' },
    { n: orders.filter((o) => o.status === 'gata').length, label: ['comandă așteaptă ridicarea', 'comenzi așteaptă ridicarea'], hint: 'Clientul a fost anunțat', icon: 'store', filter: 'gata' },
    { n: appointments.filter((a) => startOfDay(a.ts) === today0 && a.status === 'confirmata').length, label: ['programare la studio azi', 'programări la studio azi'], hint: 'Poze acte, ședințe, printare', icon: 'camera', studio: true },
  ];
  const edits = readProductEdits();
  const low = products
    .map((p) => ({ p, qty: edits[p.slug]?.qty ?? STOCK[p.slug] ?? 0 }))
    .filter((x) => x.qty <= 2)
    .sort((a, b) => a.qty - b.qty);
  const deliveryTotal = (s.delivery.get('ridicare') ?? 0) + (s.delivery.get('curier') ?? 0);
  const repeat = s.orders ? Math.round(((s.orders - s.newCustomers) / s.orders) * 100) : 0;
  const recent = orders.slice(0, 6);
  const topMax = s.top[0]?.revenue || 1;

  return (
    <div className="adm-in">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
        <div>
          <p className="text-[14px] capitalize text-muted">{new Date(now).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="mt-1 font-serif text-[clamp(1.7rem,1.2rem+1.4vw,2.3rem)] font-extrabold leading-tight text-ink">{greeting(now)}! Iată cum merge magazinul.</h1>
        </div>
        <Segmented<Range> label="Perioada" value={range} onChange={setRange} options={(['7', '30', '90', '365'] as Range[]).map((id) => ({ id, label: rangeLabel[id] }))} />
      </div>

      {intro && (
        <div className="mb-5 flex flex-col gap-4 rounded-[12px] border border-[#e2d3b6] bg-[#fbf5ea] p-4 sm:mb-6 sm:flex-row sm:items-center sm:p-6">
          <span className="hidden size-11 shrink-0 place-items-center rounded-[10px] bg-white text-accent ring-1 ring-[#eadcc0] sm:grid"><Ico name="info" size={22} /></span>
          <div className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-ink">
            <p className="font-semibold text-ink-2">Ăsta e panoul de administrare: partea din spate a site-ului, pe care o vezi doar tu.</p>
            <p className="mt-1 text-muted">De aici vezi comenzile și vânzările, schimbi prețuri și pui reduceri.<span className="hidden sm:inline"> Încearcă: schimbă un preț la <b className="text-ink">Produse și prețuri</b>, apoi deschide magazinul. Sau plasează o comandă pe site și o vezi apărând aici.</span></p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className={btn.dark} onClick={() => go('produse')}>Schimbă un preț</button>
            <button type="button" className="grid size-10 place-items-center rounded-[9px] text-muted hover:bg-white hover:text-ink" onClick={closeIntro} aria-label="Ascunde explicația"><Ico name="x" size={18} /></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card
          title="Vânzări"
          sub={`Ultimele ${rangeLabel[range]}, fără comenzile anulate`}
          action={
            <button type="button" className={`${btn.ghost} h-9 px-3 text-[13px]`} onClick={() => setTable(!table)} aria-pressed={table}>
              <Ico name={table ? 'chart' : 'table'} size={16} /> {table ? 'Grafic' : 'Tabel'}
            </button>
          }
        >
          <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p className="text-[clamp(2.4rem,1.9rem+1.6vw,3.2rem)] font-semibold leading-none tracking-tight text-ink-2">{lei(s.revenue)}</p>
            <Delta cur={s.revenue} prev={s.revenuePrev} suffix={rangePrev[range]} />
          </div>
          {table ? (
            <div className="max-h-[300px] overflow-y-auto rounded-[10px] border border-[#efe9df]">
              <table className="w-full text-[13.5px]">
                <thead className="sticky top-0 bg-[#faf7f1] text-left text-muted">
                  <tr><th className="px-3 py-2 font-medium">Perioada</th><th className="px-3 py-2 text-right font-medium">Vânzări</th><th className="px-3 py-2 text-right font-medium">Înainte</th><th className="px-3 py-2 text-right font-medium">Comenzi</th></tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...s.points].reverse().map((p) => (
                    <tr key={p.full} className="border-t border-[#f1ece3]"><td className="px-3 py-2 capitalize">{p.full}</td><td className="px-3 py-2 text-right font-semibold">{lei(p.cur)}</td><td className="px-3 py-2 text-right text-muted">{lei(p.prev)}</td><td className="px-3 py-2 text-right">{p.orders}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <RevenueChart points={s.points} curLabel={`Ultimele ${rangeLabel[range]}`} prevLabel={range === '365' ? 'Anul trecut' : 'Perioada dinainte'} />
          )}
        </Card>

        <Card title="De făcut azi" sub="Click pe un rând și vezi comenzile">
          <ul className="-mx-2 -mt-2 grid grid-cols-1">
            {todo.map((t) => (
              <li key={t.icon}>
                <button type="button" onClick={() => (t.studio ? go('studio') : go('comenzi', { filter: t.filter }))} className="group flex w-full items-center gap-3.5 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-[#faf7f1]">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-[10px] ${t.n ? 'bg-[#f6ecdb] text-accent' : 'bg-[#f3efe8] text-[#a79c8a]'}`}><Ico name={t.icon} size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] text-ink-2"><b className="text-[16px]">{t.n}</b> {t.label[t.n === 1 ? 0 : 1]}</span>
                    <span className="block truncate text-[12.5px] text-muted">{t.hint}</span>
                  </span>
                  <Ico name="chevron" size={17} className="text-[#b7ab97] transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 xl:grid-cols-4">
        <Tile label="Comenzi" value={s.orders.toLocaleString('ro-RO')} spark={s.points.map((p) => p.orders)}>
          <Delta compact cur={s.orders} prev={s.ordersPrev} suffix="față de perioada dinainte" />
        </Tile>
        <Tile label="Valoare medie comandă" value={lei(s.avg)} spark={s.points.map((p) => (p.orders ? p.cur / p.orders : 0))}>
          <Delta compact cur={s.avg} prev={s.avgPrev} suffix="față de perioada dinainte" />
        </Tile>
        <Tile label="Clienți noi" value={s.newCustomers.toLocaleString('ro-RO')}>
          <Delta compact cur={s.newCustomers} prev={s.newCustomersPrev} suffix="față de perioada dinainte" />
          <p className="mt-3 hidden border-t border-[#f1ece3] pt-3 text-[13px] text-muted"><b className="text-ink-2">{repeat}%</b> din comenzi vin de la clienți care au mai cumpărat</p>
        </Tile>
        <Tile label="Comenzi cu gravură" value={s.engraved.toLocaleString('ro-RO')}>
          <p className="mt-2 text-[12.5px] text-muted">{s.orders ? Math.round((s.engraved / s.orders) * 100) : 0}% din comenzi</p>
          <p className="mt-3 hidden border-t border-[#f1ece3] pt-3 text-[13px] text-muted">Gravura gratuită ridică valoarea comenzii</p>
        </Tile>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-5 sm:gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card title="Cele mai vândute produse" sub={`După încasări, ultimele ${rangeLabel[range]}`} action={<button type="button" className="text-[13.5px] font-semibold text-accent hover:underline" onClick={() => go('produse')}>Toate produsele</button>}>
          <ul className="grid grid-cols-1 gap-4">
            {s.top.slice(0, 6).map((t) => (
              <li key={t.product.slug}>
                <button type="button" className="group flex w-full items-center gap-3.5 text-left" onClick={() => go('produse', { open: t.product.slug })}>
                  <Thumb src={t.product.image} alt="" size={46} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                      <span className="min-w-0 truncate text-[14px] font-medium text-ink-2 group-hover:underline"><span className="sm:hidden">{shortName(t.product)}</span><span className="hidden sm:inline">{t.product.name}</span></span>
                      <span className="shrink-0 whitespace-nowrap text-[13px] tabular-nums text-muted sm:text-[13.5px]"><b className="font-semibold text-ink-2">{lei(t.revenue)}</b> · {t.qty} buc.</span>
                    </span>
                    <span className="mt-2 block h-2.5 rounded-r-[4px] bg-[#f3efe8]">
                      <span className="block h-full rounded-r-[4px] transition-[width] duration-500 ease-out" style={{ width: `${(t.revenue / topMax) * 100}%`, background: C1 }} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid grid-cols-1 content-start gap-3 sm:gap-5">
          <Card title="Cum își iau clienții comanda" sub={`${deliveryTotal} comenzi în perioada aleasă`}>
            <SegBar
              label="Livrare"
              parts={[
                { name: 'Ridicare din magazin', value: s.delivery.get('ridicare') ?? 0, color: C1 },
                { name: 'Curier', value: s.delivery.get('curier') ?? 0, color: C2 },
              ]}
            />
            <p className="mt-6 text-[15.5px] font-semibold text-ink-2">Cum plătesc</p>
            <div className="mt-3">
              <SegBar
                label="Plată"
                parts={(['card', 'ramburs', 'magazin'] as const).map((k, i) => ({ name: paymentLabel[k], value: s.payment.get(k) ?? 0, color: [C1, C2, C3][i], dark: i === 2 }))}
              />
            </div>
          </Card>
          <Card title="Stoc pe terminate" sub="Comandă de la furnizor înainte de sărbători">
            {low.length === 0 ? (
              <p className="text-sm text-muted">Ai stoc suficient la toate produsele.</p>
            ) : (
              <ul className="-my-1 grid grid-cols-1">
                {low.map(({ p, qty }) => (
                  <li key={p.slug}>
                    <button type="button" className="flex w-full items-center gap-3 py-1.5 text-left" onClick={() => go('produse', { open: p.slug })}>
                      <Thumb src={p.image} size={38} />
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink-2">{shortName(p)}</span>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${qty === 0 ? 'bg-[#f6e1dc] text-[#972f20]' : 'bg-[#f6e7cf] text-[#7a4a0e]'}`}>{qty === 0 ? 'stoc epuizat' : `${qty} ${qty === 1 ? 'bucată' : 'bucăți'}`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-3 sm:mt-5" pad={false} title="Ultimele comenzi" sub="Se actualizează singure, imediat ce cineva comandă" action={<button type="button" className="text-[13.5px] font-semibold text-accent hover:underline" onClick={() => go('comenzi')}>Toate comenzile</button>}>
        <ul className="mt-3 divide-y divide-[#f1ece3] border-t border-[#f1ece3]">
          {recent.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => go('comenzi', { open: o.id })} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left transition-colors hover:bg-[#faf7f1] sm:grid-cols-[42px_minmax(0,1.2fr)_minmax(0,1fr)_140px_104px] sm:px-6">
                <Thumb src={o.items[0]?.image} size={42} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-ink-2">{o.customer.name}{o.fromSite && <span className="ml-2 rounded bg-[#f6e7cf] px-1.5 py-px text-[11px] font-bold text-[#7a4a0e]">de pe site, acum</span>}</span>
                  <span className="block truncate text-[12.5px] text-muted">{o.id} · {when(o.ts, now)}</span>
                </span>
                <span className="hidden min-w-0 truncate text-[13.5px] text-muted sm:block">{o.items.map(shortName).join(', ')}</span>
                <span className="hidden sm:block"><StatusPill status={o.status} done={doneLabel[o.delivery]} /></span>
                <span className="text-right">
                  <b className="block whitespace-nowrap text-[14px] tabular-nums text-ink-2">{lei2(o.total)}</b>
                  <span className="block text-[12px] text-muted sm:hidden">{timeOf(o.ts)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
