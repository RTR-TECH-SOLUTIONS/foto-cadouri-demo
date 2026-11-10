import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { products } from '../../data/catalog';
import { AdminCtx, useAdmin as useAdminLocal, type AdminState, type Nav, type Route } from './ctx';
import { buildAppointments, buildOrders, startOfDay, when, lei2, type Appointment, type Status } from './data';
import { Ico, Thumb, btn } from './ui';
import Dashboard from './Dashboard';
import Orders from './Orders';
import Catalog from './Catalog';
import Studio from './Studio';
import { Banners, Customers, Settings } from './More';

// Panou de administrare DEMO: totul rulează în browser, cu date generate și localStorage.
// TODO(real): autentificare Supabase, comenzi/produse din baza de date, roluri (proprietar / angajat).

const NAV: { group: string; items: { id: Route; label: string; icon: string }[] }[] = [
  {
    group: 'Magazin',
    items: [
      { id: 'panou', label: 'Panou', icon: 'home' },
      { id: 'comenzi', label: 'Comenzi', icon: 'orders' },
      { id: 'produse', label: 'Produse și prețuri', icon: 'box' },
      { id: 'clienti', label: 'Clienți', icon: 'users' },
    ],
  },
  { group: 'Studio foto', items: [{ id: 'studio', label: 'Programări', icon: 'camera' }] },
  {
    group: 'Site',
    items: [
      { id: 'bannere', label: 'Bannere și texte', icon: 'image' },
      { id: 'setari', label: 'Setări', icon: 'settings' },
    ],
  },
];
const TITLES: Record<Route, string> = {
  panou: 'Panou',
  comenzi: 'Comenzi',
  produse: 'Produse și prețuri',
  clienti: 'Clienți',
  studio: 'Programări studio',
  bannere: 'Bannere și texte',
  setari: 'Setări',
};
const ROUTES = Object.keys(TITLES) as Route[];
const STATUS_KEY = 'fc-admin-status';
const APPTS_KEY = 'fc-admin-appts';
const SITE_STATUS: Partial<Record<Status, string>> = { noua: 'Nouă', pregatire: 'În pregătire', gata: 'Gata de ridicare', trimisa: 'Trimisă', finalizata: 'Finalizată', anulata: 'Anulată' };

const store = {
  get<T>(k: string, empty: T): T {
    try {
      return JSON.parse(localStorage.getItem(k) || 'null') ?? empty;
    } catch {
      return empty;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      // ignorat în demo
    }
  },
};

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={small ? 28 : 32} height={small ? 28 : 32} viewBox="0 0 34 34" fill="none" aria-hidden className="text-[#d9c29a]">
        <rect x="5" y="13" width="24" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="3.5" y="9" width="27" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M17 9v20" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17" cy="21" r="3.6" stroke="currentColor" strokeWidth="1.4" fill="#1c1813" />
        <path d="M17 9s-2-4.6-4.8-4.2C9.6 5.2 10.6 9 17 9Zm0 0s2-4.6 4.8-4.2C24.4 5.2 23.4 9 17 9Z" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="whitespace-nowrap font-serif text-[1.2rem] font-extrabold leading-none tracking-tight text-white">
        Foto <span className="font-semibold italic text-[#c9ab7c]">&amp;</span> Cadouri
      </span>
    </span>
  );
}

