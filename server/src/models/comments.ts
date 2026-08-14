import { Schema, model, type Model, type Types } from 'mongoose';

export interface CommentEntry {
  _id: Types.ObjectId;
  /** `User._id` stored as a string. */
  user: string;
  comment: string;
  createdAt: Date;
}

export interface CommentsDoc {
  _id: Types.ObjectId;
  /** `Post._id` stored as a string. One document per post. */
  postId: string;
  /** Newest first. */
  comments: Types.DocumentArray<CommentEntry>;
}

const commentEntrySchema = new Schema<CommentEntry>({
  user: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

const commentSchema = new Schema<CommentsDoc>({
  postId: { type: String, required: true, index: true },
  comments: { type: [commentEntrySchema], default: [], required: true },
});

// Model name kept as 'comment' so the collection stays `comments`.
export const Comments: Model<CommentsDoc> = model<CommentsDoc>('comment', commentSchema);
export default Comments;
