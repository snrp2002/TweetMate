import type { RequestHandler } from 'express';
import {
  createSignedUpload,
  isAllowedContentType,
  isR2Configured,
  MAX_UPLOAD_BYTES,
} from '../lib/r2.js';
import { errorMessage } from '../lib/serialize.js';

interface SignUploadBody {
  contentType?: string;
  size?: number;
}

/**
 * Tells the client whether direct-to-R2 uploads are available.
 *
 * The client falls back to inline base64 when they are not, so the app keeps
 * working before R2 credentials are configured.
 */
export const uploadConfig: RequestHandler = (_req, res) => {
  res.status(200).json({ enabled: isR2Configured(), maxBytes: MAX_UPLOAD_BYTES });
};

/**
 * Issues a short-lived presigned PUT so the browser uploads straight to R2.
 *
 * The bytes never touch this server, which matters on a small instance: a
 * 5 MB image would otherwise be buffered in memory here first.
 */
export const signUpload: RequestHandler = async (req, res) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  if (!isR2Configured()) {
    res.status(503).json({ message: 'Image uploads are not configured on this server.' });
    return;
  }

  const { contentType, size } = req.body as SignUploadBody;

  if (typeof contentType !== 'string' || !isAllowedContentType(contentType)) {
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
    res.status(200).json(await createSignedUpload(contentType));
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};
