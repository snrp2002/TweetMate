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

/** Always resolves for a well-formed address, whether or not it has an account. */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/forgot', { email });
  return data;
}

export async function resetPassword(input: {
  token: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<Session> {
  const { data } = await api.post<Session>('/auth/reset', input);
  return data;
}
