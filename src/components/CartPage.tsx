import { useEffect, useState } from 'react';
import { liveProducts } from '../lib/overrides';
import { FREE_SHIPPING, SHIPPING, addToCart, fmt, readCart, removeItem, setQty, subtotal, type CartItem } from '../lib/cart';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [all, setAll] = useState(() => liveProducts([]));

  useEffect(() => {
    setItems(readCart());
    setAll(liveProducts());
    setReady(true);
    const onUpdate = (e: Event) => setItems((e as CustomEvent<CartItem[]>).detail);
    window.addEventListener('cart:update', onUpdate);
    return () => window.removeEventListener('cart:update', onUpdate);
  }, []);

  if (!ready) return <div className="h-96" />;

  const sub = subtotal(items);
  const left = FREE_SHIPPING - sub;
  const count = items.reduce((s, i) => s + i.qty, 0);
  const suggest = all.filter((p) => !items.some((i) => i.slug === p.slug)).slice(0, 4);

  const Suggestions = () => (
    <section className="mt-20" aria-labelledby="sug">
      <h2 id="sug" className="h-sec">{items.length ? 'Merg bine împreună' : 'Cele mai căutate'}</h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {suggest.map((p) => (
          <li key={p.slug} className="group flex flex-col">
            <a href={`/produs/${p.slug}`} className="block overflow-hidden rounded-[10px] bg-photo">
              <img src={p.image} alt={p.name} width={600} height={600} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            </a>
            <a href={`/produs/${p.slug}`} className="mt-3 line-clamp-2 min-h-[2.8em] text-[15px] font-semibold leading-snug text-ink-2 hover:underline">{p.name}</a>
            <div className="mt-2 flex items-center justify-between">
              <b>{fmt(p.price)}</b>
              <button type="button" className="grid size-10 place-items-center rounded-full bg-accent text-white hover:bg-accent-dark" aria-label={`Adaugă în coș: ${p.name}`} onClick={() => addToCart({ slug: p.slug, name: p.name, price: p.price, image: p.image })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  if (!items.length) {
    return (
      <>
        <div className="rounded-[12px] bg-cream-2 px-6 py-14 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mx-auto text-accent-soft" aria-hidden>
            <path d="M5 8h14l-1.2 11.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <p className="mt-4 font-serif text-2xl font-bold text-ink">Coșul tău e gol</p>
          <p className="mt-2 text-muted">Alege un cadou de pe raft. Îl poți ridica din magazin chiar azi.</p>
          <a href="/cadouri" className="btn btn-accent mt-6">Vezi cadourile</a>
        </div>
        <Suggestions />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div>
          <div className="hidden grid-cols-[1fr_120px_130px_110px] gap-4 border-b border-line pb-3 text-sm text-muted md:grid">
            <span>Produs</span><span className="text-center">Cantitate</span><span className="text-right">Total</span><span />
          </div>
          <ul className="divide-y divide-line border-b border-line">
            {items.map((i) => (
              <li key={i.id} className="grid grid-cols-[88px_1fr] gap-4 py-5 md:grid-cols-[1fr_120px_130px_110px] md:items-center">
                <div className="contents md:flex md:items-center md:gap-4">
                  <a href={`/produs/${i.slug}`} className="block overflow-hidden rounded-[10px] bg-photo md:w-24 md:shrink-0">
                    <img src={i.image} alt="" width={96} height={96} className="aspect-square w-full object-cover" />
                  </a>
                  <div className="min-w-0">
                    <a href={`/produs/${i.slug}`} className="line-clamp-2 font-semibold leading-snug text-ink hover:underline">{i.name}</a>
                    {i.engraving && <p className="mt-1 text-sm text-accent">Gravură: „{i.engraving}”</p>}
                    <p className="mt-1 text-sm text-muted">{fmt(i.price)} / buc.</p>
                  </div>
                </div>
                <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 md:col-start-auto md:contents">
                  <div className="flex h-11 items-center justify-self-center rounded-[10px] border border-line">
                    <button type="button" className="size-10 text-lg" aria-label="Scade cantitatea" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                    <span className="w-8 text-center tabular-nums">{i.qty}</span>
                    <button type="button" className="size-10 text-lg" aria-label="Crește cantitatea" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                  </div>
                  <b className="whitespace-nowrap text-right text-ink-2">{fmt(i.price * i.qty)}</b>
                  <button type="button" onClick={() => removeItem(i.id)} className="justify-self-end text-sm text-muted underline underline-offset-2 hover:text-ink">Șterge</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <a href="/cadouri" className="font-semibold text-ink underline decoration-accent-soft underline-offset-4 hover:text-accent">Continuă cumpărăturile</a>
            <p className="text-sm text-muted">Ai întrebări? Scrie-ne pe WhatsApp, răspundem repede.</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[12px] border border-line bg-cream-2 p-6">
            <h2 className="font-serif text-xl font-bold text-ink">Sumar comandă</h2>
            <div className="mt-4 rounded-[10px] bg-white p-4 text-sm">
              {left > 0 ? <>Mai adaugă <b>{fmt(left)}</b> pentru livrare gratuită prin curier.</> : <b className="text-ok">Ai livrare gratuită prin curier.</b>}
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full bg-accent-soft transition-[width] duration-300" style={{ width: `${Math.min(100, (sub / FREE_SHIPPING) * 100)}%` }} />
              </div>
            </div>
            <dl className="mt-5 grid gap-2.5 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted">Produse ({count})</dt><dd>{fmt(sub)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Ridicare din magazin</dt><dd>gratuit</dd></div>
              <div className="flex justify-between"><dt className="text-muted">sau curier</dt><dd>{left > 0 ? fmt(SHIPPING) : 'gratuit'}</dd></div>
            </dl>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-white p-3 text-sm">
              <input type="checkbox" checked={wrap} onChange={() => setWrap(!wrap)} className="mt-0.5 size-[18px] accent-[#8f6b39]" />
              <span><b className="block text-ink">Ambalaj cadou cu fundă</b><span className="text-muted">gratuit, cu felicitare scrisă de mână</span></span>
            </label>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold text-ink">Total estimat</span>
              <b className="text-xl text-ink">{fmt(sub)}</b>
            </div>
            <a href="/finalizare" className="btn btn-accent mt-5 w-full">Finalizează comanda</a>
            <ul className="mt-5 grid gap-2 text-[13px] text-muted">
              <li>Plată cu cardul, ramburs sau în magazin</li>
              <li>Retur în 14 zile pentru produsele negravate</li>
            </ul>
          </div>
        </aside>
      </div>
      <Suggestions />
    </>
  );
}
