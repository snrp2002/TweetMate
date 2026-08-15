import { Router } from 'express';
import { forgotPassword, resetPassword, signIn, signUp } from '../controllers/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const authRouter = Router();

// Keyed by IP, since nobody is authenticated yet. These are the endpoints an
// attacker would hammer: credential stuffing on signin, and using forgot as a
// free way to send mail from our domain.
//
// Signup is deliberately generous: a university or office NAT puts many
// legitimate people behind one address, and locking them out is worse than
// the abuse this stops.
authRouter.post(
  '/signup',
  rateLimit({ name: 'signup', max: 30, windowMs: 60 * 60 * 1000 }),
  signUp,
);
authRouter.post(
  '/signin',
  rateLimit({
    name: 'signin',
    max: 20,
    windowMs: 15 * 60 * 1000,
    message: 'Too many sign-in attempts. Try again shortly.',
  }),
  signIn,
);
authRouter.post(
  '/forgot',
  rateLimit({ name: 'forgot', max: 5, windowMs: 60 * 60 * 1000 }),
  forgotPassword,
);
authRouter.post(
  '/reset',
  rateLimit({ name: 'reset', max: 10, windowMs: 60 * 60 * 1000 }),
  resetPassword,
);

export default authRouter;
