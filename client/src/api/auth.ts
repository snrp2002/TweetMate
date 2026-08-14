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
