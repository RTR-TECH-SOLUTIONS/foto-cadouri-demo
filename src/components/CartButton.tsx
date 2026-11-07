import { useEffect, useRef, useState } from 'react';
import { FREE_SHIPPING, fmt, readCart, removeItem, setQty, subtotal, type CartItem } from '../lib/cart';

export default function CartButton() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setItems(readCart());
    const onUpdate = (e: Event) => setItems((e as CustomEvent<CartItem[]>).detail);
    const onOpen = () => setOpen(true);
    window.addEventListener('cart:update', onUpdate);
    window.addEventListener('cart:open', onOpen);
    return () => {
      window.removeEventListener('cart:update', onUpdate);
      window.removeEventListener('cart:open', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const sub = subtotal(items);
  const left = FREE_SHIPPING - sub;

  return (
    <>
      <a
        href="/cos"
        className="relative grid size-11 place-items-center rounded-lg hover:bg-cream"
        aria-label={`Coșul de cumpărături, ${count} produse`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M5 8h14l-1.2 11.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-white">
            {count}
          </span>
        )}
      </a>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Coșul tău"
          className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-serif text-xl font-extrabold text-ink">
              Coșul tău {count > 0 && <span className="font-sans text-base font-medium text-muted">({count})</span>}
            </h2>
            <button ref={closeBtn} type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-lg hover:bg-cream" aria-label="Închide coșul">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="grid flex-1 place-items-center px-8 text-center">
              <div>
                <p className="font-semibold text-ink">Coșul e gol.</p>
                <p className="mt-1 text-sm text-muted">Alege un cadou din magazin. Îl poți ridica chiar azi.</p>
                <a href="/cadouri" className="btn btn-accent mt-5">Vezi cadourile</a>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-line px-5 py-3 text-sm">
                {left > 0 ? (
                  <>Mai adaugă <b>{fmt(left)}</b> și livrarea prin curier e gratuită.</>
                ) : (
                  <b className="text-ok">Ai livrare gratuită prin curier.</b>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream">
                  <div className="h-full rounded-full bg-accent-soft" style={{ width: `${Math.min(100, (sub / FREE_SHIPPING) * 100)}%` }} />
                </div>
              </div>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3 py-4">
                    <img src={i.image} alt="" width={84} height={84} className="size-21 shrink-0 rounded-lg bg-photo object-cover" />
                    <div className="min-w-0 flex-1">
                      <a href={`/produs/${i.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:underline">{i.name}</a>
                      {i.engraving && <p className="mt-0.5 truncate text-xs text-muted">Gravură: „{i.engraving}”</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-line text-sm">
                          <button type="button" className="size-8" aria-label="Scade cantitatea" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                          <span className="w-6 text-center tabular-nums">{i.qty}</span>
                          <button type="button" className="size-8" aria-label="Crește cantitatea" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                        </div>
                        <span className="font-semibold">{fmt(i.price * i.qty)}</span>
                      </div>
                      <button type="button" className="mt-1 text-xs text-muted underline underline-offset-2 hover:text-ink" onClick={() => removeItem(i.id)}>Șterge</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line p-5">
                <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><b>{fmt(sub)}</b></div>
                <a href="/finalizare" className="btn btn-accent mt-4 w-full">Finalizează comanda</a>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a href="/cos" className="btn btn-ghost !min-h-11 !px-3 text-sm">Vezi coșul</a>
                  <button type="button" onClick={() => setOpen(false)} className="btn !min-h-11 !px-3 text-sm text-muted hover:text-ink">Continuă</button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
