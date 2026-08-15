import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as commentsApi from '../api/comments';
import { queryKeys } from './keys';
import type { CommentThread, Post } from '../types/api';

/**
 * Writes a thread into the cache and re-syncs the comment badge everywhere the
 * post appears — the feed, its own entry, and the author's profile grid.
 */
function syncThread(queryClient: QueryClient, postId: string, thread: CommentThread): void {
  queryClient.setQueryData(queryKeys.comments(postId), thread);

  const commentCount = thread.comments.length;
  const apply = (post: Post) => (post._id === postId ? { ...post, commentCount } : post);

  queryClient.setQueryData<Post[]>(queryKeys.posts, (posts) => posts?.map(apply));
  queryClient.setQueryData<Post>(queryKeys.post(postId), (post) =>
    post ? { ...post, commentCount } : post,
  );
  // The grid shows the same badge, so it has to move too.
  queryClient.setQueriesData<Post[]>({ queryKey: ['users'] }, (posts) =>
    Array.isArray(posts) ? posts.map(apply) : posts,
  );
}

/** Only runs once the thread has actually been opened. */
export function useComments(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: () => commentsApi.fetchComments(postId),
    enabled,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: string) => commentsApi.addComment(postId, comment),
    onSuccess: (thread: CommentThread) => syncThread(queryClient, postId, thread),
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(postId, commentId),
    onSuccess: (thread: CommentThread) => syncThread(queryClient, postId, thread),
  });
}
