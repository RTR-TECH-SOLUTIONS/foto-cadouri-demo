import { useState } from 'react';
import { addToCart, fmt } from '../lib/cart';

interface Props {
  slug: string;
  name: string;
  price: number;
  image: string;
  engravable?: boolean;
  wa: string;
}

export default function ProductBuy({ slug, name, price, image, engravable, wa }: Props) {
  const [qty, setQty] = useState(1);
  const [text, setText] = useState('');

  return (
    <div className="mt-7">
      {engravable && (
        <div className="mb-6 rounded-[10px] border border-line bg-cream-2 p-4">
          <label htmlFor="grav" className="flex items-baseline justify-between text-[15px] font-semibold text-ink">
            Text pentru gravură <span className="text-sm font-normal text-muted">opțional, gratuit</span>
          </label>
          <input
            id="grav"
            maxLength={28}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ex. Pentru tata, de la Andrei"
            className="field mt-2"
          />
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-14 flex-1 place-items-center overflow-hidden rounded-lg bg-[#d9b98c] px-3 shadow-[inset_0_1px_4px_rgb(90_60_20/0.25)]">
              <span className="truncate font-serif text-lg font-bold italic text-[#5a3b17]/85 [text-shadow:0_1px_0_rgb(255_240_210/0.4)]">
                {text || 'Așa va arăta gravura'}
              </span>
            </div>
            <span className="w-14 text-right text-xs text-muted">{text.length}/28</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex items-center rounded-[10px] border border-line">
          <button type="button" className="size-12 text-lg" aria-label="Scade cantitatea" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" className="size-12 text-lg" aria-label="Crește cantitatea" onClick={() => setQty(Math.min(20, qty + 1))}>+</button>
        </div>
        <button
          type="button"
          className="btn btn-accent min-w-0 flex-1"
          onClick={() => addToCart({ slug, name, price, image, qty, engraving: text.trim() || undefined })}
        >
          Adaugă în coș<span className="hidden sm:inline"> · {fmt(price * qty)}</span>
        </button>
      </div>
      <a href={wa} target="_blank" rel="noopener" className="btn btn-ghost mt-3 w-full">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-wa"><path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8Zm0 16.7a7.5 7.5 0 0 1-3.9-1.1l-.3-.2-2.6.7.7-2.5-.2-.3A7.5 7.5 0 1 1 12 19.5Z" /></svg>
        Întreabă pe WhatsApp de produs
      </a>
    </div>
  );
}
