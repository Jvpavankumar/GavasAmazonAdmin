import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Star, X } from 'lucide-react';
import { compressImage } from '../utils/compressImage';

export const MAX_GALLERY_IMAGES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface GalleryImagesFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  /** Swap a gallery image with the main product image. */
  onMakeMain?: (index: number) => void;
}

/** Extra "preview" images shown in the product page gallery after the main image. */
export default function GalleryImagesField({ images, onChange, onMakeMain }: GalleryImagesFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const remaining = MAX_GALLERY_IMAGES - images.length;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);

    const valid = files.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length < files.length) setError('Some files were skipped (JPEG, PNG, GIF or WebP up to 10 MB only).');
    const toAdd = valid.slice(0, remaining);
    if (valid.length > remaining) setError(`Only ${MAX_GALLERY_IMAGES} preview images are allowed.`);
    if (toAdd.length === 0) return;

    setBusy(true);
    try {
      const encoded = await Promise.all(toAdd.map(compressImage));
      onChange([...images, ...encoded]);
    } catch {
      setError('Could not read one of the images.');
    } finally {
      setBusy(false);
    }
  };

  const addUrl = () => {
    const value = url.trim();
    if (!value) return;
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      setError('Enter a valid image URL starting with http:// or https://');
      return;
    }
    if (remaining <= 0) {
      setError(`Only ${MAX_GALLERY_IMAGES} preview images are allowed.`);
      return;
    }
    setError(null);
    onChange([...images, value]);
    setUrl('');
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-gray-600">Preview images</label>
        <span className="text-xs text-gray-400">
          {images.length}/{MAX_GALLERY_IMAGES}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-gray-400">
        Extra photos shown in the product page gallery after the main image (other angles, box contents, in use).
      </p>

      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={`${i}-${src.slice(-24)}`} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
            <button type="button" onClick={() => setExpanded(src)} className="block h-full w-full" title="View full size">
              <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-contain p-1" />
            </button>
            <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 text-[10px] font-medium text-white">{i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 rounded-full bg-white/95 p-1 text-gray-600 shadow hover:text-red-600"
              aria-label={`Remove preview image ${i + 1}`}
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="rounded bg-white/95 p-1 text-gray-700 shadow disabled:opacity-30"
                aria-label="Move left"
              >
                <ArrowLeft className="h-3 w-3" />
              </button>
              {onMakeMain && (
                <button
                  type="button"
                  onClick={() => onMakeMain(i)}
                  className="flex items-center gap-0.5 rounded bg-white/95 px-1.5 text-[10px] font-medium text-gray-700 shadow hover:text-lavender-700"
                  title="Use as main image"
                >
                  <Star className="h-3 w-3" /> Main
                </button>
              )}
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === images.length - 1}
                className="rounded bg-white/95 p-1 text-gray-700 shadow disabled:opacity-30"
                aria-label="Move right"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-xs text-gray-500 transition hover:border-lavender-300 hover:text-lavender-700 disabled:opacity-60"
          >
            <ImagePlus className="h-5 w-5" />
            {busy ? 'Processing…' : 'Add photos'}
          </button>
        )}
      </div>

      {remaining > 0 && (
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="…or paste an image URL"
              className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-8 text-sm outline-none focus:border-lavender-400"
            />
          </div>
          <button type="button" onClick={addUrl} className="btn-secondary px-3 text-xs">
            Add
          </button>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFiles}
        className="hidden"
      />

      {expanded && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8">
          <button type="button" className="absolute inset-0 bg-black/80" onClick={() => setExpanded(null)} aria-label="Close preview" />
          <button
            type="button"
            onClick={() => setExpanded(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={expanded} alt="Full size preview" className="relative z-[1] max-h-[90vh] max-w-[95vw] object-contain" />
        </div>
      )}
    </div>
  );
}
