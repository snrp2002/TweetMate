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

/**
 * The project's existing Google OAuth client ID, kept as the default so Google
 * sign-in keeps working with no configuration — exactly as it did when this was
 * hardcoded in `index.js`.
 *
 * OAuth *client IDs* are public by design: they ship in the JS bundle and are
 * visible to anyone using the app. The secret half never touches the client.
 * Override it per-deployment with `VITE_GOOGLE_CLIENT_ID`.
 */
const DEFAULT_GOOGLE_CLIENT_ID =
  '895748341443-s8kp5gak0283dm129har14cgel95hdn2.apps.googleusercontent.com';

export const config = {
  apiUrl: trimTrailingSlash(import.meta.env.VITE_API_URL ?? 'http://localhost:5000'),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? DEFAULT_GOOGLE_CLIENT_ID,
  /** Origin used to build shareable post links; defaults to wherever the app is served from. */
  shareBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_SHARE_BASE_URL ?? globalThis.location?.origin ?? '',
  ),
} as const;

export function postUrl(postId: string): string {
  return `${config.shareBaseUrl}/post/${postId}`;
}
