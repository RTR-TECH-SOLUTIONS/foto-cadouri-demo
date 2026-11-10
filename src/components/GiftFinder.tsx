import { useEffect, useMemo, useRef, useState } from 'react';
import { products, recipients, type Recipient } from '../data/catalog';
import { addToCart, fmt } from '../lib/cart';
import { liveProducts } from '../lib/overrides';

const budgets = [
  { id: 'sub100', label: 'Sub 100 lei', test: (p: number) => p < 100 },
  { id: '100-150', label: '100-150 lei', test: (p: number) => p >= 100 && p <= 150 },
  { id: 'peste150', label: 'Peste 150 lei', test: (p: number) => p > 150 },
  { id: 'oricat', label: 'Orice preț', test: () => true },
] as const;

const tileImg: Record<Recipient, string> = {
  el: '/img/p/masina-retro-lemn-pahare-shot.webp',
  vanatori: '/img/p/suport-sticla-caine-rata.webp',
  ea: '/img/p/suport-servire-bulldog-verde.webp',
  'casa-noua': '/img/p/suport-sticla-cerb.webp',
  'botez-nunta': '/img/p/cutie-cadou-rosie-vin-pahare.webp',
};

export default function GiftFinder() {
  const [who, setWho] = useState<Recipient>('el');
  const [budget, setBudget] = useState<(typeof budgets)[number]['id']>('oricat');
  const [all, setAll] = useState(products);
  useEffect(() => setAll(liveProducts()), []);

  const rail = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const onRail = () => {
    const el = rail.current;
    if (!el) return;
    setCanL(el.scrollLeft > 8);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };
  useEffect(() => {
    onRail();
    window.addEventListener('resize', onRail);
    return () => window.removeEventListener('resize', onRail);
  }, []);
  const slide = (dir: -1 | 1) => {
    const el = rail.current;
    const card = el?.querySelector('button');
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 12), behavior: 'smooth' });
  };

  const r = recipients.find((x) => x.id === who)!;
  const list = useMemo(() => {
    const b = budgets.find((x) => x.id === budget)!;
    const strict = all.filter((p) => p.for.includes(who) && b.test(p.price));
    return (strict.length ? strict : all.filter((p) => p.for.includes(who))).slice(0, 4);
  }, [all, who, budget]);

  return (
    <div>
      <div className="relative">
      <div
        ref={rail}
        onScroll={onRail}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto scroll-smooth px-5 py-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0"
        role="group"
        aria-label="Pentru cine"
      >
        {recipients.map((x) => {
          const on = who === x.id;
          const nIdeas = all.filter((p) => p.for.includes(x.id)).length;
          return (
            <button
              key={x.id}
              type="button"
              aria-pressed={on}
              onClick={() => setWho(x.id)}
              className={`group relative flex w-[44%] shrink-0 snap-start flex-col overflow-hidden rounded-[12px] bg-white text-left transition-all duration-200 ease-out sm:w-[200px] lg:w-auto ${
                on
                  ? 'shadow-[0_14px_30px_-18px_rgb(44_36_25/0.55)] ring-2 ring-ink'
                  : 'ring-1 ring-line hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-18px_rgb(44_36_25/0.5)] hover:ring-accent-soft'
              }`}
            >
              <span className="relative block aspect-[4/3] bg-photo">
                <img src={tileImg[x.id]} alt="" width={300} height={225} loading="lazy" className="absolute inset-0 size-full object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-[1.06]" />
                {on && (
                  <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-ink text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><path d="m5 12.5 4.2 4.2L19 7" /></svg>
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col px-3.5 py-3">
                <span className={`text-[15px] font-semibold leading-tight ${on ? 'text-ink' : 'text-ink-2'}`}>{x.name}</span>
                <span className="mt-0.5 text-[13px] text-muted">{nIdeas} {nIdeas === 1 ? 'idee' : 'idei'} de cadou</span>
              </span>
            </button>
          );
        })}
      </div>
      {([-1, 1] as const).map((dir) => {
        const hidden = dir < 0 ? !canL : !canR;
        return (
          <button
            key={dir}
            type="button"
            onClick={() => slide(dir)}
            aria-label={dir < 0 ? 'Vezi cardurile din stânga' : 'Vezi cardurile din dreapta'}
            tabIndex={hidden ? -1 : 0}
            className={`absolute top-[34%] z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-[0_6px_16px_-8px_rgb(44_36_25/0.45)] transition-opacity duration-200 hover:bg-cream lg:hidden ${dir < 0 ? '-left-2' : '-right-2'} ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d={dir < 0 ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} /></svg>
          </button>
        );
      })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3" role="group" aria-label="Preț">
        <span className="text-[15px] font-semibold text-ink">Preț</span>
        <div className="grid w-full grid-cols-2 gap-1 rounded-[12px] border border-line bg-white p-1 sm:inline-flex sm:w-auto">
          {budgets.map((b) => {
            const on = budget === b.id;
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                onClick={() => setBudget(b.id)}
                className={`h-10 shrink-0 whitespace-nowrap rounded-[9px] px-4 text-sm font-semibold transition-colors duration-150 ${on ? 'bg-accent text-white shadow-[0_2px_6px_-2px_rgb(118_86_40/0.6)]' : 'text-muted hover:bg-cream hover:text-ink'}`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-8 rounded-[10px] border border-line bg-white p-6 md:p-8 lg:grid-cols-[300px_1fr] lg:items-center">
        <div>
          <p className="eyebrow">Idei {r.name.toLowerCase()}</p>
          <h3 className="mt-3 font-serif text-[1.9rem] font-extrabold leading-[1.12] text-ink">{r.title}</h3>
          <a href={`/cadouri?for=${who}`} className="btn btn-ghost mt-6">
            Vezi toate ideile
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4" aria-live="polite">
          {list.map((p) => (
            <li key={p.slug} className="flex flex-col">
              <a href={`/produs/${p.slug}`} className="block overflow-hidden rounded-[10px] bg-photo">
                <img src={p.image} alt={p.name} width={400} height={400} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
              </a>
              <a href={`/produs/${p.slug}`} className="mt-2.5 line-clamp-2 min-h-[2.7em] text-sm font-semibold leading-snug text-ink-2 hover:underline">{p.name}</a>
              <div className="mt-1.5 flex items-center justify-between">
                <b className="text-[15px]">{fmt(p.price)}</b>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full bg-accent text-white hover:bg-accent-dark"
                  aria-label={`Adaugă în coș: ${p.name}`}
                  onClick={() => addToCart({ slug: p.slug, name: p.name, price: p.price, image: p.image })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
