import { Router } from 'express';
import { addComments, getComments } from '../controllers/comments.js';
import { auth } from '../middleware/auth.js';

const commentRouter = Router();

commentRouter.get('/:postId', getComments);
commentRouter.post('/', auth, addComments);

export default commentRouter;
