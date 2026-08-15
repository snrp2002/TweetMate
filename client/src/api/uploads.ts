import { api } from './client';

export interface UploadConfig {
  enabled: boolean;
  maxBytes: number;
}

interface SignedUpload {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  maxBytes: number;
}

interface CloudinaryResponse {
  secure_url?: string;
  error?: { message?: string };
}

export async function fetchUploadConfig(): Promise<UploadConfig> {
  const { data } = await api.get<UploadConfig>('/uploads/config');
  return data;
}

/**
 * Uploads straight to Cloudinary with a server-issued signature and returns the
 * delivery URL. The bytes never pass through our API.
 */
export async function uploadImage(file: Blob): Promise<string> {
  const { data: signed } = await api.post<SignedUpload>('/uploads/sign', {
    contentType: file.type || 'image/jpeg',
    size: file.size,
  });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('folder', signed.folder);
  form.append('signature', signed.signature);

  // Sent with fetch rather than the shared axios instance so the Authorization
  // interceptor cannot leak our JWT to a third-party origin.
  const response = await fetch(signed.uploadUrl, { method: 'POST', body: form });
  const body = (await response.json()) as CloudinaryResponse;

  if (!response.ok || !body.secure_url) {
    throw new Error(body.error?.message ?? `Upload failed (${response.status})`);
  }

  return body.secure_url;
}
