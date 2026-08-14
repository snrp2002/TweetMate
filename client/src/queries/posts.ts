import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as postsApi from '../api/posts';
import { queryKeys } from './keys';
import type { EditPostInput, Post, PostInput } from '../types/api';

/** Writes an updated post into both the feed cache and its own cache entry. */
function cachePost(queryClient: QueryClient, post: Post): void {
  queryClient.setQueryData<Post[]>(queryKeys.posts, (posts) =>
    posts?.map((existing) => (existing._id === post._id ? post : existing)),
  );
  queryClient.setQueryData(queryKeys.post(post._id), post);
}

export function usePosts() {
  return useQuery({
    queryKey: queryKeys.posts,
    queryFn: postsApi.fetchPosts,
  });
}

/**
 * A single post.
 *
 * Seeded from the feed cache when it is already loaded, so navigating from the
 * feed is instant — but it still fetches on its own, which makes deep links
 * like `/post/:id` work without loading the entire feed first.
 */
export function usePost(postId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => postsApi.fetchPost(postId),
    placeholderData: () =>
      queryClient.getQueryData<Post[]>(queryKeys.posts)?.find((post) => post._id === postId),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PostInput) => postsApi.createPost(input),
    onSuccess: (post) => {
      queryClient.setQueryData<Post[]>(queryKeys.posts, (posts) => [post, ...(posts ?? [])]);
      queryClient.setQueryData(queryKeys.post(post._id), post);
      void queryClient.invalidateQueries({ queryKey: queryKeys.user(post.creator) });
    },
  });
}

export function useEditPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EditPostInput) => postsApi.editPost(input),
    onSuccess: (post) => cachePost(queryClient, post),
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.likePost(postId),
    onSuccess: (post) => cachePost(queryClient, post),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
    onSuccess: (_result, postId) => {
      queryClient.setQueryData<Post[]>(queryKeys.posts, (posts) =>
        posts?.filter((post) => post._id !== postId),
      );
      queryClient.removeQueries({ queryKey: queryKeys.post(postId) });
      queryClient.removeQueries({ queryKey: queryKeys.comments(postId) });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
