import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { statusInfo, type Status } from './data';

const PATHS: Record<string, ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v11h5v-6h4v6h5V9" /></>,
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></>,
  camera: <><path d="M4 7h3l2-3h6l2 3h3v13H4z" /><circle cx="12" cy="13" r="4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .6 3.2 2.3 3.5 5.2" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v6H4V5h6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  store: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5 11.5V20h14v-8.5M10 20v-5h4v5" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  cash: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v5M18 9.5v5" /></>,
  edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3 3.6M6.4 7.6A15.6 15.6 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 3.7-.8" /><path d="M9.9 10a3 3 0 0 0 4.1 4.2" /></>,
  wa: <path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8Z" />,
  printer: <><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  gift: <><rect x="3.5" y="8" width="17" height="4.5" rx="1" /><path d="M5 12.5V21h14v-8.5M12 8v13" /><path d="M12 8S10.5 3.5 8 4.2C5.8 4.8 7 8 12 8Zm0 0s1.5-4.5 4-3.8C18.2 4.8 17 8 12 8Z" /></>,
  pen: <><path d="m14 4 6 6L9 21H3v-6z" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  phone: <path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />,
  alert: <><path d="M12 3.5 2.5 20h19z" /><path d="M12 10v4.5M12 17.2v.3" /></>,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.4" /></>,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9.5h18M3 15h18M9 4v16" /></>,
  chart: <><path d="M4 4v16h16" /><path d="m7 15 4-4 3 3 5-6" /></>,
};

export function Ico({ name, size = 20, className = '', stroke = 1.8 }: { name: keyof typeof PATHS | string; size?: number; className?: string; stroke?: number }) {
  if (name === 'wa')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={`shrink-0 ${className}`}>
        <path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8Zm0 16.7a7.5 7.5 0 0 1-3.9-1.1l-.3-.2-2.6.7.7-2.5-.2-.3A7.5 7.5 0 1 1 12 19.5Zm4.1-5.6c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.2 6.2 0 0 1-3-2.6c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.3 1 2.5.1.1 1.7 2.6 4.1 3.7 1.5.6 2.1.7 2.9.6.5-.1 1.3-.6 1.5-1.1.2-.5.2-1 .1-1.1l-.4-.2Z" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
      {PATHS[name]}
    </svg>
  );
}

export function StatusPill({ status, done }: { status: Status; done?: string }) {
  const s = statusInfo[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-[3px] text-[12.5px] font-semibold ${s.cls}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status === 'finalizata' && done ? done : s.label}
    </span>
  );
}

export function Card({ title, sub, action, children, className = '', pad = true }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`min-w-0 rounded-[12px] border border-[#e6ded0] bg-white shadow-[0_1px_2px_rgb(44_36_25/0.04)] ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-[15.5px] font-semibold text-ink-2">{title}</h2>}
            {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? 'p-4 sm:p-6' : ''}>{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] border border-[#e6ded0] bg-white p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 whitespace-nowrap rounded-[7px] px-3 text-[13.5px] font-semibold transition-colors duration-150 sm:px-3.5 ${value === o.id ? 'bg-ink-2 text-white' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-[#3d6a45]' : 'bg-[#d5ccbd]'}`}
    >
      <span className={`absolute left-0 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Thumb({ src, alt = '', size = 44, cover = false }: { src?: string; alt?: string; size?: number; cover?: boolean }) {
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f3eee5]" style={{ width: size, height: size }}>
      {src ? <img src={src} alt={alt} width={size} height={size} loading="lazy" className={`size-full ${cover ? 'object-cover' : 'object-contain p-0.5'}`} /> : <Ico name="box" size={size * 0.45} className="text-[#b7a98f]" />}
    </span>
  );
}

export function Drawer({ open, onClose, title, sub, children, footer, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => ref.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Închide" className="adm-fade absolute inset-0 bg-[#1c1813]/45" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} className={`adm-slide relative flex h-full w-full flex-col bg-[#fbf9f5] shadow-2xl outline-none ${wide ? 'max-w-[640px]' : 'max-w-[520px]'}`}>
        <header className="flex items-start justify-between gap-4 border-b border-[#e6ded0] bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-serif text-[1.35rem] font-bold leading-tight text-ink">{title}</h2>
            {sub && <div className="mt-1 text-[13.5px] text-muted">{sub}</div>}
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-[#f3eee5] hover:text-ink" aria-label="Închide">
            <Ico name="x" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-wrap gap-2.5 border-t border-[#e6ded0] bg-white px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Delta({ cur, prev, suffix, compact = false }: { cur: number; prev: number; suffix: string; compact?: boolean }) {
  if (!prev) return <p className="mt-2 text-[12.5px] text-muted">{suffix}</p>;
  const d = Math.round(((cur - prev) / prev) * 100);
  const up = d >= 0;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-muted">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? 'text-[#2f6138]' : 'text-[#972f20]'}`}>
        <Ico name={up ? 'arrowUp' : 'arrowDown'} size={13} stroke={2.4} />
        {up ? '+' : ''}
        {d}%
      </span>
      <span className={compact ? 'hidden sm:inline' : ''}>{suffix}</span>
    </p>
  );
}

export const btn = {
  dark: 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] bg-ink-2 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-black',
  accent: 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] bg-accent px-4 text-[14px] font-semibold text-white transition-colors hover:bg-accent-dark',
  ghost: 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#e0d7c8] bg-white px-4 text-[14px] font-semibold text-ink transition-colors hover:border-[#c9bba3] hover:bg-[#faf7f1]',
  wa: 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] bg-wa px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#17834a]',
};
export const input = 'h-10 w-full rounded-[9px] border border-[#e0d7c8] bg-white px-3 text-[14.5px] font-normal text-ink-2 outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_rgb(143_107_57/0.15)]';

export function PageHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-[clamp(1.6rem,1.2rem+1.2vw,2.15rem)] font-extrabold leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[14.5px] text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}
