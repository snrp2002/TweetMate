import express from 'express';
import {showProfile, editUser} from '../controllers/user.js'
import auth from '../middleware/auth.js';
const userRouter = express.Router();

userRouter.get('/:userId', showProfile);
userRouter.patch('/editUser', auth, editUser);
export default userRouter;