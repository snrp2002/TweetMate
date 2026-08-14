/**
 * Wire-format types shared with the client.
 *
 * These describe what the API actually sends, which is wider than the Mongoose
 * schemas: controllers merge the author's `name`/`image` into post and comment
 * payloads so the client does not have to make a second request.
 */

/** A post as stored, plus the author fields merged in by the controller. */
export interface PostResponse {
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

/** A single comment, plus the commenter's `name`/`image`. */
export interface CommentResponse {
  _id: string;
  user: string;
  comment: string;
  createdAt: string;
  name: string;
  image?: string;
}

/** The comment thread that belongs to one post. */
export interface CommentThreadResponse {
  _id: string;
  postId: string;
  comments: CommentResponse[];
}

/** The trimmed user object embedded in an auth response. */
export interface AuthUser {
  _id: string;
  image?: string;
  bio: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

/** A public profile. Never includes the password hash. */
export interface UserProfileResponse {
  _id: string;
  name: string;
  email: string;
  posts: string[];
  image?: string;
  bio: string;
}

export interface ErrorResponse {
  message: string;
}

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

export interface EmailSignUpBody {
  google?: false;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface GoogleSignUpBody {
  google: true;
  name: string;
  email: string;
  image?: string;
}

export type SignUpBody = EmailSignUpBody | GoogleSignUpBody;

export interface EmailSignInBody {
  google?: false;
  email: string;
  password: string;
}

export interface GoogleSignInBody {
  google: true;
  email: string;
  image?: string;
}

export type SignInBody = EmailSignInBody | GoogleSignInBody;

export interface CreatePostBody {
  message: string;
  image: string;
  tags?: string[] | string;
}

export interface EditPostBody extends CreatePostBody {
  _id: string;
  userName?: string;
  userImage?: string;
}

export interface EditUserBody {
  _id: string;
  bio: string;
  image?: string;
}

export interface AddCommentBody {
  postId: string;
  comment: {
    user: string;
    comment: string;
  };
}
