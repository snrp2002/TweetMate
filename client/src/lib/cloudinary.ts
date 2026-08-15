/**
 * Cloudinary resizes on delivery, so the browser can ask for exactly the pixels
 * it will display instead of downloading a full-size original. This is where
 * most of the feed's weight disappears.
 *
 * Every helper passes non-Cloudinary values straight through, so inline base64
 * images (the fallback when storage is unconfigured) and the default avatar
 * keep working untouched.
 */
const UPLOAD_SEGMENT = '/image/upload/';

function transform(url: string | undefined, transformation: string): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD_SEGMENT)) {
    return url ?? '';
  }
  return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transformation}/`);
}

/**
 * `f_auto` serves AVIF/WebP to browsers that accept them, `q_auto` picks a
 * quality per image, and `c_limit` never upscales a small original.
 */
const AUTO = 'f_auto,q_auto,c_limit';

/** Feed cards and the post detail view: ~2x the widest rendering size. */
export function feedImage(url: string | undefined): string {
  return transform(url, `${AUTO},w_900`);
}

/** Square, face-aware crop for avatars. `size` is the CSS pixel size. */
export function avatarImage(url: string | undefined, size: number): string {
  const px = Math.round(size * 2);
  return transform(url, `f_auto,q_auto,w_${px},h_${px},c_fill,g_face`);
}

/** Square thumbnails for the profile grid. */
export function tileImage(url: string | undefined): string {
  return transform(url, 'f_auto,q_auto,w_600,h_600,c_fill');
}
