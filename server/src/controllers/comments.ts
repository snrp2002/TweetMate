import type { RequestHandler } from 'express';
import { Comments, type CommentEntry } from '../models/comments.js';
import { Post } from '../models/posts.js';
import { errorMessage, loadAuthors, UNKNOWN_AUTHOR, type Author } from '../lib/serialize.js';
import type { AddCommentBody, CommentResponse, CommentThreadResponse } from '../types/api.js';

function toCommentResponse(entry: CommentEntry, author: Author | undefined): CommentResponse {
  return {
    _id: String(entry._id),
    user: entry.user,
    comment: entry.comment,
    createdAt: new Date(entry.createdAt).toISOString(),
    name: author?.name ?? UNKNOWN_AUTHOR,
    ...(author?.image ? { image: author.image } : {}),
  };
}

async function toThreadResponse(thread: {
  _id: unknown;
  postId: string;
  comments: CommentEntry[];
}): Promise<CommentThreadResponse> {
  const authors = await loadAuthors(thread.comments.map((entry) => entry.user));
  return {
    _id: String(thread._id),
    postId: thread.postId,
    comments: thread.comments.map((entry) => toCommentResponse(entry, authors.get(entry.user))),
  };
}

export const getComments: RequestHandler = async (req, res) => {
  const { postId } = req.params;

  try {
    const thread = await Comments.findOne({ postId }).lean();
    if (!thread) {
      // A post with no thread document behaves like an empty thread.
      res.status(200).json({ _id: '', postId: postId ?? '', comments: [] });
      return;
    }
    res.status(200).json(await toThreadResponse(thread));
  } catch (error) {
    res.status(400).json({ message: errorMessage(error) });
  }
};

export const addComments: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  const body = req.body as AddCommentBody;
  const text = body.comment?.comment?.trim();

  if (!body.postId || !text) {
    res.status(400).json({ message: 'A comment cannot be empty.' });
    return;
  }

  try {
    // The author comes from the verified token, never from the request body.
    const thread = await Comments.findOneAndUpdate(
      { postId: body.postId },
      { $push: { comments: { $each: [{ user: userId, comment: text, createdAt: new Date() }], $position: 0 } } },
      { returnDocument: 'after', upsert: true },
    ).lean();

    await Post.updateOne({ _id: body.postId }, { $inc: { commentCount: 1 } });

    res.status(200).json(await toThreadResponse(thread));
  } catch (error) {
    res.status(400).json({ message: errorMessage(error) });
  }
};
