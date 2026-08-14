import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import postsRouter from './routes/posts.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import commentRouter from './routes/comments.js';

const BODY_LIMIT = '30mb';

export function createApp() {
  const app = express();

  // Base64 image payloads travel inside the JSON body, hence the large limit.
  // Express 5 ships these parsers, so `body-parser` is no longer a dependency.
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
  app.use(cors(env.corsOrigins ? { origin: env.corsOrigins } : undefined));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', db: mongoose.connection.readyState });
  });

  app.use('/posts', postsRouter);
  app.use('/auth', authRouter);
  app.use('/user', userRouter);
  app.use('/comments', commentRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  const onError: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!!' });
  };
  app.use(onError);

  return app;
}
