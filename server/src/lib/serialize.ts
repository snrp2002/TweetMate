import { Types } from 'mongoose';
import { User } from '../models/user.js';
import type { PostDoc } from '../models/posts.js';
import type { PostResponse } from '../types/api.js';

export const UNKNOWN_AUTHOR = 'Unknown user';

export interface Author {
  name: string;
  image?: string | undefined;
}

/** Narrow the unknown thrown by a `catch` into a message string. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong!!';
}

/**
 * Loads every referenced author in a single query.
 *
 * Replaces the previous one-`findOne`-per-document pattern, which made the
 * feed cost O(number of posts) round trips.
 */
export async function loadAuthors(ids: readonly string[]): Promise<Map<string, Author>> {
  const unique = [...new Set(ids)].filter((id) => Types.ObjectId.isValid(id));
  if (unique.length === 0) return new Map();

  const users = await User.find({ _id: { $in: unique } })
    .select('name image')
    .lean();

  return new Map(users.map((user) => [String(user._id), { name: user.name, image: user.image }]));
}

/** Accepts the comma/space separated string the form sends, or a real array. */
export function normalizeTags(tags: unknown): string[] {
  const raw = Array.isArray(tags) ? tags : typeof tags === 'string' ? [tags] : [];
  return raw
    .flatMap((tag) => (typeof tag === 'string' ? tag.split(/[,\s]+/) : []))
    .map((tag) => tag.trim().replace(/^#+/, ''))
    .filter((tag) => tag.length > 0);
}

type LeanPost = Omit<PostDoc, '_id'> & { _id: Types.ObjectId };

/** Merges a stored post with its author into the shape the client expects. */
export function toPostResponse(post: LeanPost, author: Author | undefined): PostResponse {
  return {
    _id: String(post._id),
    message: post.message,
    creator: post.creator,
    image: post.image,
    tags: post.tags ?? [],
    likes: post.likes ?? [],
    commentCount: post.commentCount ?? 0,
    createdAt: new Date(post.createdAt).toISOString(),
    userName: author?.name ?? UNKNOWN_AUTHOR,
    ...(author?.image ? { userImage: author.image } : {}),
  };
}
