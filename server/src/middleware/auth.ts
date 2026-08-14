import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  email: string;
  _id: string;
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the bearer token and attaches `req.userId`.
 *
 * Any failure — missing header, malformed header, bad signature, expired
 * token — results in a 401.
 */
export const auth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ message: 'Not Logged In!' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(BEARER_PREFIX.length), env.jwtSecret) as TokenPayload;
    req.userId = payload._id;
    next();
  } catch {
    res.status(401).json({ message: 'Not Logged In!' });
  }
};

export default auth;
