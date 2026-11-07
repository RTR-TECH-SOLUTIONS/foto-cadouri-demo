import { useEffect, useState } from 'react';
import { fmt, readOrders, type Order } from '../lib/cart';

// Cont demo în localStorage. TODO(real): Supabase Auth (e-mail + parolă, resetare parolă), comenzi din backend.

interface User {
  name: string;
  email: string;
  phone?: string;
}
const KEY = 'fc-user';
const read = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
};

export default function Account() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setUser(read());
    setOrders(readOrders());
    setReady(true);
  }, []);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim();
    const pass = String(f.get('password') || '');
    const name = String(f.get('name') || '').trim();
    const err: Record<string, string> = {};
    if (mode === 'signup' && name.length < 3) err.name = 'Scrie numele complet.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = 'Adresa de e-mail nu pare corectă.';
    if (pass.length < 6) err.password = 'Parola are cel puțin 6 caractere.';
    if (mode === 'signup' && !f.get('terms')) err.terms = 'Bifează acordul ca să creăm contul.';
    setErrors(err);
    if (Object.keys(err).length) {
      document.getElementById(`acc-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    const u: User = { name: mode === 'signup' ? name : email.split('@')[0].replace(/[._]/g, ' '), email, phone: String(f.get('phone') || '') };
    try {
      localStorage.setItem(KEY, JSON.stringify(u));
    } catch {
      // ignorat în demo
    }
    setUser(u);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function logout() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignorat
    }
    setUser(null);
  }

  if (!ready) return <div className="h-96" />;

  const Err = ({ id }: { id: string }) => (errors[id] ? <p className="mt-1.5 text-sm text-[#a3362a]">{errors[id]}</p> : null);

  if (user) {
    const first = user.name.split(' ')[0];
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="eyebrow">Contul meu</p>
          <h1 className="h-sec mt-3 capitalize">Bună, {first}!</h1>
          <h2 className="mt-10 font-serif text-2xl font-bold text-ink">Comenzile tale</h2>
          {orders.length === 0 ? (
            <div className="mt-4 rounded-[12px] bg-cream-2 p-8 text-center">
              <p className="font-semibold text-ink">Nu ai încă nicio comandă.</p>
              <p className="mt-1 text-sm text-muted">Când comanzi, o vezi aici cu statusul ei: în pregătire, gata de ridicare sau trimisă.</p>
              <a href="/cadouri" className="btn btn-accent mt-5">Vezi cadourile</a>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-[12px] border border-line">
              {orders.map((o) => (
                <li key={o.number} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">Comanda {o.number}</p>
                    <p className="text-sm text-muted">
                      {new Date(o.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })} · {o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <span className="rounded-md bg-cream px-2.5 py-1 text-xs font-semibold text-accent">{o.delivery === 'ridicare' ? 'Se pregătește pentru ridicare' : 'În pregătire'}</span>
                  <b className="w-28 text-right">{fmt(o.total)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="self-start rounded-[12px] bg-cream p-6">
          <h2 className="font-serif text-xl font-bold text-ink">Datele tale</h2>
          <dl className="mt-4 grid gap-3 text-[15px]">
            <div><dt className="text-sm text-muted">Nume</dt><dd className="capitalize text-ink">{user.name}</dd></div>
            <div><dt className="text-sm text-muted">E-mail</dt><dd className="text-ink">{user.email}</dd></div>
            {user.phone && <div><dt className="text-sm text-muted">Telefon</dt><dd className="text-ink">{user.phone}</dd></div>}
          </dl>
          <button type="button" onClick={logout} className="btn btn-ghost mt-6 w-full">Ieși din cont</button>
        </aside>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[12px] border border-line md:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-cream p-10 md:flex">
        <div>
          <p className="eyebrow">Contul tău</p>
          <h2 className="mt-3 font-serif text-[2rem] font-extrabold leading-tight text-ink">Comenzile și gravurile tale, într-un singur loc</h2>
          <ul className="mt-7 grid gap-4 text-[15px] text-ink">
            {['Vezi când e gata comanda de ridicat', 'Primești aici proba pentru gravură, înainte să gravăm', 'Salvezi adresa pentru livrare prin curier'].map((t) => (
              <li key={t} className="flex gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-accent" aria-hidden><path d="m5 12.5 4.2 4.2L19 7" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <img src="/img/p/masina-retro-lemn-pahare-shot.webp" alt="" width={600} height={600} className="mx-auto mt-6 w-full max-w-[300px] mix-blend-multiply" />
      </div>

      <div className="bg-white p-6 sm:p-10">
        <div className="grid grid-cols-2 rounded-[10px] bg-cream-2 p-1" role="tablist" aria-label="Autentificare">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setErrors({}); }}
              className={`h-11 rounded-lg text-[15px] font-semibold transition-colors ${mode === m ? 'bg-white text-ink shadow-[0_1px_3px_rgb(44_36_25/0.15)]' : 'text-muted hover:text-ink'}`}
            >
              {m === 'login' ? 'Intră în cont' : 'Cont nou'}
            </button>
          ))}
        </div>

        <h1 className="mt-8 font-serif text-[1.9rem] font-extrabold text-ink">{mode === 'login' ? 'Bine ai revenit' : 'Creează-ți contul'}</h1>
        <p className="mt-1 text-[15px] text-muted">{mode === 'login' ? 'Intră cu e-mailul și parola.' : 'Durează un minut. Poți comanda și fără cont.'}</p>

        <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="acc-name" className="text-sm font-semibold text-ink">Nume și prenume</label>
              <input id="acc-name" name="name" autoComplete="name" className="field mt-1.5" aria-invalid={!!errors.name} />
              <Err id="name" />
            </div>
          )}
          <div>
            <label htmlFor="acc-email" className="text-sm font-semibold text-ink">E-mail</label>
            <input id="acc-email" name="email" type="email" autoComplete="email" className="field mt-1.5" aria-invalid={!!errors.email} />
            <Err id="email" />
          </div>
          {mode === 'signup' && (
            <div>
              <label htmlFor="acc-phone" className="text-sm font-semibold text-ink">Telefon <span className="font-normal text-muted">(pentru ridicare și curier)</span></label>
              <input id="acc-phone" name="phone" type="tel" autoComplete="tel" className="field mt-1.5" />
            </div>
          )}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="acc-password" className="text-sm font-semibold text-ink">Parolă</label>
              {mode === 'login' && <a href="#" className="text-sm text-accent underline underline-offset-2">Ai uitat parola?</a>}
            </div>
            <div className="relative mt-1.5">
              <input id="acc-password" name="password" type={show ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="field pr-20" aria-invalid={!!errors.password} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-muted hover:text-ink" aria-label={show ? 'Ascunde parola' : 'Arată parola'}>
                {show ? 'Ascunde' : 'Arată'}
              </button>
            </div>
            <Err id="password" />
          </div>
          {mode === 'login' ? (
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" name="remember" defaultChecked className="size-[18px] accent-[#8f6b39]" /> Ține-mă minte pe acest dispozitiv
            </label>
          ) : (
            <div>
              <label className="flex items-start gap-2.5 text-sm text-ink">
                <input id="acc-terms" type="checkbox" name="terms" className="mt-0.5 size-[18px] accent-[#8f6b39]" />
                <span>Sunt de acord cu termenii și condițiile și cu prelucrarea datelor pentru comenzi.</span>
              </label>
              <Err id="terms" />
            </div>
          )}
          <button className="btn btn-accent mt-2 w-full">{mode === 'login' ? 'Intră în cont' : 'Creează contul'}</button>
        </form>

        <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          Vrei doar să comanzi? <a href="/cadouri" className="font-semibold text-ink underline underline-offset-2">Poți comanda și fără cont</a>
        </p>
      </div>
    </div>
  );
}
