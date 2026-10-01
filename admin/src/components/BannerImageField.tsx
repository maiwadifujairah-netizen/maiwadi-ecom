import { useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { errorMessage, mediaUrl, uploadImage } from '../services/api';
import { useUI } from '../context/UIContext';
import { Spinner } from './States';
import type { BannerPosition } from '../types';

const POSITION: Record<BannerPosition, string> = { center: '50% 50%', top: '50% 0%', bottom: '50% 100%', left: '0% 50%', right: '100% 50%' };

/** Single banner image with upload / replace / remove, previewed at the real aspect ratio and crop position. */
export default function BannerImageField({ label, hint, value, onChange, aspect, position = 'center', required = false }: {
  label: string; hint: string; value: string; onChange: (url: string) => void; aspect: string; position?: BannerPosition; required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  const { toast } = useUI();

  async function onFile(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast(`${file.name} is larger than 5 MB — please compress it first`, 'error');
    setBusy(true);
    try {
      onChange(await uploadImage(file, 'banners'));
      setBroken(false);
    } catch (e) {
      toast(errorMessage(e, 'Image upload failed'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <p className="label">{label} {required && <span className="text-red-500">*</span>}</p>
      <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-mist ${aspect}`}>
        {value && !broken ? (
          <img src={mediaUrl(value)} alt={`${label} preview`} onError={() => setBroken(true)} className="size-full object-cover" style={{ objectPosition: POSITION[position] }} />
        ) : (
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex size-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted hover:text-ocean">
            {busy ? <Spinner /> : <ImagePlus className="size-7" />}
            {busy ? 'Uploading…' : broken ? 'Image failed to load — upload again' : 'Upload image'}
          </button>
        )}
        {busy && value && <div className="absolute inset-0 grid place-items-center bg-white/70"><Spinner /></div>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {value && (
          <>
            <button type="button" className="btn-outline btn-sm" disabled={busy} onClick={() => input.current?.click()}><RefreshCw className="size-3.5" /> Replace</button>
            <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={busy} onClick={() => { onChange(''); setBroken(false); }}><Trash2 className="size-3.5" /> Remove</button>
          </>
        )}
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
