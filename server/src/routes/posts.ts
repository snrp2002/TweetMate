import { Router } from 'express';
import { createPost, deletePost, editPost, getPost, getPosts, likePost } from '../controllers/posts.js';
import { auth } from '../middleware/auth.js';

const postsRouter = Router();

postsRouter.get('/', getPosts);
postsRouter.get('/post/:id', getPost);
postsRouter.post('/', auth, createPost);
postsRouter.post('/likePost/:id', auth, likePost);
postsRouter.delete('/:id', auth, deletePost);
postsRouter.patch('/', auth, editPost);

export default postsRouter;
