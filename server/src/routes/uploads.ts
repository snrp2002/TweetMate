import { Router } from 'express';
import { signUpload, uploadConfig } from '../controllers/uploads.js';
import { auth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const uploadsRouter = Router();

uploadsRouter.get('/config', uploadConfig);

// Runs after `auth` so the limit is per account, not per IP. Each signature is
// a licence to write an object to our Cloudinary bucket, so this is the cap on
// how fast one account can consume the storage allowance.
uploadsRouter.post(
  '/sign',
  auth,
  rateLimit({
    name: 'upload-sign',
    max: 40,
    windowMs: 60 * 60 * 1000,
    message: 'You are uploading very quickly. Try again in a little while.',
  }),
  signUpload,
);

export default uploadsRouter;
