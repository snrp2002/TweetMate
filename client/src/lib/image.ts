import Compressor from 'compressorjs';

/**
 * Shrinking before upload is not strictly required — Cloudinary resizes on
 * delivery — but it keeps the upload fast on a phone connection and stores a
 * smaller original, which is what the free plan's storage credits are measured
 * against. Capping the long edge is what does the work; quality alone is not
 * enough for a modern camera photo.
 */
const MAX_EDGE = 1600;
const QUALITY = 0.72;

export interface PreparedImage {
  blob: Blob;
  contentType: string;
}

export function compressImage(file: File): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: QUALITY,
      maxWidth: MAX_EDGE,
      maxHeight: MAX_EDGE,
      // Re-encode large PNGs (screenshots) as JPEG; flat images shrink a lot.
      convertTypes: ['image/png'],
      convertSize: 500_000,
      success: (blob) => resolve({ blob, contentType: blob.type || 'image/jpeg' }),
      error: (error) => reject(error),
    });
  });
}

export function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}
