import { api } from './client';

export interface UploadConfig {
  enabled: boolean;
  maxBytes: number;
}

interface SignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  maxBytes: number;
}

export async function fetchUploadConfig(): Promise<UploadConfig> {
  const { data } = await api.get<UploadConfig>('/uploads/config');
  return data;
}

/**
 * Uploads straight to R2 using a short-lived presigned PUT and returns the
 * public URL. The bytes never pass through our API.
 */
export async function uploadImage(file: Blob): Promise<string> {
  const contentType = file.type || 'image/jpeg';

  const { data: signed } = await api.post<SignedUpload>('/uploads/sign', {
    contentType,
    size: file.size,
  });

  // Sent with fetch rather than the shared axios instance so the Authorization
  // interceptor cannot leak our JWT to a third-party origin.
  const response = await fetch(signed.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  return signed.publicUrl;
}
