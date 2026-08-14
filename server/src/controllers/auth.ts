import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import { env } from '../config/env.js';
import { errorMessage } from '../lib/serialize.js';
import { verifyGoogleAccessToken } from '../lib/google.js';
import type { AuthResponse, SignInBody, SignUpBody } from '../types/api.js';
import type { TokenPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

function issueToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '1h' });
}

function authResponse(user: {
  _id: unknown;
  image?: string | undefined;
  bio: string;
  email: string;
}): AuthResponse {
  return {
    user: {
      _id: String(user._id),
      ...(user.image ? { image: user.image } : {}),
      bio: user.bio,
    },
    token: issueToken({ email: user.email, _id: String(user._id) }),
  };
}

export const signIn: RequestHandler = async (req, res) => {
  const data = req.body as SignInBody;

  try {
    if (data.google) {
      // Identity comes from Google, never from the request body.
      const identity = await verifyGoogleAccessToken(data.accessToken);

      const user = await User.findOne({ email: identity.email });
      if (!user) {
        res.status(404).json({ message: 'User not found!!' });
        return;
      }

      // Backfill the avatar for accounts that never had one.
      if (!user.image && identity.picture) {
        user.image = identity.picture;
        await user.save();
      }

      res.status(200).json(authResponse(user));
      return;
    }

    const user = await User.findOne({ email: data.email });
    if (!user) {
      res.status(404).json({ message: 'User not found!!' });
      return;
    }
    if (!user.password) {
      res.status(400).json({ message: 'Please log in via google!!' });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(data.password, user.password);
    if (!isPasswordCorrect) {
      res.status(400).json({ message: 'Incorrect Password!!' });
      return;
    }

    res.status(200).json(authResponse(user));
  } catch (error) {
    res.status(400).json({ message: errorMessage(error) });
  }
};

export const signUp: RequestHandler = async (req, res) => {
  const data = req.body as SignUpBody;

  try {
    if (data.google) {
      const identity = await verifyGoogleAccessToken(data.accessToken);

      const existing = await User.findOne({ email: identity.email });
      if (existing) {
        res.status(400).json({ message: 'User already exists!!' });
        return;
      }

      const newUser = await User.create({
        name: identity.name ?? identity.email.split('@')[0],
        email: identity.email,
        ...(identity.picture ? { image: identity.picture } : {}),
      });

      res.status(200).json(authResponse(newUser));
      return;
    }

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      res.status(400).json({ message: 'User already exists!!' });
      return;
    }

    if (data.password !== data.confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match!!' });
      return;
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const newUser = await User.create({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: await bcrypt.hash(data.password, salt),
    });

    res.status(200).json(authResponse(newUser));
  } catch (error) {
    res.status(400).json({ message: errorMessage(error) });
  }
};