function Login({ onIn }: { onIn: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-dvh bg-[#f5f1ea] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative isolate hidden overflow-hidden bg-[#1c1813] lg:block">
        <img src="/img/scene/cont.webp" alt="" width={1000} height={1250} className="absolute inset-0 -z-10 size-full object-cover object-bottom opacity-80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1b140e]/95 via-[#1b140e]/60 via-50% to-[#1b140e]/10" aria-hidden />
        <div className="flex h-full flex-col p-12 xl:p-16">
          <Logo />
          <h1 className="mt-16 max-w-[15ch] font-serif text-[2.6rem] font-extrabold leading-[1.08] text-white">Tot magazinul tău, într-un singur loc</h1>
          <ul className="mt-8 grid max-w-md gap-3.5 text-[15.5px] text-white/85">
            {['Vezi fiecare comandă în momentul în care intră', 'Schimbi prețuri și pui reduceri, apar imediat pe site', 'Ții evidența programărilor la studio'].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#e2c99c] text-[#1b140e]"><Ico name="check" size={12} stroke={3} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <form
          className="w-full max-w-[400px]"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setTimeout(onIn, 550);
          }}
        >
          <div className="mb-10 inline-flex rounded-xl bg-[#1c1813] px-4 py-3 lg:hidden"><Logo small /></div>
          <p className="eyebrow">Panou de administrare</p>
          <h2 className="mt-2 font-serif text-[2rem] font-extrabold leading-tight text-ink">Intră în contul magazinului</h2>
          <p className="mt-2 text-[15px] text-muted">Partea asta a site-ului o vezi doar tu. Clienții nu au acces aici.</p>
          <label className="mt-8 block text-[13.5px] font-semibold text-ink" htmlFor="adm-email">E-mail</label>
          <input id="adm-email" defaultValue="admin@fotosicadouri.ro" autoComplete="username" className="field mt-1.5" />
          <label className="mt-4 block text-[13.5px] font-semibold text-ink" htmlFor="adm-pass">Parolă</label>
          <input id="adm-pass" type="password" defaultValue="demo-magazin" autoComplete="current-password" className="field mt-1.5" />
          <button className="btn btn-ink mt-6 w-full" disabled={busy}>
            {busy ? 'Se deschide panoul…' : 'Intră în panou'}
          </button>
          <p className="mt-5 rounded-[10px] bg-white px-4 py-3 text-[13.5px] leading-relaxed text-muted ring-1 ring-[#e6ded0]">
            <b className="text-ink">Demo:</b> datele sunt deja completate, apasă doar butonul. Pe site-ul real intri cu parola ta.
          </p>
          <a href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-2">Înapoi la magazin</a>
        </form>
      </main>
    </div>
  );
}

