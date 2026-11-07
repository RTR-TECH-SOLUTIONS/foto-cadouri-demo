import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Img {
  src: string;
  alt: string;
  label: string;
  cover?: boolean;
}
interface Props {
  images: Img[];
  badge?: string;
}

export default function ProductGallery({ images, badge }: Props) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const closeRef = useRef<HTMLButtonElement>(null);
  const n = images.length;
  const cur = images[i];

  const go = useCallback((to: number) => {
    setI((to + n) % n);
    setZoom(false);
  }, [n]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, i, go]);

  const point = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const Arrow = ({ dir }: { dir: -1 | 1 }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); go(i + dir); }}
      className={`absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-md hover:bg-cream ${dir < 0 ? 'left-3 sm:left-6' : 'right-3 sm:right-6'}`}
      aria-label={dir < 0 ? 'Poza anterioară' : 'Poza următoare'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden><path d={dir < 0 ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} /></svg>
    </button>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-[12px] bg-photo"
        aria-label="Mărește poza"
      >
        <img src={cur.src} alt={cur.alt} width={1000} height={1000} className={`aspect-square w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] ${cur.cover ? 'object-cover' : 'object-contain'}`} />
        {badge && <span className="absolute left-4 top-4 rounded-md bg-white/95 px-2.5 py-1 text-sm font-semibold text-ink shadow-sm">{badge}</span>}
        <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-black/5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6M11 8v6M8 11h6" /></svg>
          Mărește
        </span>
      </button>

      {n > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((im, k) => (
            <button
              key={im.src}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Poza ${k + 1}: ${im.label}`}
              aria-current={k === i}
              className={`overflow-hidden rounded-[10px] bg-photo ring-offset-2 transition ${k === i ? 'ring-2 ring-ink' : 'opacity-75 hover:opacity-100'}`}
            >
              <img src={im.src} alt="" width={160} height={160} loading="lazy" className={`aspect-square w-full ${im.cover ? 'object-cover' : 'object-contain'}`} />
            </button>
          ))}
        </div>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#f6f2ea]" role="dialog" aria-modal="true" aria-label="Poze produs, mărite">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm text-muted"><b className="text-ink">{i + 1} / {n}</b> · {cur.label}</p>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted sm:inline">Click pe poză pentru zoom</span>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink hover:bg-cream" aria-label="Închide">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pb-4 sm:px-20" onClick={() => setOpen(false)}>
            <div
              className={`relative h-full w-full max-w-[1100px] overflow-hidden ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={(e) => { e.stopPropagation(); point(e); setZoom(!zoom); }}
              onMouseMove={(e) => zoom && point(e)}
            >
              <img
                src={cur.src}
                alt={cur.alt}
                className="absolute inset-0 size-full object-contain transition-transform duration-300 ease-out"
                style={{ transform: zoom ? 'scale(2.2)' : 'none', transformOrigin: origin }}
              />
            </div>
            {n > 1 && <><Arrow dir={-1} /><Arrow dir={1} /></>}
          </div>
          {n > 1 && (
            <div className="flex justify-center gap-2 pb-4">
              {images.map((im, k) => (
                <button key={im.src} type="button" onClick={() => go(k)} aria-label={`Poza ${k + 1}`} className={`size-14 overflow-hidden rounded-lg bg-white ${k === i ? 'ring-2 ring-ink' : 'opacity-60 hover:opacity-100'}`}>
                  <img src={im.src} alt="" className={`size-full ${im.cover ? 'object-cover' : 'object-contain'}`} />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
