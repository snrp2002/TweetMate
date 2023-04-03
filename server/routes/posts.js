import express from 'express';
import {getPosts, createPost, deletePost, editPost, likePost, getPost} from '../controllers/posts.js'
import auth from '../middleware/auth.js';
const postsRouter = express.Router();

postsRouter.get('/', getPosts);
postsRouter.get('/post/:id', getPost);
postsRouter.post('/', auth, createPost);
postsRouter.post('/likePost/:id', auth, likePost);
postsRouter.delete('/:id', auth, deletePost);
postsRouter.patch('/', auth, editPost);
export default postsRouter;