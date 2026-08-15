import { Router } from 'express';
import { addComments, deleteComment, getComments } from '../controllers/comments.js';
import { auth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const commentRouter = Router();

commentRouter.get('/:postId', getComments);
commentRouter.post(
  '/',
  auth,
  rateLimit({ name: 'comment-write', max: 120, windowMs: 60 * 60 * 1000 }),
  addComments,
);
commentRouter.delete('/:postId/:commentId', auth, deleteComment);

export default commentRouter;
