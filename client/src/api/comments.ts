import { api } from './client';
import type { CommentThread } from '../types/api';

export async function fetchComments(postId: string): Promise<CommentThread> {
  const { data } = await api.get<CommentThread>(`/comments/${postId}`);
  return data;
}

export async function addComment(postId: string, comment: string): Promise<CommentThread> {
  const { data } = await api.post<CommentThread>('/comments', {
    postId,
    // The server derives the author from the bearer token; this is informational only.
    comment: { comment },
  });
  return data;
}