function Search() {
  const { orders, go } = useAdminLocal();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const off = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, []);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const n = norm(q.trim());
  const res = useMemo(() => {
    if (n.length < 2) return null;
    return {
      orders: orders.filter((o) => norm(`${o.id} ${o.customer.name}`).includes(n)).slice(0, 5),
      products: products.filter((p) => norm(p.name).includes(n)).slice(0, 3),
    };
  }, [n, orders]);
  return (
    <div ref={box} className="relative hidden w-full max-w-[420px] md:block">
      <Ico name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Caută comandă, client sau produs"
        aria-label="Caută în panou"
        className="h-10 w-full rounded-[10px] border border-[#e0d7c8] bg-white pl-10 pr-3 text-[14.5px] outline-none placeholder:text-[#9a907f] focus:border-accent"
      />
      {open && res && (
        <div className="absolute inset-x-0 top-12 z-40 overflow-hidden rounded-[12px] border border-[#e6ded0] bg-white shadow-[0_16px_40px_-12px_rgb(44_36_25/0.3)]">
          {!res.orders.length && !res.products.length && <p className="px-4 py-4 text-sm text-muted">Nimic găsit pentru „{q}”.</p>}
          {!!res.orders.length && <p className="px-4 pb-1 pt-3 text-[12px] font-semibold text-muted">Comenzi</p>}
          {res.orders.map((o) => (
            <button key={o.id} type="button" className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-[#faf7f1]" onClick={() => { go('comenzi', { open: o.id }); setOpen(false); setQ(''); }}>
              <span><b className="text-ink-2">{o.id}</b> · {o.customer.name}</span>
              <span className="text-muted">{lei2(o.total)}</span>
            </button>
          ))}
          {!!res.products.length && <p className="px-4 pb-1 pt-3 text-[12px] font-semibold text-muted">Produse</p>}
          {res.products.map((p) => (
            <button key={p.slug} type="button" className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-[#faf7f1]" onClick={() => { go('produse', { open: p.slug }); setOpen(false); setQ(''); }}>
              <Thumb src={p.image} size={32} />
              <span className="line-clamp-1">{p.name}</span>
            </button>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}

function Bell() {
  const { orders, go, now } = useAdminLocal();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const off = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, []);
  const fresh = orders.filter((o) => o.status === 'noua');
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="relative grid size-10 place-items-center rounded-[10px] border border-[#e0d7c8] bg-white text-ink hover:bg-[#faf7f1]" aria-label={`Notificări: ${fresh.length} comenzi noi`} aria-expanded={open}>
        <Ico name="bell" size={19} />
        {fresh.length > 0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{fresh.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-[12px] border border-[#e6ded0] bg-white shadow-[0_16px_40px_-12px_rgb(44_36_25/0.3)]">
          <p className="border-b border-[#efe9df] px-4 py-3 text-sm font-semibold text-ink-2">Comenzi noi, de confirmat</p>
          <ul className="max-h-[340px] overflow-y-auto">
            {fresh.length === 0 && <li className="px-4 py-4 text-sm text-muted">Nicio comandă nouă. Le-ai confirmat pe toate.</li>}
            {fresh.slice(0, 8).map((o) => (
              <li key={o.id}>
                <button type="button" className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#faf7f1]" onClick={() => { go('comenzi', { open: o.id }); setOpen(false); }}>
                  <Thumb src={o.items[0]?.image} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink-2">{o.customer.name} · {lei2(o.total)}</span>
                    <span className="block text-[12.5px] text-muted">{o.id} · {when(o.ts, now)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [now] = useState(() => Date.now());
  const [nav, setNav] = useState<Nav>({ route: 'panou' });
  const [menu, setMenu] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const base = useMemo(() => buildOrders(760, now), [now]);
  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});
  const [appointments, setAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem('fc-admin-auth') === '1');
    } catch {
      setAuthed(false);
    }
    setStatusMap(store.get(STATUS_KEY, {}));
    const extra = store.get<Appointment[]>(APPTS_KEY, []);
    const st = store.get<Record<string, Appointment['status']>>(`${APPTS_KEY}-status`, {});
    setAppts([...buildAppointments(now), ...extra].map((a) => (st[a.id] ? { ...a, status: st[a.id] } : a)).sort((a, b) => a.ts - b.ts));
    const fromHash = () => {
      const r = location.hash.replace('#', '') as Route;
      setNav((n) => (ROUTES.includes(r) && r !== n.route ? { route: r } : n));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [now]);

  const orders = useMemo(() => base.map((o) => (statusMap[o.id] ? { ...o, status: statusMap[o.id] } : o)), [base, statusMap]);

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const go = useCallback<AdminState['go']>((route, opts) => {
    setNav({ route, ...opts });
    setMenu(false);
    if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
    window.scrollTo({ top: 0 });
  }, []);

  const setStatus = useCallback((id: string, s: Status) => {
    setStatusMap((m) => {
      const next = { ...m, [id]: s };
      store.set(STATUS_KEY, next);
      return next;
    });
    // comenzile plasate pe site: clientul vede statusul nou în „Contul meu”
    const site = store.get<{ number: string; status: string }[]>('fc-orders', []);
    if (site.some((o) => o.number === id)) store.set('fc-orders', site.map((o) => (o.number === id ? { ...o, status: SITE_STATUS[s] } : o)));
  }, []);

  const setAppointments = useCallback<AdminState['setAppointments']>((fn) => {
    setAppts((list) => {
      const next = fn(list);
      store.set(APPTS_KEY, next.filter((a) => a.id.startsWith('N-')));
      store.set(`${APPTS_KEY}-status`, Object.fromEntries(next.map((a) => [a.id, a.status])));
      return next;
    });
  }, []);

  const state: AdminState = { now, nav, go, orders, setStatus, appointments, setAppointments, toast };

  if (authed === null) return <div className="min-h-dvh bg-[#f5f1ea]" />;
  if (!authed)
    return (
      <Login
        onIn={() => {
          try {
            sessionStorage.setItem('fc-admin-auth', '1');
          } catch {
            // ignorat
          }
          setAuthed(true);
        }}
      />
    );

  const newCount = orders.filter((o) => o.status === 'noua').length;
  const todayAppts = appointments.filter((a) => startOfDay(a.ts) === startOfDay(now) && a.status === 'confirmata').length;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-6 pt-6">
        <a href="#panou" onClick={(e) => { e.preventDefault(); go('panou'); }} aria-label="Panou"><Logo small /></a>
        <button type="button" className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setMenu(false)} aria-label="Închide meniul"><Ico name="x" /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Panou de administrare">
        {NAV.map((g) => (
          <div key={g.group} className="mb-5">
            <p className="px-3 pb-1.5 text-[12.5px] font-medium text-[#8f8574]">{g.group}</p>
            <ul className="grid grid-cols-1 gap-0.5">
              {g.items.map((it) => {
                const on = nav.route === it.id;
                const badge = it.id === 'comenzi' ? newCount : it.id === 'studio' ? todayAppts : 0;
                return (
                  <li key={it.id}>
                    <a
                      href={`#${it.id}`}
                      onClick={(e) => { e.preventDefault(); go(it.id); }}
                      aria-current={on ? 'page' : undefined}
                      className={`group flex h-10 items-center gap-3 rounded-[9px] px-3 text-[14.5px] transition-colors duration-150 ${on ? 'bg-white/[0.09] font-semibold text-white' : 'text-[#cfc5b5] hover:bg-white/[0.05] hover:text-white'}`}
                    >
                      <Ico name={it.icon} size={19} className={on ? 'text-[#e2c99c]' : 'text-[#9d927f] group-hover:text-[#d9c29a]'} />
                      <span className="flex-1">{it.label}</span>
                      {badge > 0 && <span className={`rounded-md px-1.5 py-px text-[11.5px] font-bold ${it.id === 'comenzi' ? 'bg-accent text-white' : 'bg-white/10 text-[#e2c99c]'}`}>{badge}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noopener" className="flex h-10 items-center gap-3 rounded-[9px] px-3 text-[14px] text-[#cfc5b5] hover:bg-white/[0.05] hover:text-white">
          <Ico name="external" size={18} className="text-[#9d927f]" /> Vezi site-ul
        </a>
        <div className="mt-2 flex items-center gap-3 rounded-[10px] bg-white/[0.05] px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-[#e2c99c] text-[13px] font-bold text-[#1c1813]">FC</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-semibold text-white">Proprietar</span>
            <span className="block truncate text-[12px] text-[#9d927f]">admin@fotosicadouri.ro</span>
          </span>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-[#9d927f] hover:bg-white/10 hover:text-white"
            aria-label="Ieși din panou"
            title="Ieși din panou"
            onClick={() => {
              try {
                sessionStorage.removeItem('fc-admin-auth');
              } catch {
                // ignorat
              }
              setAuthed(false);
            }}
          >
            <Ico name="logout" size={17} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminCtx.Provider value={state}>
      <div className="min-h-dvh bg-[#f5f1ea] text-ink-2 lg:pl-[252px]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] bg-[#1c1813] lg:block">
          {sidebar}
        </aside>
        {menu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="adm-fade absolute inset-0 bg-black/50" aria-label="Închide meniul" onClick={() => setMenu(false)} />
            <aside className="adm-slide-l absolute inset-y-0 left-0 w-[min(290px,86vw)] bg-[#1c1813]">
              {sidebar}
            </aside>
          </div>
        )}

        <header className="sticky top-0 z-20 border-b border-[#e6ded0] bg-[#f5f1ea]/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" className="grid size-10 place-items-center rounded-[10px] border border-[#e0d7c8] bg-white lg:hidden" onClick={() => setMenu(true)} aria-label="Deschide meniul">
              <Ico name="menu" size={19} />
            </button>
            <p className="min-w-0 truncate font-serif text-[1.15rem] font-bold text-ink md:hidden">{TITLES[nav.route]}</p>
            <Search />
            <div className="ml-auto flex items-center gap-2">
              <a href="/" target="_blank" rel="noopener" className={`${btn.ghost} px-3 sm:px-4`}>
                <Ico name="external" size={17} /> <span className="sm:hidden">Site</span><span className="hidden sm:inline">Vezi magazinul</span>
              </a>
              <Bell />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {nav.route === 'panou' && <Dashboard />}
          {nav.route === 'comenzi' && <Orders key={`${nav.filter}-${nav.open}`} />}
          {nav.route === 'produse' && <Catalog key={nav.open} />}
          {nav.route === 'clienti' && <Customers />}
          {nav.route === 'studio' && <Studio />}
          {nav.route === 'bannere' && <Banners />}
          {nav.route === 'setari' && <Settings />}
        </main>

        <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3 sm:bottom-5 sm:top-auto sm:px-4" aria-live="polite">
          {toasts.map((t) => (
            <p key={t.id} className="adm-toast flex max-w-[520px] items-start gap-2.5 rounded-[10px] bg-[#1c1813] px-4 py-3 text-[14px] leading-snug text-white shadow-[0_12px_32px_-10px_rgb(0_0_0/0.5)]">
              <Ico name="check" size={18} stroke={2.4} className="mt-px text-[#9fd3a8]" />
              {t.msg}
            </p>
          ))}
        </div>
      </div>
    </AdminCtx.Provider>
  );
}
