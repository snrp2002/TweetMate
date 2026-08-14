import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../api/users';
import { queryKeys } from './keys';
import { useAuth } from '../auth/AuthContext';
import type { EditProfileInput } from '../types/api';

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => usersApi.fetchUser(userId),
    enabled: userId.length > 0,
  });
}

export function useEditProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (input: EditProfileInput) => usersApi.editProfile(input),
    onSuccess: (user) => {
      updateUser(user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.user(user._id) });
      // Author avatars are denormalized into every post, so the feed is stale now.
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}
