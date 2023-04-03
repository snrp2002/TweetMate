import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import postsRouter from './routes/posts.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import commentRouter from './routes/comments.js';
dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({limit: '30mb',extended: true}));
app.use(bodyParser.json({limit: '30mb', extended: true}));
app.use(cors());
app.use('/posts', postsRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/comments', commentRouter);
const PORT = process.env.PORT || 5000;

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database...'));

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));