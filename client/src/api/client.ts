import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { readStoredSession } from '../auth/storage';

export const api = axios.create({ baseURL: config.apiUrl });

api.interceptors.request.use((request) => {
  const session = readStoredSession();
  if (session) {
    request.headers.set('Authorization', `Bearer ${session.token}`);
  }
  return request;
});

interface ApiErrorBody {
  message?: string;
}

/**
 * Turns any thrown value into a human-readable message.
 *
 * Previously every request failure was swallowed by `console.log`, so users
 * saw nothing when a like or comment failed.
 */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong!!'): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Please try again.';
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
