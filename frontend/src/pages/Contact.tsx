import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import { api, errorMessage } from '../services/api';
import PageHeader from '../components/PageHeader';
import { WhatsAppIcon } from '../components/icons';
import { Spinner } from '../components/States';
import { WA_ENQUIRY, telHref, waHref } from '../utils/format';

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
    s.mobile && { icon: Phone, label: 'Phone', value: s.mobile, href: telHref(s.mobile) },
    s.whatsapp && { icon: WhatsAppIcon, label: 'WhatsApp', value: 'Chat with our team', href: waHref(s.whatsapp, WA_ENQUIRY), external: true },
    s.email && { icon: Mail, label: 'Email', value: s.email, href: `mailto:${s.email}` },
    { icon: MapPin, label: 'Our location', value: s.address || 'Fujairah, UAE' },
    s.workingHours && { icon: Clock, label: 'Working hours', value: s.workingHours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }[];

  const field = (k: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${k}-err` : undefined} {...props} />
      {errors[k] && <p id={`${k}-err`} className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <PageHeader crumb="Contact" eyebrow="Get in touch" title="Contact us" text="Order online, call us or send a message. Our team is ready to assist you with your water delivery needs." />
      <section className="container-x grid gap-8 pt-10 pb-16 sm:pb-20 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">We're here to help</h2>
          <p className="mt-3 mb-6 max-w-md text-muted">Call, message us on WhatsApp or send the form — our team will get back to you shortly.</p>
        <ul className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {details.map((d) => {
            const body = (
              <>
                <span className="icon-tile"><d.icon className="size-5" /></span>
                <span>
                  <span className="block text-sm font-bold text-ink">{d.label}</span>
                  <span className="block text-sm text-muted">{d.value}</span>
                </span>
              </>
            );
            const cls = 'card flex items-center gap-4 p-4 transition';
            return (
              <li key={d.label}>
                {d.href
                  ? <a href={d.href} {...(d.external && { target: '_blank', rel: 'noopener noreferrer' })} className={`${cls} hover:-translate-y-0.5 hover:border-ocean/30 hover:shadow-lg hover:shadow-ocean/10`}>{body}</a>
                  : <div className={cls}>{body}</div>}
              </li>
            );
          })}
        </ul>
        </div>

        <div className="card p-6 sm:p-8">
          {state === 'sent' ? (
            <div className="flex flex-col items-center py-12 text-center" role="status">
              <CheckCircle2 className="size-14 text-emerald-500" />
              <h2 className="mt-4 text-2xl font-bold">Thank you!</h2>
              <p className="mt-2 text-muted">Your message has been received. Our team will contact you shortly.</p>
              <button className="btn-outline mt-6" onClick={() => setState('idle')}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5">
              <h2 className="text-2xl font-bold">Send us a message</h2>
              {field('name', 'Name', { autoComplete: 'name', placeholder: 'Your name' })}
              {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
              {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel', placeholder: 'Your phone number' })}
              <div>
                <label htmlFor="message" className="label">Message</label>
                <textarea id="message" rows={5} className="input resize-y" value={form.message} onChange={set('message')} aria-invalid={Boolean(errors.message)} placeholder="How many cans you need, your area and preferred delivery time…" />
                {errors.message && <p className="field-error">{errors.message}</p>}
              </div>
              {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
              <button type="submit" className="btn-primary" disabled={state === 'sending'}>
                {state === 'sending' ? <><Spinner className="size-4" /> Sending…</> : <>Send message <Send className="size-4" /></>}
              </button>
            </form>
          )}
        </div>

      </section>
    </>
  );
}
