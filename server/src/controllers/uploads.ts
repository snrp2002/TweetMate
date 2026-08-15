import type { RequestHandler } from 'express';
import { createSignedUpload, isStorageConfigured, MAX_UPLOAD_BYTES } from '../lib/storage.js';
import { errorMessage } from '../lib/serialize.js';

interface SignUploadBody {
  contentType?: string;
  size?: number;
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/**
 * Tells the client whether direct uploads are available.
 *
 * The client falls back to inline base64 when they are not, so the app keeps
 * working before storage credentials are configured.
 */
export const uploadConfig: RequestHandler = (_req, res) => {
  res.status(200).json({ enabled: isStorageConfigured(), maxBytes: MAX_UPLOAD_BYTES });
};

/**
 * Signs one direct-to-Cloudinary upload so the browser can post the bytes
 * itself. They never touch this server, which matters on a small instance: a
 * 5 MB image would otherwise be buffered in memory here first.
 */
export const signUpload: RequestHandler = (req, res) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  if (!isStorageConfigured()) {
    res.status(503).json({ message: 'Image uploads are not configured on this server.' });
    return;
  }

  const { contentType, size } = req.body as SignUploadBody;

  if (typeof contentType !== 'string' || !ALLOWED_TYPES.has(contentType)) {
    res.status(400).json({ message: 'Unsupported image type.' });
    return;
  }

  if (typeof size === 'number' && size > MAX_UPLOAD_BYTES) {
    res.status(413).json({
      message: `That image is too large. Maximum ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
    });
    return;
  }

  try {
    res.status(200).json(createSignedUpload());
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};
