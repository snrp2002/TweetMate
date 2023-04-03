import express from 'express';
import {getComments, addComments} from '../controllers/comments.js'

const commentRouter = express.Router();

commentRouter.get('/:postId', getComments);
commentRouter.post('/', addComments);

export default commentRouter;