import { Router } from 'express';
import { createPost, deletePost, editPost, getPost, getPosts, likePost } from '../controllers/posts.js';
import { auth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const postsRouter = Router();

const writeLimit = rateLimit({ name: 'post-write', max: 60, windowMs: 60 * 60 * 1000 });

postsRouter.get('/', getPosts);
postsRouter.get('/post/:id', getPost);
postsRouter.post('/', auth, writeLimit, createPost);
postsRouter.post('/likePost/:id', auth, likePost);
postsRouter.delete('/:id', auth, deletePost);
postsRouter.patch('/', auth, writeLimit, editPost);

export default postsRouter;
