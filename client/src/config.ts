/**
 * Runtime configuration.
 *
 * Everything here used to be hardcoded across five different files. Vite
 * inlines `import.meta.env.VITE_*` at build time, so these are set per
 * environment via `.env` (see `.env.example`).
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const config = {
  apiUrl: trimTrailingSlash(import.meta.env.VITE_API_URL ?? 'http://localhost:5000'),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  /** Origin used to build shareable post links; defaults to wherever the app is served from. */
  shareBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_SHARE_BASE_URL ?? globalThis.location?.origin ?? '',
  ),
} as const;

export function postUrl(postId: string): string {
  return `${config.shareBaseUrl}/post/${postId}`;
}
