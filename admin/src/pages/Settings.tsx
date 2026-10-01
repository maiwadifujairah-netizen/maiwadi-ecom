import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { AdminHeader } from '../components/AdminUI';
import { Loading, Spinner } from '../components/States';
import type { Block, Settings } from '../types';

function Section({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className="card grid gap-5 p-6 sm:grid-cols-2">
      <div className="sm:col-span-2"><h2 className="font-semibold">{title}</h2>{text && <p className="text-sm text-muted">{text}</p>}</div>
      {children}
    </section>
  );
}

function BlocksEditor({ value, onChange, label }: { value: Block[]; onChange: (v: Block[]) => void; label: string }) {
  const upd = (i: number, k: keyof Block, v: string) => onChange(value.map((b, j) => (j === i ? { ...b, [k]: v } : b)));
  return (
    <div className="space-y-3 sm:col-span-2">
      {value.map((b, i) => (
        <div key={i} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_2fr_auto]">
          <input className="input" placeholder="Title" value={b.title} onChange={(e) => upd(i, 'title', e.target.value)} aria-label={`${label} ${i + 1} title`} />
          <input className="input" placeholder="Text" value={b.text} onChange={(e) => upd(i, 'text', e.target.value)} aria-label={`${label} ${i + 1} text`} />
          <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="size-4" /></button>
        </div>
      ))}
      {value.length < 8 && <button type="button" className="btn-outline btn-sm" onClick={() => onChange([...value, { title: '', text: '' }])}><Plus className="size-4" /> Add {label.toLowerCase()}</button>}
    </div>
  );
}

export default function AdminSettings() {
  const { settings, loaded, reload } = useSite();
  const { toast } = useUI();
  const [f, setF] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (loaded) setF(settings); }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!f) return <Loading />;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF({ ...f, [k]: v });
  const text = (k: keyof Settings, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={`s-${k}`}>{label}</label>
      <input id={`s-${k}`} className="input" value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} {...props} />
    </div>
  );
  const area = (k: keyof Settings, label: string) => (
    <div className="sm:col-span-2">
      <label className="label" htmlFor={`s-${k}`}>{label}</label>
      <textarea id={`s-${k}`} rows={4} className="input" value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} />
    </div>
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const clean = (b: Block[]) => b.filter((x) => x.title.trim() || x.text.trim());
      await api.put('/settings', { ...f, deliveryFee: Number(f!.deliveryFee) || 0, features: clean(f!.features), aboutValues: clean(f!.aboutValues) });
      toast('Settings saved — changes are live on the website');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <AdminHeader title="Site settings" text="Contact details, pricing options and the text shown across the website."
        action={<button className="btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Save changes</button>} />

      <Section title="Brand & store">
        {text('siteName', 'Brand name')}
        {text('tagline', 'Tagline')}
        {text('currency', 'Currency code (e.g. AED)', { maxLength: 3 })}
        <div>
          <label className="label" htmlFor="s-fee">Delivery fee</label>
          <input id="s-fee" type="number" min={0} step="0.01" className="input" value={f.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value as unknown as number)} />
          <p className="mt-1 text-xs text-muted">Added to every order. Use 0 for free delivery.</p>
        </div>
      </Section>

      <Section title="Contact details" text="Shown in the header, footer, contact page and WhatsApp buttons. Leave blank to hide.">
        {text('phone', 'Landline')}
        {text('mobile', 'Mobile')}
        {text('whatsapp', 'WhatsApp number (with country code, e.g. 971509087560)')}
        {text('email', 'Email', { type: 'email' })}
        {text('address', 'Address')}
        {text('workingHours', 'Working hours')}
      </Section>

      <Section title="Social media" text="Full profile URLs. Empty links are hidden.">
        {(['facebook', 'instagram', 'x', 'tiktok'] as const).map((k) => (
          <div key={k}>
            <label className="label capitalize" htmlFor={`s-${k}`}>{k === 'x' ? 'X (Twitter)' : k}</label>
            <input id={`s-${k}`} className="input" placeholder="https://…" value={f.socials[k]} onChange={(e) => set('socials', { ...f.socials, [k]: e.target.value })} />
          </div>
        ))}
      </Section>

      <Section title="Homepage" text="Leave the hero title empty to use the default design headline.">
        <div className="sm:col-span-2">{text('heroTitle', 'Hero title')}</div>
        {area('heroSubtitle', 'Hero description')}
        <p className="text-sm font-medium sm:col-span-2">"Why choose us" items</p>
        <BlocksEditor label="Feature" value={f.features} onChange={(v) => set('features', v)} />
      </Section>

      <Section title="About page">
        {area('aboutIntro', 'Brand introduction')}
        {area('aboutMission', 'Mission')}
        <p className="text-sm font-medium sm:col-span-2">Values</p>
        <BlocksEditor label="Value" value={f.aboutValues} onChange={(v) => set('aboutValues', v)} />
        {area('aboutDelivery', 'Delivery & customer service')}
      </Section>

      <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Save changes</button></div>
    </form>
  );
}
