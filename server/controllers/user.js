import User from "../models/user.js";
export const showProfile = async(req, res) => {
    const userId = req.params.userId;
    try{
        const user = await User.findOne({_id: userId});
        res.status(200).json(user);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
export const editUser = async(req, res) => {
    const data = req.body;
    try{
        const user = await User.findOne({_id: req.userId});
        if(!user){
            res.status(404).json({message: 'User not found!!'});
            return;
        }
        user.image = data.image;
        user.bio = data.bio;
        const updatedUser = await User.findOneAndUpdate({_id: data._id}, user, {new: true});
        res.status(200).json({_id: updatedUser._id, bio: updatedUser.bio, image: updatedUser.image});
    }catch(error){
        res.status(400).json({message: 'Something went wrong!!'});
    }
}