import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `auth` middleware after a JWT has been verified. */
      userId?: string;
    }
  }
}

export {};
