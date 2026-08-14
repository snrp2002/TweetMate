import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';

/** A Google identity the server has verified for itself. */
export interface GoogleIdentity {
  email: string;
  name?: string | undefined;
  picture?: string | undefined;
}

interface GoogleProfile {
  name?: string;
  picture?: string;
}

const client = new OAuth2Client();

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/** Display fields, which `tokeninfo` does not return. Best-effort. */
async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  try {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return {};
    return (await response.json()) as GoogleProfile;
  } catch {
    return {};
  }
}

/**
 * Verifies a Google access token with Google and returns the identity it
 * actually belongs to.
 *
 * The client is never trusted for identity. Previously the browser sent
 * `{ google: true, email }` and the server took it at face value, so knowing
 * an email address was enough to sign in as that account.
 *
 * Two checks matter here:
 *  - `getTokenInfo` rejects tokens that are forged, expired or revoked.
 *  - the `aud` comparison rejects tokens minted for a *different* application,
 *    which a malicious site could otherwise collect and replay against us.
 */
export async function verifyGoogleAccessToken(accessToken: unknown): Promise<GoogleIdentity> {
  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    throw new Error('A Google access token is required.');
  }

  if (!env.googleClientId) {
    throw new Error('Google sign-in is not configured on this server.');
  }

  const info = await client.getTokenInfo(accessToken).catch(() => {
    throw new Error('That Google sign-in could not be verified.');
  });

  if (info.aud !== env.googleClientId) {
    throw new Error('That Google token was not issued for this application.');
  }
  if (!info.email) {
    throw new Error('That Google sign-in did not include an email address.');
  }
  if (info.email_verified === false) {
    throw new Error('That Google account has no verified email address.');
  }

  const profile = await fetchProfile(accessToken);

  return {
    email: info.email,
    name: profile.name,
    picture: profile.picture,
  };
}
