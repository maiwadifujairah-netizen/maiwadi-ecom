import { useState, type FormEvent } from 'react';
import { Monitor, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { AdminHeader, Toggle } from '../components/AdminUI';
import BannerImageField from '../components/BannerImageField';
import Modal from '../components/Modal';
import { EmptyState, ErrorState, Img, Loading, Spinner } from '../components/States';
import { BANNER_POSITIONS, type Banner, type BannerPosition } from '../types';

type Placement = 'hero' | 'promo';
type Form = Required<Omit<Banner, '_id'>>;

/**
 * Hero banners are image-first: the artwork carries its own text, so the editor hides title/description.
 * The API still requires a title (it is the image's alt text), so new heroes get this one; existing values are kept.
 */
const HERO_ALT = 'MAI WADI — pure drinking water, delivered to your door';

const EMPTY: Form = {
  placement: 'hero', title: '', subtitle: '', image: '', mobileImage: '',
  desktopPosition: 'center', mobilePosition: 'center', showTitle: true, showSubtitle: true, showButtons: true,
  buttonText: 'Explore Products', buttonLink: '/products', secondaryButtonText: '', secondaryButtonLink: '',
  isActive: true, order: 0,
};

const toForm = (b: Banner): Form => ({
  ...EMPTY, ...b,
  placement: b.placement ?? 'promo', mobileImage: b.mobileImage ?? '',
  desktopPosition: b.desktopPosition ?? 'center', mobilePosition: b.mobilePosition ?? 'center',
  showTitle: b.showTitle ?? true, showSubtitle: b.showSubtitle ?? true, showButtons: b.showButtons ?? true,
  secondaryButtonText: b.secondaryButtonText ?? '', secondaryButtonLink: b.secondaryButtonLink ?? '',
});

const TABS: { key: Placement; label: string; text: string }[] = [
  { key: 'hero', label: 'Homepage hero', text: 'The full-width banner at the top of the homepage. The first active hero (lowest display order) is shown.' },
  { key: 'promo', label: 'Promotional banners', text: 'Rotating promotional banners shown below the hero, in display order.' },
];

function PositionSelect({ id, label, value, onChange }: { id: string; label: string; value: BannerPosition; onChange: (v: BannerPosition) => void }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="input capitalize" value={value} onChange={(e) => onChange(e.target.value as BannerPosition)}>
        {BANNER_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
}

export default function AdminBanners() {
  const { data, loading, error, reload } = useFetch<Banner[]>('/banners/admin');
  const [tab, setTab] = useState<Placement>('hero');
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const { toast, confirm } = useUI();

  const list = (data ?? []).filter((b) => (b.placement ?? 'promo') === tab);
  const liveHeroId = (data ?? []).find((b) => b.placement === 'hero' && b.isActive)?._id; // API returns order-sorted
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const isHero = f.placement === 'hero';

  const open = (b: Banner | 'new') => {
    setF(b === 'new'
      ? { ...EMPTY, placement: tab, order: list.length, ...(tab === 'promo' && { buttonText: '', buttonLink: '' }) }
      : toForm(b));
    setEditing(b);
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f.image) return toast('Please upload the desktop banner image', 'error');
    const body = isHero && f.title.trim().length < 2 ? { ...f, title: HERO_ALT } : f;
    if (body.title.trim().length < 2) return toast('Please enter a title', 'error');
    if (Boolean(f.buttonText) !== Boolean(f.buttonLink)) return toast('Primary button needs both text and a link', 'error');
    if (Boolean(f.secondaryButtonText) !== Boolean(f.secondaryButtonLink)) return toast('Secondary button needs both text and a link', 'error');
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/banners', body);
      else if (editing) await api.put(`/banners/${editing._id}`, body);
      toast(f.isActive ? 'Banner saved — the homepage now shows this change' : 'Banner saved (inactive, not shown on the homepage)');
      setEditing(null);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(b: Banner) {
    try {
      await api.patch(`/banners/${b._id}/active`, { isActive: !b.isActive });
      toast(b.isActive ? 'Banner hidden from homepage' : 'Banner is now live');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function remove(b: Banner) {
    if (!(await confirm({ title: `Delete "${b.title}"?`, confirmText: 'Delete', danger: true }))) return;
    try {
      await api.delete(`/banners/${b._id}`);
      toast('Banner deleted');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  const current = TABS.find((t) => t.key === tab)!;

  return (
    <>
      <AdminHeader title="Banners" text={current.text} action={<button className="btn-primary" onClick={() => open('new')}><Plus className="size-4" /> Add {tab === 'hero' ? 'hero banner' : 'banner'}</button>} />

      <div className="mb-5 flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? 'bg-ocean text-white' : 'bg-white text-ink/70 ring-1 ring-slate-200 hover:ring-ocean'}`}>
            {t.label} <span className="ml-1 opacity-70">{(data ?? []).filter((b) => (b.placement ?? 'promo') === t.key).length}</span>
          </button>
        ))}
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} />
        : !list.length ? (
          <div className="card">
            <EmptyState
              title={tab === 'hero' ? 'No hero banner yet' : 'No promotional banners yet'}
              text={tab === 'hero' ? 'Until you publish one, the homepage shows the default MAI WADI truck image.' : 'Active promotional banners appear on the homepage automatically.'}
              action={<button className="btn-primary btn-sm mt-2" onClick={() => open('new')}><Plus className="size-4" /> Add {tab === 'hero' ? 'hero banner' : 'banner'}</button>}
            />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((b) => (
              <div key={b._id} className={`card overflow-hidden ${b._id === liveHeroId ? 'ring-2 ring-ocean' : ''}`}>
                <div className="relative aspect-[16/7] bg-deep">
                  <Img src={b.image} alt={b.title} className="size-full object-cover" />
                  {b.placement !== 'hero' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-deep/80 to-transparent p-4 text-white">
                      <p className="font-display text-lg font-bold">{b.title}</p>
                      <p className="line-clamp-2 text-xs text-white/80">{b.subtitle}</p>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {b._id === liveHeroId && <span className="badge bg-emerald-500 text-white">Live</span>}
                    <span className="badge bg-white/90 text-deep">#{b.order}</span>
                  </div>
                  {b.placement === 'hero' && (
                    <span className="absolute bottom-3 left-3 flex gap-1.5 text-[11px] font-semibold text-white">
                      <span className="badge bg-black/40"><Monitor className="mr-1 size-3" /> Desktop</span>
                      <span className={`badge ${b.mobileImage ? 'bg-black/40' : 'bg-amber-500/90'}`}><Smartphone className="mr-1 size-3" /> {b.mobileImage ? 'Mobile' : 'No mobile image'}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <Toggle checked={b.isActive} onChange={() => toggle(b)} label={b.isActive ? 'Active' : 'Inactive'} />
                  <div>
                    <button className="rounded-lg p-2 text-deep hover:bg-mist" onClick={() => open(b)} aria-label={`Edit ${b.title}`}><Pencil className="size-4" /></button>
                    <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(b)} aria-label={`Delete ${b.title}`}><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {editing && (
        <Modal title={`${editing === 'new' ? 'Add' : 'Edit'} ${isHero ? 'hero banner' : 'promotional banner'}`} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="b-place">Placement</label>
              <select id="b-place" className="input" value={f.placement} onChange={(e) => set('placement', e.target.value as Placement)}>
                <option value="hero">Homepage hero (full-width, top of page)</option>
                <option value="promo">Promotional banner (carousel below the hero)</option>
              </select>
            </div>

            <div className={isHero ? 'grid gap-5 sm:col-span-2 sm:grid-cols-[1fr_170px]' : 'sm:col-span-2'}>
              <BannerImageField label="Desktop image" required aspect={isHero ? 'aspect-[21/9]' : 'aspect-[16/7]'} position={f.desktopPosition}
                hint="Wide landscape, ~2400×1000 px, max 5 MB" value={f.image} onChange={(v) => set('image', v)} />
              {isHero && (
                <BannerImageField label="Mobile image" aspect="aspect-[9/16]" position={f.mobilePosition}
                  hint="Portrait ~1080×1920. Optional — desktop image is used if empty." value={f.mobileImage} onChange={(v) => set('mobileImage', v)} />
              )}
            </div>
            {isHero && (
              <>
                <PositionSelect id="b-dpos" label="Desktop image focus" value={f.desktopPosition} onChange={(v) => set('desktopPosition', v)} />
                <PositionSelect id="b-mpos" label="Mobile image focus" value={f.mobilePosition} onChange={(v) => set('mobilePosition', v)} />
              </>
            )}

            {!isHero && (
              <>
                <div className="sm:col-span-2"><label className="label" htmlFor="b-title">Title</label><input id="b-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
                <div className="sm:col-span-2"><label className="label" htmlFor="b-sub">Description</label><textarea id="b-sub" rows={2} className="input" value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} /></div>
              </>
            )}

            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:col-span-2 sm:grid-cols-2">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <p className="text-sm font-semibold">{isHero ? 'Buttons over the image' : 'Button'}</p>
                {isHero && <Toggle checked={f.showButtons} onChange={(v) => set('showButtons', v)} label="Show buttons" />}
              </div>
              {isHero && <p className="-mt-2 text-xs text-muted sm:col-span-2">The banner artwork is shown as-is. A button appears only when both its text and link are filled in.</p>}
              <div><label className="label" htmlFor="b-btn">{isHero ? 'Primary button text' : 'Button text'}</label><input id="b-btn" className="input" placeholder="Explore Products" value={f.buttonText} onChange={(e) => set('buttonText', e.target.value)} /></div>
              <div><label className="label" htmlFor="b-link">{isHero ? 'Primary button link' : 'Button link'}</label><input id="b-link" className="input" placeholder="/products or https://…" value={f.buttonLink} onChange={(e) => set('buttonLink', e.target.value)} /></div>
              {isHero && (
                <>
                  <div><label className="label" htmlFor="b-btn2">Secondary button text <span className="font-normal text-muted">(optional)</span></label><input id="b-btn2" className="input" placeholder="Contact Us" value={f.secondaryButtonText} onChange={(e) => set('secondaryButtonText', e.target.value)} /></div>
                  <div><label className="label" htmlFor="b-link2">Secondary button link</label><input id="b-link2" className="input" placeholder="/contact" value={f.secondaryButtonLink} onChange={(e) => set('secondaryButtonLink', e.target.value)} /></div>
                </>
              )}
            </div>

            <div><label className="label" htmlFor="b-order">Display order</label><input id="b-order" type="number" min={0} className="input" value={f.order} onChange={(e) => set('order', Number(e.target.value))} /></div>
            <div className="flex items-end pb-3"><Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Active on homepage" /></div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy && <Spinner className="size-4" />} Save banner</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
