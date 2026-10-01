import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import { api, errorMessage } from '../services/api';
import PageHeader from '../components/PageHeader';
import { WhatsAppIcon } from '../components/icons';
import { Spinner } from '../components/States';
import { telHref, waHref } from '../utils/format';

type Form = { name: string; email: string; phone: string; message: string };
const EMPTY: Form = { name: '', email: '', phone: '', message: '' };
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: Form) {
  const e: Partial<Form> = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email';
  if (f.phone && !/^[+\d][\d\s-]{6,19}$/.test(f.phone.trim())) e.phone = 'Please enter a valid phone number';
  if (f.message.trim().length < 10) e.message = 'Message should be at least 10 characters';
  return e;
}

export default function Contact() {
  useMeta('Contact', 'Contact MAI WADI for water delivery, office supply and inquiries.');
  const { settings: s } = useSite();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [serverError, setServerError] = useState('');

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState('sending');
    setServerError('');
    try {
      await api.post('/contact', form);
      setState('sent');
      setForm(EMPTY);
    } catch (err) {
      setServerError(errorMessage(err));
      setState('idle');
    }
  }

  const details = [
    s.phone && { icon: Phone, label: 'Phone', value: s.phone, href: telHref(s.phone) },
    s.mobile && { icon: Phone, label: 'Mobile', value: s.mobile, href: telHref(s.mobile) },
    s.email && { icon: Mail, label: 'Email', value: s.email, href: `mailto:${s.email}` },
    s.address && { icon: MapPin, label: 'Address', value: s.address },
    s.workingHours && { icon: Clock, label: 'Working hours', value: s.workingHours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  const field = (k: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${k}-err` : undefined} {...props} />
      {errors[k] && <p id={`${k}-err`} className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <PageHeader eyebrow="Contact" title="Let's get your water delivered" text="Questions, delivery requests or office supply — send us a message and our team will get back to you." />
      <section className="container-x grid gap-10 pb-20 lg:grid-cols-[1fr_1.4fr]">
        <aside className="space-y-4">
          {details.map((d) => (
            <div key={d.label} className="flex items-start gap-4 rounded-2xl bg-mist p-5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-ocean shadow-sm"><d.icon className="size-5" /></div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted uppercase">{d.label}</p>
                {d.href ? <a href={d.href} className="font-semibold text-deep hover:text-ocean">{d.value}</a> : <p className="font-semibold text-deep">{d.value}</p>}
              </div>
            </div>
          ))}
          {s.whatsapp && (
            <a href={waHref(s.whatsapp, 'Hello MAI WADI, I have an inquiry.')} target="_blank" rel="noopener" className="btn w-full bg-[#25D366] py-4 text-white hover:bg-[#1eb458]">
              <WhatsAppIcon /> Chat with us on WhatsApp
            </a>
          )}
        </aside>

        <div className="card p-6 sm:p-10">
          {state === 'sent' ? (
            <div className="flex flex-col items-center py-12 text-center" role="status">
              <CheckCircle2 className="size-14 text-emerald-500" />
              <h2 className="mt-4 text-2xl font-bold">Thank you!</h2>
              <p className="mt-2 text-muted">Your message has been received. Our team will contact you shortly.</p>
              <button className="btn-outline mt-6" onClick={() => setState('idle')}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
              <h2 className="text-2xl font-bold sm:col-span-2">Send us a message</h2>
              <div className="sm:col-span-2">{field('name', 'Full name', { autoComplete: 'name' })}</div>
              {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
              {field('phone', 'Phone number (optional)', { type: 'tel', autoComplete: 'tel' })}
              <div className="sm:col-span-2">
                <label htmlFor="message" className="label">Message</label>
                <textarea id="message" rows={5} className="input resize-y" value={form.message} onChange={set('message')} aria-invalid={Boolean(errors.message)} placeholder="Tell us how many cans you need, your area, and preferred delivery time…" />
                {errors.message && <p className="field-error">{errors.message}</p>}
              </div>
              {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2" role="alert">{serverError}</p>}
              <button type="submit" className="btn-primary sm:col-span-2" disabled={state === 'sending'}>
                {state === 'sending' ? <><Spinner className="size-4" /> Sending…</> : <><Send className="size-4" /> Send message</>}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
