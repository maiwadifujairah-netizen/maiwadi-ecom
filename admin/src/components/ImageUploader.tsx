import { useRef, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { errorMessage, uploadImage } from '../services/api';
import { useUI } from '../context/UIContext';
import { Img, Spinner } from './States';

/** Uploads images to the backend (Cloudinary) and shows previews. First image = main image. */
export default function ImageUploader({ value, onChange, max = 6, folder }: { value: string[]; onChange: (v: string[]) => void; max?: number; folder: 'products' | 'banners' }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useUI();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, max - value.length);
    for (const f of list) if (f.size > 5 * 1024 * 1024) return toast(`${f.name} is larger than 5 MB`, 'error');
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of list) urls.push(await uploadImage(f, folder));
      onChange([...value, ...urls]);
    } catch (e) {
      toast(errorMessage(e, 'Image upload failed'), 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-mist">
            <Img src={url} alt={`Image ${i + 1}`} className="size-full object-contain" />
            {i === 0 && max > 1 && <span className="absolute bottom-1 left-1 badge bg-ocean text-white">Main</span>}
            <div className="absolute top-1 right-1 flex gap-1">
              {i > 0 && (
                <button type="button" title="Make main image" onClick={() => onChange([url, ...value.filter((u) => u !== url)])} className="rounded-full bg-white/90 p-1 text-deep shadow hover:bg-white">
                  <Star className="size-3.5" />
                </button>
              )}
              <button type="button" title="Remove" onClick={() => onChange(value.filter((u) => u !== url))} className="rounded-full bg-white/90 p-1 text-red-600 shadow hover:bg-white">
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-xs font-medium text-muted hover:border-ocean hover:text-ocean">
            {busy ? <Spinner /> : <ImagePlus className="size-6" />}
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={max > 1} hidden onChange={(e) => onFiles(e.target.files)} />
      <p className="mt-2 text-xs text-muted">JPG, PNG, WebP or AVIF · max 5 MB each</p>
    </div>
  );
}
