import { api } from './client';
import type { AuthUser, EditProfileInput, UserProfile } from '../types/api';

export async function fetchUser(userId: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/user/${userId}`);
  return data;
}

export async function editProfile(input: EditProfileInput): Promise<AuthUser> {
  const { data } = await api.patch<AuthUser>('/user/editUser', input);
  return data;
}
