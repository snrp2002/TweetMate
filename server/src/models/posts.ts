import { Schema, model, type Model, type Types } from 'mongoose';

export interface PostDoc {
  _id: Types.ObjectId;
  message: string;
  /** `User._id` stored as a string. */
  creator: string;
  image: string;
  tags: string[];
  /** Ids of users who liked this post. Presence means "liked". */
  likes: string[];
  commentCount: number;
  createdAt: Date;
}

const postSchema = new Schema<PostDoc>({
  message: { type: String, required: true },
  creator: { type: String, required: true },
  image: { type: String, required: true },
  tags: { type: [String], default: [] },
  likes: { type: [String], default: [], required: true },
  commentCount: { type: Number, default: 0, required: true },
  // `Date.now` (the function) — not `Date.now()`, which would freeze the
  // default to the moment this module was first evaluated.
  createdAt: { type: Date, default: Date.now, required: true },
});

export const Post: Model<PostDoc> = model<PostDoc>('Post', postSchema);
export default Post;
