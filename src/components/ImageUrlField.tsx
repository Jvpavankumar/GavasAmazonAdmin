import { useRef, useState } from 'react';
import { Upload, ZoomIn, X } from 'lucide-react';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ImageUrlFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUrlField({
  label = 'Image',
  value,
  onChange,
  placeholder = 'https://example.com/image.jpg',
}: ImageUrlFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPEG, PNG, GIF, or WebP image.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('Image must be 2 MB or smaller.');
      e.target.value = '';
      return;
    }

    try {
      setLoadError(false);
      onChange(await fileToBase64(file));
    } catch {
      alert('Failed to read image file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type="text"
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => {
          setLoadError(false);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload image
        </button>
        {value.startsWith('data:') && (
          <span className="text-xs text-emerald-600">Uploaded (base64)</span>
        )}
        {value && (
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              onChange('');
            }}
            className="text-xs text-gray-500 hover:text-red-600"
          >
            Clear
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {value && !loadError ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group mt-3 block w-full text-left"
        >
          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition group-hover:border-lavender-300">
            <div
              className="flex min-h-64 items-center justify-center p-4 sm:min-h-72"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            >
              <img
                src={value}
                alt="Preview"
                className="max-h-72 max-w-full object-contain"
                onError={() => setLoadError(true)}
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              <ZoomIn className="h-3.5 w-3.5" />
              Click preview to view full size
            </div>
          </div>
        </button>
      ) : (
        <div className="mt-3 flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center sm:min-h-72">
          {loadError ? (
            <>
              <p className="text-sm font-medium text-red-600">Could not load image</p>
              <p className="mt-1 text-xs text-gray-400">Check the URL or upload a new file</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Paste a URL or upload an image</p>
              <p className="mt-1 text-xs text-gray-400">Preview appears here at full clarity</p>
            </>
          )}
        </div>
      )}

      {expanded && value && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            onClick={() => setExpanded(false)}
            aria-label="Close preview"
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={value}
            alt="Full size preview"
            className="relative z-[1] max-h-[90vh] max-w-[95vw] object-contain"
          />
        </div>
      )}
    </div>
  );
}
