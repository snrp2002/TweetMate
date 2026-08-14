import { jwtDecode } from 'jwt-decode';
import type { Session } from '../types/api';

const STORAGE_KEY = 'user';

interface JwtClaims {
  exp?: number;
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<JwtClaims>(token);
    if (typeof exp !== 'number') return false;
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** Milliseconds until the token expires; `0` when already expired or undecodable. */
export function millisecondsUntilExpiry(token: string): number {
  try {
    const { exp } = jwtDecode<JwtClaims>(token);
    if (typeof exp !== 'number') return 0;
    return Math.max(0, exp * 1000 - Date.now());
  } catch {
    return 0;
  }
}

/** Reads the persisted session, discarding it if the token has already expired. */
export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session | null;
    if (!parsed?.token || !parsed.user?._id) return null;

    if (isTokenExpired(parsed.token)) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
