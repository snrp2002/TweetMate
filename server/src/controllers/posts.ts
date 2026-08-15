import type { RequestHandler } from 'express';
import { Post } from '../models/posts.js';
import { User } from '../models/user.js';
import { Comments } from '../models/comments.js';
import { errorMessage, loadAuthors, normalizeTags, toPostResponse } from '../lib/serialize.js';
import { destroyImage } from '../lib/storage.js';
import type { CreatePostBody, EditPostBody } from '../types/api.js';

/** Whole feed, newest first, with each author merged in. */
export const getPosts: RequestHandler = async (_req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    const authors = await loadAuthors(posts.map((post) => post.creator));
    res.status(200).json(posts.map((post) => toPostResponse(post, authors.get(post.creator))));
  } catch (error) {
    res.status(404).json({ message: errorMessage(error) });
  }
};

/**
 * Every post by one author, newest first.
 *
 * The profile page used to fetch these one id at a time — one request per
 * tile. Each round trip costs far more than the query itself, so batching
 * them here turns N requests into one.
 *
 * Queried by `creator` rather than walking `user.posts`, so the order is
 * authoritative and a stale id on the user document cannot produce a gap.
 */
export const getUserPosts: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await Post.find({ creator: userId }).sort({ createdAt: -1 }).lean();
    const authors = await loadAuthors(posts.map((post) => post.creator));
    res.status(200).json(posts.map((post) => toPostResponse(post, authors.get(post.creator))));
  } catch (error) {
    res.status(404).json({ message: errorMessage(error) });
  }
};

export const getPost: RequestHandler = async (req, res) => {
  const { id } = req.params;


  try {
    const post = await Post.findById(id).lean();
    if (!post) {
      res.status(404).json({ message: 'Post not found!!' });
      return;
    }
    const authors = await loadAuthors([post.creator]);
    res.status(200).json(toPostResponse(post, authors.get(post.creator)));
  } catch (error) {
    res.status(404).json({ message: errorMessage(error) });
  }
};

export const createPost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  const body = req.body as CreatePostBody;

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found!!' });
      return;
    }

    const post = await Post.create({
      message: body.message,
      image: body.image,
      tags: normalizeTags(body.tags),
      creator: userId,
      createdAt: new Date(),
    });

    // Every post owns exactly one comment thread document.
    await Comments.create({ postId: String(post._id) });

    user.posts = [String(post._id), ...user.posts];
    await user.save();

    res.status(201).json(toPostResponse(post.toObject(), { name: user.name, image: user.image }));
  } catch (error) {
    res.status(409).json({ message: errorMessage(error) });
  }
};

export const editPost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  const body = req.body as EditPostBody;

  try {
    const existing = await Post.findById(body._id).select('creator').lean();
    if (!existing) {
      res.status(404).json({ message: 'Post not found!!' });
      return;
    }
    if (existing.creator !== userId) {
      res.status(403).json({ message: 'You can only edit your own posts.' });
      return;
    }

    // Only the caption, tags and image are editable — `creator`, `likes`,
    // `commentCount` and `createdAt` are never taken from the request.
    const post = await Post.findByIdAndUpdate(
      body._id,
      { message: body.message, image: body.image, tags: normalizeTags(body.tags) },
      { returnDocument: 'after' },
    ).lean();

    if (!post) {
      res.status(404).json({ message: 'Post not found!!' });
      return;
    }

    const authors = await loadAuthors([post.creator]);
    res.status(200).json(toPostResponse(post, authors.get(post.creator)));
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

/** Adds the caller to `likes` if absent, removes them if present. */
export const likePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  const { id } = req.params;

  try {
    const existing = await Post.findById(id).select('likes').lean();
    if (!existing) {
      res.status(404).json({ message: 'Post not found!!' });
      return;
    }

    const hasLiked = existing.likes.includes(userId);
    const post = await Post.findByIdAndUpdate(
      id,
      hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { returnDocument: 'after' },
    ).lean();

    if (!post) {
      res.status(404).json({ message: 'Post not found!!' });
      return;
    }

    const authors = await loadAuthors([post.creator]);
    res.status(200).json(toPostResponse(post, authors.get(post.creator)));
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

export const deletePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  const { id: postId } = req.params;

  try {
    const post = await Post.findById(postId).select('creator image').lean();
    if (!post) {
      res.status(404).json({ message: 'Post not found!!' });
      return;
    }
    if (post.creator !== userId) {
      res.status(403).json({ message: 'You can only delete your own posts.' });
      return;
    }

    await Post.deleteOne({ _id: postId });
    await Comments.deleteOne({ postId });
    // Prune from the creator's list — not the caller's.
    await User.updateOne({ _id: post.creator }, { $pull: { posts: postId } });

    // Best effort: an orphaned image must never block deleting the post.
    if (post.image) void destroyImage(post.image);

    res.status(200).json({ message: 'Successfully deleted the post.' });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};
