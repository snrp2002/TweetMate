import { createHash } from 'node:crypto';
import { env } from '../config/env.js';

/** Cloudinary's free plan caps images at 10 MB; stay under it. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const POSTS_FOLDER = 'tweetmate/posts';
export const AVATARS_FOLDER = 'tweetmate/avatars';

const API_BASE = 'https://api.cloudinary.com/v1_1';

/**
 * Storage is optional. Without credentials the app falls back to storing images
 * inline as base64, exactly as it always did, so this ships before the account
 * exists and lights up the moment the env vars are set.
 */
export function isStorageConfigured(): boolean {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

/**
 * Cloudinary signs the request parameters sorted alphabetically and joined as a
 * query string, with the API secret appended before hashing. `file`, `api_key`
 * and `resource_type` are excluded by their spec.
 */
function sign(params: Record<string, string | number>): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join('&');
  return createHash('sha1').update(payload + env.cloudinary.apiSecret).digest('hex');
}

export interface SignedUpload {
  /** The browser POSTs multipart form data here. */
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  maxBytes: number;
}

/**
 * Produces the credentials for one direct browser upload.
 *
 * The signature covers the folder and timestamp, so a leaked signature cannot
 * be replayed to write somewhere else, and Cloudinary rejects it after an hour.
 */
export function createSignedUpload(folder: string = POSTS_FOLDER): SignedUpload {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    uploadUrl: `${API_BASE}/${env.cloudinary.cloudName}/image/upload`,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    signature: sign({ folder, timestamp }),
    folder,
    maxBytes: MAX_UPLOAD_BYTES,
  };
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
}

/**
 * Uploads from the server. Cloudinary accepts a `data:` URI directly as the
 * file, which is exactly what the old inline images already are — so the
 * backfill needs no decoding step.
 */
export async function uploadFromServer(file: string, folder: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', env.cloudinary.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', sign({ folder, timestamp }));

  const response = await fetch(`${API_BASE}/${env.cloudinary.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  const body = (await response.json()) as CloudinaryUploadResponse;
  if (!response.ok || !body.secure_url) {
    throw new Error(body.error?.message ?? `Cloudinary upload failed (${response.status})`);
  }
  return body.secure_url;
}

/**
 * Recovers the public id from a delivery URL, so deleting a post can delete its
 * image without storing a second field on the document.
 *
 * `https://res.cloudinary.com/<cloud>/image/upload/v1699/tweetmate/posts/x.jpg`
 * becomes `tweetmate/posts/x`.
 */
export function publicIdFromUrl(url: string): string | null {
  const match = /\/image\/upload\/(.+)$/.exec(url);
  if (!match?.[1]) return null;

  let rest = match[1];
  // Delivery URLs always carry a version; anything before it is a transformation.
  const version = /(?:^|\/)v\d+\//.exec(rest);
  if (!version) return null;
  rest = rest.slice(version.index + version[0].length);

  const publicId = rest.replace(/\.[a-z0-9]+$/i, '');
  return publicId || null;
}

/**
 * Best-effort delete. Callers must not fail a user action because cleanup
 * failed — an orphaned image is far less bad than an undeletable post.
 */
export async function destroyImage(url: string): Promise<boolean> {
  if (!isStorageConfigured() || !isRemoteImage(url)) return false;

  const publicId = publicIdFromUrl(url);
  if (!publicId) return false;

  const timestamp = Math.floor(Date.now() / 1000);

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', env.cloudinary.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', sign({ public_id: publicId, timestamp }));

  try {
    const response = await fetch(`${API_BASE}/${env.cloudinary.cloudName}/image/destroy`, {
      method: 'POST',
      body: form,
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** True for values stored as a remote URL rather than inline base64. */
export function isRemoteImage(value: string | undefined): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}
