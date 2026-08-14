import { api } from './client';
import type { EditPostInput, Post, PostInput } from '../types/api';

export async function fetchPosts(): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/posts');
  return data;
}

export async function fetchPost(postId: string): Promise<Post> {
  const { data } = await api.get<Post>(`/posts/post/${postId}`);
  return data;
}

export async function createPost(input: PostInput): Promise<Post> {
  const { data } = await api.post<Post>('/posts', input);
  return data;
}

export async function editPost(input: EditPostInput): Promise<Post> {
  const { data } = await api.patch<Post>('/posts', input);
  return data;
}

export async function likePost(postId: string): Promise<Post> {
  const { data } = await api.post<Post>(`/posts/likePost/${postId}`);
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}`);
}
