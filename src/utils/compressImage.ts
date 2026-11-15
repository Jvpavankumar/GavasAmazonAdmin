const MAX_DIMENSION = 1600;
const QUALITY = 0.85;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Downscale an uploaded image (longest side ≤ 1600px) and re-encode it as WebP,
 * which keeps transparency. Returns a base64 data URL. Falls back to the original
 * file when re-encoding doesn't make it smaller (e.g. a GIF or an already small image).
 */
export async function compressImage(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  if (file.type === 'image/gif') return original;

  const img = await loadImage(original);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
  if (!blob || blob.size >= file.size) return original;
  return readAsDataUrl(blob);
}
