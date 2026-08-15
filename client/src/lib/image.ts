import Compressor from 'compressorjs';

/**
 * R2 serves bytes exactly as uploaded — there is no transformation layer — so
 * the browser is the only place images get resized. Without a dimension cap a
 * modern phone photo arrives at several megabytes; capping the long edge is
 * what actually shrinks the payload, quality alone is not enough.
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
