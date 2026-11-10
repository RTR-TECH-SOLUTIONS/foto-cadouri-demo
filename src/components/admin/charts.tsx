import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { lei, type Point } from './data';

// Culori validate cu dataviz/validate_palette.js pe fundal alb (CVD ΔE ≥ 18, contrast ≥ 3:1).
export const C1 = '#9a6520'; // caramel, seria principală
export const C2 = '#2a6fa0';
export const C3 = '#5f9446';
export const PREV = '#c3b7a4'; // perioada anterioară, de-emfazată
const GRID = '#efe9df';
const AXIS = '#8a8072';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  const raw = v / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => s >= raw) ?? 10 * p;
  return step * 4;
}
const tick = (v: number, max: number) => (max >= 10_000 ? `${(v / 1000).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} mii` : v.toLocaleString('ro-RO'));

function monotone(pts: [number, number][]) {
  const n = pts.length;
  if (!n) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  t[n - 1] = m[n - 2];
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    d += ` C${x0 + dx[i] / 3},${y0 + (t[i] * dx[i]) / 3} ${x1 - dx[i] / 3},${y1 - (t[i + 1] * dx[i]) / 3} ${x1},${y1}`;
  }
  return d;
}

/** Vânzări pe perioadă, cu perioada anterioară ca linie de comparație. Crosshair + tooltip, tastatură. */
export function RevenueChart({ points, curLabel, prevLabel, faded = false }: { points: Point[]; curLabel: string; prevLabel: string; faded?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const H = 260;
  const M = { t: 12, r: 12, b: 30, l: w < 420 ? 40 : 52 };
  const iw = Math.max(10, w - M.l - M.r);
  const ih = H - M.t - M.b;
  const max = niceMax(Math.max(1, ...points.map((p) => Math.max(p.cur, p.prev))));
  const n = points.length;
  const x = (i: number) => M.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => M.t + ih - (v / max) * ih;
  const cur = monotone(points.map((p, i) => [x(i), y(p.cur)]));
  const prev = monotone(points.map((p, i) => [x(i), y(p.prev)]));
  const area = n ? `${cur} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z` : '';
  const every = Math.max(1, Math.ceil(n / (w < 480 ? 4 : 7)));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    setHi(Math.max(0, Math.min(n - 1, Math.round(((px - 0) / r.width) * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setHi((h) => Math.min(n - 1, (h ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHi((h) => Math.max(0, (h ?? n) - 1));
    else return;
    e.preventDefault();
  };
  const p = hi !== null ? points[hi] : null;
  const tipLeft = hi !== null ? Math.min(Math.max(x(hi), 90), w - 90) : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-2"><i className="h-[3px] w-4 rounded-full" style={{ background: C1 }} />{curLabel}</span>
        <span className="inline-flex items-center gap-2"><i className="h-[3px] w-4 rounded-full" style={{ background: PREV }} />{prevLabel}</span>
      </div>
      <div
        ref={ref}
        className={`relative outline-none transition-opacity duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 ${faded ? 'opacity-50' : ''}`}
        tabIndex={0}
        role="img"
        aria-label={`Grafic vânzări: ${points.map((q) => `${q.full} ${lei(q.cur)}`).join('; ')}`}
        onKeyDown={onKey}
        onFocus={() => setHi(n - 1)}
        onBlur={() => setHi(null)}
      >
        {w > 0 && (
          <svg width={w} height={H} className="block overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line x1={M.l} x2={w - M.r} y1={y(f * max)} y2={y(f * max)} stroke={GRID} strokeWidth={1} />
                <text x={M.l - 10} y={y(f * max)} dy="0.32em" textAnchor="end" fontSize={11.5} fill={AXIS} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {tick(f * max, max)}
                </text>
              </g>
            ))}
            {points.map((q, i) =>
              i % every === (n - 1) % every ? (
                <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize={11.5} fill={AXIS}>
                  {q.label}
                </text>
              ) : null,
            )}
            <path d={area} fill={C1} opacity={0.1} />
            <path d={prev} fill="none" stroke={PREV} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={cur} fill="none" stroke={C1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {hi !== null && p && (
              <g pointerEvents="none">
                <line x1={x(hi)} x2={x(hi)} y1={M.t} y2={M.t + ih} stroke="#d9cfbf" strokeWidth={1} />
                <circle cx={x(hi)} cy={y(p.prev)} r={4} fill={PREV} stroke="#fff" strokeWidth={2} />
                <circle cx={x(hi)} cy={y(p.cur)} r={4.5} fill={C1} stroke="#fff" strokeWidth={2} />
              </g>
            )}
            {hi === null && n > 0 && <circle cx={x(n - 1)} cy={y(points[n - 1].cur)} r={4.5} fill={C1} stroke="#fff" strokeWidth={2} />}
            <rect x={M.l} y={M.t} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHi(null)} />
          </svg>
        )}
        {p && hi !== null && (
          <div className="pointer-events-none absolute top-0 z-10 w-[180px] -translate-x-1/2 rounded-[10px] border border-[#e6ded0] bg-white px-3.5 py-2.5 shadow-[0_8px_24px_-8px_rgb(44_36_25/0.25)]" style={{ left: tipLeft }}>
            <p className="text-[12px] capitalize text-muted">{p.full}</p>
            <p className="mt-1 flex items-center gap-2 text-[15px] font-bold text-ink-2"><i className="h-[3px] w-3 rounded-full" style={{ background: C1 }} />{lei(p.cur)}</p>
            <p className="flex items-center gap-2 text-[13px] text-muted"><i className="h-[3px] w-3 rounded-full" style={{ background: PREV }} />{lei(p.prev)} <span className="text-[11.5px]">înainte</span></p>
            <p className="mt-1 border-t border-[#efe9df] pt-1 text-[12.5px] text-ink">{p.orders} {p.orders === 1 ? 'comandă' : 'comenzi'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const H = 34;
  const max = Math.max(1, ...values);
  const min = Math.min(...values, 0);
  const n = values.length;
  const pts = values.map((v, i) => [n === 1 ? w / 2 : 3 + (i * (w - 6)) / (n - 1), 4 + (H - 8) * (1 - (v - min) / (max - min || 1))] as [number, number]);
  const d = monotone(pts);
  return (
    <div ref={ref} className="mt-3 h-[34px]" aria-hidden>
      {w > 0 && n > 1 && (
        <svg width={w} height={H} className="block overflow-visible">
          <path d={`${d} L${pts[n - 1][0]},${H} L${pts[0][0]},${H} Z`} fill={C1} opacity={0.08} />
          <path d={d} fill="none" stroke="#c9ab7c" strokeWidth={1.75} strokeLinecap="round" />
          <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={3.5} fill={C1} stroke="#fff" strokeWidth={1.5} />
        </svg>
      )}
    </div>
  );
}

/** Un întreg împărțit în părți (bară segmentată înaltă), cu procente în interior când încap. */
export function SegBar({ parts, label }: { parts: { name: string; value: number; color: string; dark?: boolean }[]; label: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const shown = parts.filter((p) => p.value > 0);
  const gaps = (shown.length - 1) * 2;
  let acc = 0;
  return (
    <div>
      <div ref={ref} className="relative flex h-7 gap-[2px]" role="group" aria-label={`${label}: ${parts.map((p) => `${p.name} ${Math.round((p.value / total) * 100)}%`).join(', ')}`}>
        {shown.map((p, i) => {
          const pct = Math.round((p.value / total) * 100);
          const width = ((w - gaps) * p.value) / total;
          const left = acc;
          acc += width + 2;
          return (
            <button
              key={p.name}
              type="button"
              className="h-full rounded-[4px] text-left outline-none transition-[filter] duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink/40"
              style={{ width: Math.max(2, width), background: p.color }}
              onPointerEnter={() => setHi(i)}
              onPointerLeave={() => setHi(null)}
              onFocus={() => setHi(i)}
              onBlur={() => setHi(null)}
              aria-label={`${p.name}: ${p.value} comenzi, ${pct}%`}
            >
              {width > 44 && <span className={`px-2.5 text-[12.5px] font-bold ${p.dark ? 'text-[#1c1813]' : 'text-white'}`}>{pct}%</span>}
              {hi === i && (
                <span className="pointer-events-none absolute -top-11 z-10 whitespace-nowrap rounded-lg border border-[#e6ded0] bg-white px-2.5 py-1.5 text-[12.5px] text-muted shadow-[0_8px_24px_-8px_rgb(44_36_25/0.25)]" style={{ left: Math.min(left, Math.max(0, w - 190)) }}>
                  <b className="text-ink-2">{p.value} comenzi</b> · {p.name}, {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink">
        {parts.map((p) => (
          <li key={p.name} className="inline-flex items-center gap-2"><i className="size-2.5 rounded-[3px]" style={{ background: p.color }} />{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
