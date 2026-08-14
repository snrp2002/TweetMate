import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as commentsApi from '../api/comments';
import { queryKeys } from './keys';
import type { CommentThread, Post } from '../types/api';

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
    onSuccess: (thread: CommentThread) => {
      queryClient.setQueryData(queryKeys.comments(postId), thread);

      // Keep the comment badge on the post card in sync.
      const commentCount = thread.comments.length;
      queryClient.setQueryData<Post[]>(queryKeys.posts, (posts) =>
        posts?.map((post) => (post._id === postId ? { ...post, commentCount } : post)),
      );
      queryClient.setQueryData<Post>(queryKeys.post(postId), (post) =>
        post ? { ...post, commentCount } : post,
      );
    },
  });
}
