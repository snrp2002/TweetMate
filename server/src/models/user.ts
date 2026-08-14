import { Schema, model, type Model, type Types } from 'mongoose';

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  /** Ids of this user's posts, newest first. */
  posts: string[];
  /** bcrypt hash. Absent for accounts created through Google. */
  password?: string;
  image?: string;
  bio: string;
}

const userSchema = new Schema<UserDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  posts: { type: [String], default: [], required: true },
  password: { type: String },
  image: { type: String },
  bio: { type: String, default: '----', required: true },
});

export const User: Model<UserDoc> = model<UserDoc>('User', userSchema);
export default User;
