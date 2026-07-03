import { useState } from 'react';

interface AdminImageThumbProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md';
}

export default function AdminImageThumb({ src, alt, size = 'sm' }: AdminImageThumbProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 ${
        size === 'md' ? 'h-16 w-16' : 'h-14 w-14'
      }`}>
        —
      </div>
    );
  }

  const thumbClass = size === 'md'
    ? 'h-16 w-16 rounded-lg object-contain ring-1 ring-gray-200 bg-white p-0.5'
    : 'h-14 w-14 rounded-lg object-contain ring-1 ring-gray-200 bg-white p-0.5';

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="block shrink-0 transition hover:ring-2 hover:ring-lavender-300"
        title="Click to preview"
      >
        <img
          src={src}
          alt={alt}
          className={thumbClass}
          onError={() => setError(true)}
        />
      </button>

      {expanded && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/80"
            onClick={() => setExpanded(false)}
            aria-label="Close preview"
          />
          <img
            src={src}
            alt={alt}
            className="relative z-[1] max-h-[90vh] max-w-[95vw] object-contain"
          />
        </div>
      )}
    </>
  );
}
