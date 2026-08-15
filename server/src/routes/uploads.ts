import { Router } from 'express';
import { signUpload, uploadConfig } from '../controllers/uploads.js';
import { auth } from '../middleware/auth.js';

const uploadsRouter = Router();

uploadsRouter.get('/config', uploadConfig);
uploadsRouter.post('/sign', auth, signUpload);

export default uploadsRouter;
