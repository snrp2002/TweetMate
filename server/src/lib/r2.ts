import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

/** Formats we accept, mapped to the extension used for the object key. */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** How long a presigned PUT stays valid. Short: it is used immediately. */
const SIGN_TTL_SECONDS = 300;

/**
 * R2 is optional. When it is not configured the app keeps working by storing
 * images inline as it always has, so this can ship before the credentials
 * exist and light up the moment they do.
 */
export function isR2Configured(): boolean {
  return Boolean(
    env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket && env.r2.publicUrl,
  );
}

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      // R2 ignores the region but the SDK requires one.
      region: 'auto',
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }
  return client;
}

export function isAllowedContentType(contentType: string): boolean {
  return contentType in EXTENSIONS;
}

/** `posts/<uuid>.<ext>` — random, so keys never collide or leak user data. */
export function buildObjectKey(contentType: string, prefix = 'posts'): string {
  const ext = EXTENSIONS[contentType] ?? 'bin';
  return `${prefix}/${randomUUID()}.${ext}`;
}

export function publicUrlFor(key: string): string {
  return `${env.r2.publicUrl.replace(/\/+$/, '')}/${key}`;
}

export interface SignedUpload {
  /** PUT the bytes here, with the same Content-Type. */
  uploadUrl: string;
  /** Where the object will be readable once uploaded. */
  publicUrl: string;
  key: string;
  maxBytes: number;
}

export async function createSignedUpload(
  contentType: string,
  prefix?: string,
): Promise<SignedUpload> {
  const key = buildObjectKey(contentType, prefix);

  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      ContentType: contentType,
      // Immutable: keys are random, so a URL always refers to the same bytes.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn: SIGN_TTL_SECONDS },
  );

  return { uploadUrl, publicUrl: publicUrlFor(key), key, maxBytes: MAX_UPLOAD_BYTES };
}

/** Uploads bytes directly from the server. Used by the backfill script. */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return publicUrlFor(key);
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key }));
}

/** True for values we store as a remote URL rather than inline base64. */
export function isRemoteImage(value: string | undefined): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}
