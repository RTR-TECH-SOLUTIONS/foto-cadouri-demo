import { useMemo, useState } from 'react';
import { useAdmin } from './ctx';
import { DAY, SERVICES, lei, startOfDay, timeOf, type Appointment } from './data';
import { Card, Drawer, Ico, PageHead, btn, input } from './ui';

const STATUS: Record<Appointment['status'], { label: string; cls: string }> = {
  confirmata: { label: 'Confirmată', cls: 'bg-[#e3ecf5] text-[#24507c]' },
  venit: { label: 'A venit', cls: 'bg-[#e1efe3] text-[#2c5e35]' },
  anulata: { label: 'Anulată', cls: 'bg-[#f6e1dc] text-[#972f20]' },
};

function NewAppt({ day, onClose }: { day: number; onClose: () => void }) {
  const { setAppointments, toast } = useAdmin();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [svc, setSvc] = useState(0);
  const [date, setDate] = useState(() => new Date(day - new Date(day).getTimezoneOffset() * 60_000).toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const slots = Array.from({ length: 20 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
  const save = () => {
    const [y, m, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    const s = SERVICES[svc];
    const a: Appointment = { id: `N-${Date.now()}`, ts: new Date(y, m - 1, d, h, mi).getTime(), minutes: s.minutes, service: s.name, price: s.price, name: name.trim(), phone: phone.trim(), status: 'confirmata', note: note.trim() || undefined };
    setAppointments((l) => [...l, a].sort((x, z) => x.ts - z.ts));
    toast(`Programare salvată: ${a.name}, ${new Date(a.ts).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })} la ${time}.`);
    onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      title="Programare nouă"
      sub="Pentru clienții care sună sau scriu pe WhatsApp."
      footer={
        <>
          <button type="button" className={btn.accent} disabled={name.trim().length < 3} onClick={save}><Ico name="check" size={18} /> Salvează programarea</button>
          <button type="button" className={btn.ghost} onClick={onClose}>Renunță</button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">Nume client<input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="ex. Maria Ionescu" /></label>
        <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">Telefon<input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} inputMode="tel" placeholder="07xx xxx xxx" /></label>
        <fieldset className="grid grid-cols-1 gap-2">
          <legend className="mb-1.5 text-[13.5px] font-semibold text-ink">Serviciu</legend>
          {SERVICES.map((s, i) => (
            <label key={s.name} className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-[14px] transition-colors ${svc === i ? 'border-accent bg-[#fbf5ea]' : 'border-[#e0d7c8] bg-white hover:border-[#c9bba3]'}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="svc" checked={svc === i} onChange={() => setSvc(i)} className="accent-[#8f6b39]" />
                <span>{s.name} <span className="text-[12.5px] text-muted">· {s.minutes} min</span></span>
              </span>
              <b className="whitespace-nowrap">{lei(s.price)}</b>
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
          <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">Ora
            <select value={time} onChange={(e) => setTime(e.target.value)} className={input}>{slots.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
        </div>
        <label className="grid grid-cols-1 gap-1.5 text-[13.5px] font-semibold text-ink">Notă (opțional)<input value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder="ex. vine cu un bebeluș, fundal alb pentru viză" /></label>
        <p className="rounded-[10px] bg-white p-3.5 text-[13px] leading-relaxed text-muted ring-1 ring-[#e6ded0]">Pe site-ul real, clientul primește automat un SMS sau mesaj cu ora programării și o reamintire cu o zi înainte.</p>
      </div>
    </Drawer>
  );
}

export default function Studio() {
  const { appointments, setAppointments, now, toast } = useAdmin();
  const today0 = startOfDay(now);
  const [day, setDay] = useState(today0);
  const [adding, setAdding] = useState(false);

  const days = useMemo(() => Array.from({ length: 8 }, (_, i) => today0 + (i - 1) * DAY), [today0]);
  const ofDay = (d: number) => appointments.filter((a) => startOfDay(a.ts) === d);
  const list = ofDay(day);
  const week = appointments.filter((a) => a.ts >= today0 && a.ts < today0 + 7 * DAY && a.status !== 'anulata');
  const earned = appointments.filter((a) => a.ts >= today0 - 7 * DAY && a.ts < now && a.status === 'venit').reduce((s, a) => s + a.price * (a.people ?? 1), 0);
  const next = appointments.find((a) => a.ts > now && a.status === 'confirmata');

  const setSt = (id: string, status: Appointment['status'], msg: string) => {
    setAppointments((l) => l.map((a) => (a.id === id ? { ...a, status } : a)));
    toast(msg);
  };

  return (
    <div className="adm-in">
      <PageHead title="Programări studio" sub="Poze pentru acte, ședințe foto, printare. Le vezi pe zile, cu tot ce trebuie pregătit.">
        <button type="button" className={btn.accent} onClick={() => setAdding(true)}><Ico name="plus" size={18} stroke={2.2} /> Programare nouă</button>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
        <div className="rounded-[12px] border border-[#e6ded0] bg-white p-4 sm:p-5">
          <p className="text-[13px] leading-snug text-muted sm:text-[13.5px]">Programări în următoarele 7 zile</p>
          <p className="mt-1.5 text-[1.45rem] font-semibold leading-none text-ink-2 sm:text-[1.75rem]">{week.length}</p>
        </div>
        <div className="rounded-[12px] border border-[#e6ded0] bg-white p-4 sm:p-5">
          <p className="text-[13px] leading-snug text-muted sm:text-[13.5px]">Încasat la studio, ultimele 7 zile</p>
          <p className="mt-1.5 text-[1.45rem] font-semibold leading-none text-ink-2 sm:text-[1.75rem]">{lei(earned)}</p>
        </div>
        <div className="col-span-2 rounded-[12px] border border-[#e6ded0] bg-white p-4 sm:col-span-1 sm:p-5">
          <p className="text-[13.5px] text-muted">Urmează</p>
          {next ? (
            <p className="mt-1.5 text-[15px] leading-snug text-ink-2"><b className="text-[1.3rem]">{timeOf(next.ts)}</b> {startOfDay(next.ts) === today0 ? 'azi' : new Date(next.ts).toLocaleDateString('ro-RO', { weekday: 'long' })}<span className="block truncate text-[13.5px] text-muted">{next.service} · {next.name}</span></p>
          ) : (
            <p className="mt-1.5 text-sm text-muted">Nicio programare.</p>
          )}
        </div>
      </div>

      <Card className="mt-5" pad={false}>
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-[#efe9df] p-3 sm:p-4">
          {days.map((d) => {
            const dt = new Date(d);
            const closed = dt.getDay() === 0;
            const n = ofDay(d).filter((a) => a.status !== 'anulata').length;
            const on = d === day;
            return (
              <button key={d} type="button" onClick={() => setDay(d)} aria-pressed={on} className={`flex min-w-[76px] flex-1 flex-col items-center rounded-[10px] px-2 py-2.5 transition-colors ${on ? 'bg-ink-2 text-white' : 'bg-[#faf7f1] text-ink hover:bg-[#f3eee5]'}`}>
                <span className={`text-[12px] capitalize ${on ? 'text-white/70' : 'text-muted'}`}>{d === today0 ? 'azi' : dt.toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '')}</span>
                <span className="text-[1.25rem] font-bold leading-tight">{dt.getDate()}</span>
                <span className={`text-[11.5px] ${on ? 'text-[#e2c99c]' : closed ? 'text-muted' : 'text-accent'}`}>{closed ? 'închis' : n ? `${n} prog.` : 'liber'}</span>
              </button>
            );
          })}
        </div>
        <div className="p-4 sm:p-6">
          <h2 className="text-[15.5px] font-semibold capitalize text-ink-2">{new Date(day).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          {new Date(day).getDay() === 0 ? (
            <p className="mt-3 text-[14.5px] text-muted">Duminica studioul e închis.</p>
          ) : list.length === 0 ? (
            <p className="mt-3 text-[14.5px] text-muted">Nicio programare în ziua asta. Clienții pentru poze de acte pot veni și fără programare.</p>
          ) : (
            <ol className="mt-4 grid gap-3">
              {list.map((a) => {
                const past = a.ts < now;
                return (
                  <li key={a.id} className={`grid grid-cols-[52px_minmax(0,1fr)] gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-4 ${a.status === 'anulata' ? 'opacity-55' : ''}`}>
                    <div className="pt-3 text-right">
                      <b className="block text-[15px] tabular-nums text-ink-2">{timeOf(a.ts)}</b>
                      <span className="text-[12px] text-muted">{a.minutes} min</span>
                    </div>
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[12px] border-l-[3px] bg-[#faf7f1] px-4 py-3.5 ${a.status === 'venit' ? 'border-[#3d6a45]' : a.status === 'anulata' ? 'border-[#c9bfb0]' : 'border-accent'}`}>
                      <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                        <p className="text-[14.5px] font-semibold text-ink-2">{a.service}{a.people ? <span className="font-normal text-muted"> · {a.people} persoane</span> : null}</p>
                        <p className="text-[13.5px] text-muted">{a.name} · {a.phone}</p>
                        {a.note && <p className="mt-1 text-[13px] italic text-ink">„{a.note}”</p>}
                      </div>
                      <b className="whitespace-nowrap text-[14px] tabular-nums">{lei(a.price * (a.people ?? 1))}</b>
                      <span className={`rounded-md px-2 py-[3px] text-[12.5px] font-semibold ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
                      {a.status === 'confirmata' && (
                        <span className="flex w-full gap-2 sm:w-auto">
                          {past || startOfDay(a.ts) === today0 ? (
                            <button type="button" className={`${btn.dark} h-9 px-3 text-[13px]`} onClick={() => setSt(a.id, 'venit', `${a.name} a venit. Încasat ${lei(a.price * (a.people ?? 1))}.`)}>A venit</button>
                          ) : (
                            <button type="button" className={`${btn.wa} h-9 px-3 text-[13px]`} onClick={() => toast('Pe panoul real se trimite reamintirea pe WhatsApp.')}><Ico name="wa" size={15} /> Reamintește</button>
                          )}
                          <button type="button" className={`${btn.ghost} h-9 px-3 text-[13px]`} onClick={() => setSt(a.id, 'anulata', 'Programare anulată.')}>Anulează</button>
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Card>
      {adding && <NewAppt day={day < today0 ? today0 : day} onClose={() => setAdding(false)} />}
    </div>
  );
}
