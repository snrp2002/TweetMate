/** Wire-format types. These mirror `server/src/types/api.ts`. */

export interface Post {
  _id: string;
  message: string;
  creator: string;
  image: string;
  tags: string[];
  likes: string[];
  commentCount: number;
  createdAt: string;
  userName: string;
  userImage?: string;
}

export interface Comment {
  _id: string;
  user: string;
  comment: string;
  createdAt: string;
  name: string;
  image?: string;
}

export interface CommentThread {
  _id: string;
  postId: string;
  comments: Comment[];
}

export interface AuthUser {
  _id: string;
  image?: string;
  bio: string;
}

export interface Session {
  user: AuthUser;
  token: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  posts: string[];
  image?: string;
  bio: string;
}

export interface EmailSignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface EmailSignInInput {
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  google: true;
  /** The server verifies this with Google and derives the identity itself. */
  accessToken: string;
}

export interface PostInput {
  message: string;
  tags: string;
  image: string;
}

export interface EditPostInput extends PostInput {
  _id: string;
}

export interface EditProfileInput {
  bio: string;
  image?: string;
}
