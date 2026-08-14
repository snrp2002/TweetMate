import { Router } from 'express';
import { editUser, showProfile } from '../controllers/user.js';
import { auth } from '../middleware/auth.js';

const userRouter = Router();

userRouter.patch('/editUser', auth, editUser);
userRouter.get('/:userId', showProfile);

export default userRouter;
