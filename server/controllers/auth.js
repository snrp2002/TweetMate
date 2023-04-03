import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signIn = async(req, res) => {
    const data = req.body;
    try{
        const user = await User.findOne({email: data.email});
        if(!user){
            res.status(404).json({message: 'User not found!!'});
            return;
        }
        if(data?.google){
            if(!user.image && data?.image) {
                user.image = data?.image;
                await User.findByIdAndUpdate(user._id, user, {new: true});
            }
        }else{
            if(!user.password){
                res.status(400).json({message: 'Please log in via google!!'});
                return;
            }
            const isPasswordCorrect = await bcrypt.compare(data.password, user.password);
            
            if(!isPasswordCorrect){
                res.status(400).json({message: 'Incorrect Password!!'});
                return;
            }
        }
        const token = jwt.sign({email: user.email, _id: user._id}, 'test', {expiresIn: '1hr'});    
        res.status(200).json({user: {_id: user._id, image: user.image, bio: user.bio}, token});
    }catch(error){
        res.status(400).json({message: 'Something went wrong!!'});
    }
}
export const signUp = async(req, res) => {
    const data = req.body;
    try{
        const user = await User.findOne({email: data.email});
        if(user){
            res.status(400).json({message: 'User already exists!!'});
            return;
        }
        let newUser;
        if(data?.google){
            newUser = await User.create({
                name: data.name,
                email: data.email,
                image: data.image
            });
        }else{
            if(data.password !== data.confirmPassword){
                res.status(400).json({message: 'Passwords do not match!!'});
                return;
            }
            const salt = await bcrypt.genSalt(12);
            const hashPassword = await bcrypt.hash(data.password, salt);
            newUser = await User.create({
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                password: hashPassword
            });
        }
        const token = jwt.sign({email: newUser.email, _id: newUser._id}, 'test', {expiresIn: '1hr'});
        res.status(200).json({user: {_id: newUser._id, image: newUser.image, bio: newUser.bio}, token});
    }catch(error){
        res.status(400).json({message: error.message});
    }
}