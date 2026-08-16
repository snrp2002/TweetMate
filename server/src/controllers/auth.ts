import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { User } from '../models/user.js';
import { env } from '../config/env.js';
import { errorMessage } from '../lib/serialize.js';
import { verifyGoogleAccessToken } from '../lib/google.js';
import { isMailConfigured, resetEmail, sendMail } from '../lib/mail.js';
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

/**
 * Signs in with Google, creating the account on first use.
 *
 * Google has already established who the caller is, so there is no meaningful
 * sign-in/sign-up distinction: splitting the two only produced dead ends —
 * "User not found!!" for a new user on the sign-in tab, and "User already
 * exists!!" for a returning user on the sign-up tab.
 */
async function authenticateWithGoogle(accessToken: unknown): Promise<AuthResponse> {
  // Identity comes from Google, never from the request body.
  const identity = await verifyGoogleAccessToken(accessToken);

  const existing = await User.findOne({ email: identity.email });
  if (existing) {
    // Backfill the avatar for accounts that never had one.
    if (!existing.image && identity.picture) {
      existing.image = identity.picture;
      await existing.save();
    }
    return authResponse(existing);
  }

  const created = await User.create({
    name: identity.name ?? identity.email.split('@')[0],
    email: identity.email,
    ...(identity.picture ? { image: identity.picture } : {}),
  });
  return authResponse(created);
}

export const signIn: RequestHandler = async (req, res) => {
  const data = req.body as SignInBody;

  try {
    if (data.google) {
      res.status(200).json(await authenticateWithGoogle(data.accessToken));
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
      // Same upsert as sign-in: Google has already proven who this is.
      res.status(200).json(await authenticateWithGoogle(data.accessToken));
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

/* --- Password reset ------------------------------------------------------ */

const RESET_TTL_MINUTES = 30;

/** Only the hash is ever stored, so the database alone cannot reset anyone. */
function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Starts a password reset.
 *
 * This used to answer 200 for every address to avoid confirming which ones
 * have accounts. That protected nothing: `signIn` already replies "User not
 * found!!" for an unknown address and "Please log in via google!!" for a known
 * one, so existence is freely readable two endpoints away. All the vagueness
 * did was leave people staring at an inbox that would never receive anything.
 * The real defence here is the rate limit, not the wording.
 */
export const forgotPassword: RequestHandler = async (req, res) => {
  const email = (req.body as { email?: string }).email?.trim().toLowerCase();

  if (!email) {
    res.status(400).json({ message: 'Enter your email address.' });
    return;
  }

  if (!isMailConfigured()) {
    res.status(503).json({ message: 'Password reset is not available on this server.' });
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'There is no account for that address.' });
      return;
    }

    // A Google account has no password yet. Sending the link anyway turns a
    // dead end into the way to add one — afterwards either method works.
    const creating = !user.password;

    const token = randomBytes(32).toString('hex');
    user.resetTokenHash = hashResetToken(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
    await user.save();

    const link = `${env.clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const { subject, text, html } = resetEmail(
      user.name,
      link,
      RESET_TTL_MINUTES,
      creating ? 'create' : 'reset',
    );

    try {
      await sendMail({ to: email, subject, text, html });
    } catch (mailError) {
      // Do not strand a token that was never delivered.
      user.resetTokenHash = undefined;
      user.resetTokenExpires = undefined;
      await user.save();
      throw mailError;
    }

    res.status(200).json({
      message: creating
        ? 'That account signs in with Google. We have sent a link so you can add a password.'
        : 'A reset link is on its way. It expires in 30 minutes.',
      creating,
    });
  } catch (error) {
    res.status(500).json({ message: errorMessage(error) });
  }
};

/** Completes a reset. The token is single-use and time-limited. */
export const resetPassword: RequestHandler = async (req, res) => {
  const { token, email, password, confirmPassword } = req.body as {
    token?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!token || !email || !password) {
    res.status(400).json({ message: 'That reset link is incomplete.' });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ message: "Passwords don't match." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: 'Use at least 6 characters.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      '+resetTokenHash +resetTokenExpires',
    );

    const valid =
      user?.resetTokenHash &&
      user.resetTokenExpires &&
      user.resetTokenExpires.getTime() > Date.now() &&
      timingSafeEqualHex(user.resetTokenHash, hashResetToken(token));

    if (!user || !valid) {
      res.status(400).json({ message: 'That reset link is invalid or has expired.' });
      return;
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    user.password = await bcrypt.hash(password, salt);
    // Burn the token so the link cannot be replayed.
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json(authResponse(user));
  } catch (error) {
    res.status(400).json({ message: errorMessage(error) });
  }
};

/** Constant-time compare of two hex digests of equal length. */
function timingSafeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
