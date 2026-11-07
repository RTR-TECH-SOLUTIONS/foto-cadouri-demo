import { useEffect, useState } from 'react';
import { FREE_SHIPPING, SHIPPING, clearCart, fmt, readCart, saveOrder, shippingFor, subtotal, type CartItem, type Order } from '../lib/cart';

type Delivery = Order['delivery'];
type Payment = Order['payment'];

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>('ridicare');
  const [payment, setPayment] = useState<Payment>('card');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'pay' | 'done'>('form');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
    const onUpdate = (e: Event) => setItems((e as CustomEvent<CartItem[]>).detail);
    window.addEventListener('cart:update', onUpdate);
    return () => window.removeEventListener('cart:update', onUpdate);
  }, []);

  const sub = subtotal(items);
  const ship = shippingFor(sub, delivery);
  const total = sub + ship;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const err: Record<string, string> = {};
    const name = String(f.get('name') || '').trim();
    const phone = String(f.get('phone') || '').replace(/\s/g, '');
    if (name.length < 3) err.name = 'Scrie numele complet.';
    if (!/^(\+?40|0)7\d{8}$/.test(phone)) err.phone = 'Număr de mobil românesc, ex. 0723 704 217.';
    if (delivery === 'curier') {
      if (!String(f.get('address') || '').trim()) err.address = 'Avem nevoie de adresă pentru curier.';
      if (!String(f.get('town') || '').trim()) err.town = 'Scrie localitatea.';
    }
    setErrors(err);
    if (Object.keys(err).length) {
      document.getElementById(Object.keys(err)[0])?.focus();
      return;
    }
    const o: Order = {
      number: `FC-${String(Date.now()).slice(-5)}`,
      date: new Date().toISOString(),
      name,
      phone,
      delivery,
      payment,
      total,
      items: items.map((i) => ({ name: i.name, qty: i.qty, engraving: i.engraving })),
      status: 'Nouă',
    };
    setOrder(o);
    if (payment === 'card') setStep('pay');
    else finish(o);
  }

  function finish(o: Order) {
    // TODO(real): creare comandă în backend + plată Netopia/Stripe + SMS/e-mail de confirmare (Resend)
    saveOrder(o);
    clearCart();
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!ready) return <div className="h-96" />;

  if (step === 'done' && order) {
    return (
      <div className="mx-auto max-w-xl rounded-[12px] border border-line bg-cream-2 p-8 text-center sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok text-white">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="m5 12.5 4.2 4.2L19 7" /></svg>
        </span>
        <h2 className="mt-5 font-serif text-3xl font-extrabold text-ink">Mulțumim, {order.name.split(' ')[0]}!</h2>
        <p className="mt-3 text-muted">
          Comanda <b className="text-ink">{order.number}</b> a ajuns la noi.{' '}
          {order.delivery === 'ridicare'
            ? 'Te sunăm când e gata de ridicat din magazin, de obicei în aceeași zi.'
            : 'O predăm curierului în 24 de ore și primești numărul AWB prin SMS.'}
        </p>
        <p className="mt-4 text-sm text-muted">Total {fmt(order.total)} · {order.payment === 'card' ? 'plătit cu cardul' : order.payment === 'ramburs' ? 'plată ramburs' : 'plată în magazin'}</p>
        <a href="/" className="btn btn-accent mt-7">Înapoi la magazin</a>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-[12px] bg-cream-2 p-10 text-center">
        <p className="font-serif text-2xl font-bold text-ink">Coșul e gol.</p>
        <p className="mt-2 text-muted">Adaugă un cadou și revino aici ca să finalizezi comanda.</p>
        <a href="/cadouri" className="btn btn-accent mt-6">Vezi cadourile</a>
      </div>
    );
  }

  const Err = ({ id }: { id: string }) => (errors[id] ? <p id={`${id}-err`} className="mt-1.5 text-sm text-[#a3362a]">{errors[id]}</p> : null);
  const Opt = ({ name, value, current, set, title, sub: s, right }: { name: string; value: string; current: string; set: (v: never) => void; title: string; sub: string; right?: string }) => (
    <label className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-4 transition-colors ${current === value ? 'border-accent bg-cream-2' : 'border-line hover:border-accent-soft'}`}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => set(value as never)} className="mt-1 size-[18px] accent-[#8f6b39]" />
      <span className="flex-1"><b className="block text-ink">{title}</b><span className="text-sm text-muted">{s}</span></span>
      {right && <b className="text-sm text-ink">{right}</b>}
    </label>
  );

  return (
    <>
      <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="grid gap-9">
          <fieldset>
            <legend className="font-serif text-2xl font-bold text-ink">1. Datele tale</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-ink">Nume și prenume</label>
                <input id="name" name="name" autoComplete="name" className="field mt-1.5" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
                <Err id="name" />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-semibold text-ink">Telefon</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="07xx xxx xxx" className="field mt-1.5" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-err' : undefined} />
                <Err id="phone" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className="text-sm font-semibold text-ink">E-mail <span className="font-normal text-muted">(opțional, pentru factură)</span></label>
                <input id="email" name="email" type="email" autoComplete="email" className="field mt-1.5" />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-2xl font-bold text-ink">2. Cum primești cadoul</legend>
            <div className="mt-4 grid gap-3">
              <Opt name="delivery" value="ridicare" current={delivery} set={setDelivery} title="Ridic din magazin" sub="Te sunăm când e gata, de obicei în aceeași zi" right="gratuit" />
              <Opt name="delivery" value="curier" current={delivery} set={setDelivery} title="Livrare prin curier" sub="24-48 h în toată țara" right={sub >= FREE_SHIPPING ? 'gratuit' : `${SHIPPING} lei`} />
            </div>
            {delivery === 'curier' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div>
                  <label htmlFor="address" className="text-sm font-semibold text-ink">Stradă, număr, bloc, apartament</label>
                  <input id="address" name="address" autoComplete="street-address" className="field mt-1.5" aria-invalid={!!errors.address} />
                  <Err id="address" />
                </div>
                <div>
                  <label htmlFor="town" className="text-sm font-semibold text-ink">Localitate, județ</label>
                  <input id="town" name="town" autoComplete="address-level2" className="field mt-1.5" aria-invalid={!!errors.town} />
                  <Err id="town" />
                </div>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="font-serif text-2xl font-bold text-ink">3. Plata</legend>
            <div className="mt-4 grid gap-3">
              <Opt name="payment" value="card" current={payment} set={setPayment} title="Card online" sub="Visa, Mastercard, plată securizată" />
              {delivery === 'curier' ? (
                <Opt name="payment" value="ramburs" current={payment} set={setPayment} title="Ramburs la curier" sub="Plătești când primești coletul" />
              ) : (
                <Opt name="payment" value="magazin" current={payment} set={setPayment} title="Plătesc în magazin" sub="Cash sau card, la ridicare" />
              )}
            </div>
          </fieldset>

          <div>
            <label htmlFor="msg" className="text-sm font-semibold text-ink">Mesaj pentru felicitare <span className="font-normal text-muted">(opțional, îl scriem de mână)</span></label>
            <textarea id="msg" name="msg" rows={3} className="field mt-1.5" placeholder="La mulți ani, tată!" />
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[12px] border border-line bg-cream-2 p-6">
            <h2 className="font-serif text-xl font-bold text-ink">Comanda ta</h2>
            <ul className="mt-4 divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 py-3">
                  <img src={i.image} alt="" width={64} height={64} className="size-16 shrink-0 rounded-lg bg-photo object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="line-clamp-2 font-semibold text-ink">{i.name}</p>
                    {i.engraving && <p className="truncate text-muted">Gravură: „{i.engraving}”</p>}
                    <p className="text-muted">{i.qty} × {fmt(i.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid gap-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted">Produse</dt><dd>{fmt(sub)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{delivery === 'ridicare' ? 'Ridicare din magazin' : 'Curier'}</dt><dd>{ship ? fmt(ship) : 'gratuit'}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-lg"><dt className="font-semibold text-ink">Total</dt><dd className="font-bold text-ink">{fmt(total)}</dd></div>
            </dl>
            <button className="btn btn-accent mt-5 w-full">{payment === 'card' ? 'Continuă spre plată' : 'Trimite comanda'}</button>
            <p className="mt-3 text-center text-xs text-muted">Demo: nu se trimite nicio comandă reală.</p>
          </div>
        </aside>
      </form>

      {step === 'pay' && order && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Plată cu cardul">
          <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink">Plată securizată</h2>
              <span className="rounded-md bg-cream px-2 py-1 text-xs font-semibold text-accent">mod test</span>
            </div>
            <p className="mt-1 text-sm text-muted">Comanda {order.number} · <b className="text-ink">{fmt(order.total)}</b></p>
            <div className="mt-5 grid gap-3">
              <label className="text-sm font-semibold text-ink">Număr card<input className="field mt-1.5 font-mono" defaultValue="4111 1111 1111 1111" readOnly /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-ink">Expiră<input className="field mt-1.5 font-mono" defaultValue="12 / 28" readOnly /></label>
                <label className="text-sm font-semibold text-ink">CVV<input className="field mt-1.5 font-mono" defaultValue="123" readOnly /></label>
              </div>
            </div>
            <button type="button" className="btn btn-accent mt-6 w-full" onClick={() => finish(order)}>Plătește {fmt(order.total)}</button>
            <button type="button" className="mt-2 w-full py-2 text-sm font-semibold text-muted hover:text-ink" onClick={() => setStep('form')}>Înapoi</button>
          </div>
        </div>
      )}
    </>
  );
}
