import { api } from './client';
import type {
  EmailSignInInput,
  EmailSignUpInput,
  GoogleAuthInput,
  Session,
} from '../types/api';

export async function signUp(input: EmailSignUpInput | GoogleAuthInput): Promise<Session> {
  const { data } = await api.post<Session>('/auth/signup', input);
  return data;
}

export async function signIn(input: EmailSignInInput | GoogleAuthInput): Promise<Session> {
  const { data } = await api.post<Session>('/auth/signin', input);
  return data;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

/** Exchanges a Google access token for the user's profile. */
export async function fetchGoogleProfile(accessToken: string): Promise<GoogleUserInfo> {
  const { data } = await api.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v3/userinfo', {
    baseURL: '',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
