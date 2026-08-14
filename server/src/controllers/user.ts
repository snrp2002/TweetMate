import type { RequestHandler } from 'express';
import { User } from '../models/user.js';
import { errorMessage } from '../lib/serialize.js';
import type { EditUserBody, UserProfileResponse } from '../types/api.js';

function toProfile(user: {
  _id: unknown;
  name: string;
  email: string;
  posts: string[];
  image?: string | undefined;
  bio: string;
}): UserProfileResponse {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    posts: user.posts,
    ...(user.image ? { image: user.image } : {}),
    bio: user.bio,
  };
}

export const showProfile: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  try {
    // `select` keeps the bcrypt hash out of the response.
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      res.status(404).json({ message: 'User not found!!' });
      return;
    }
    res.status(200).json(toProfile(user));
  } catch (error) {
    res.status(404).json({ message: errorMessage(error) });
  }
};

export const editUser: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  const data = req.body as EditUserBody;

  try {
    // The signed-in user is both the subject and the target of the update;
    // `data._id` is deliberately ignored.
    const user = await User.findByIdAndUpdate(
      userId,
      { bio: data.bio, image: data.image },
      { returnDocument: 'after' },
    )
      .select('-password')
      .lean();

    if (!user) {
      res.status(404).json({ message: 'User not found!!' });
      return;
    }

    res.status(200).json({
      _id: String(user._id),
      bio: user.bio,
      ...(user.image ? { image: user.image } : {}),
    });
  } catch {
    res.status(400).json({ message: 'Something went wrong!!' });
  }
};
