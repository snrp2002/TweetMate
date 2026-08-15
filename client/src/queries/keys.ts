export const queryKeys = {
  posts: ['posts'] as const,
  post: (postId: string) => ['posts', postId] as const,
  userPosts: (userId: string) => ['users', userId, 'posts'] as const,
  comments: (postId: string) => ['comments', postId] as const,
  user: (userId: string) => ['users', userId] as const,
};
