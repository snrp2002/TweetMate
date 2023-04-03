import Comments from "../models/comments.js";
import User from "../models/user.js";
import Post from "../models/posts.js";
export const getComments = async(req, res) => {
    const postId = req.params.postId;
    try{
        const comments = await Comments.findOne({postId: postId}).lean();
        comments.comments = await Promise.all(comments.comments.map(async (comment) => {
            const commenter = await User.findOne({ _id: comment.user }).lean();
            return {... comment, name: commenter.name, image: commenter.image}
        }));
        res.status(200).json({...comments});
    }
    catch(error){
        res.status(400).json({message: 'Something went wrong!!'});
    }
}
export const addComments = async(req, res) => {
    const postId = req.body.postId;
    const newComment = {
        ...req.body.comment,
        createdAt: Date.now()
    }
    try{
        const postComments = await Comments.findOne({postId: postId}).lean();
        postComments.comments.unshift(newComment);
        const updatedPostComments = await Comments.findOneAndUpdate({postId: postId}, postComments, {new: true}).lean();
        updatedPostComments.comments = await Promise.all(updatedPostComments.comments.map(async (comment) => {
            const commenter = await User.findOne({ _id: comment.user }).lean();
            return {... comment, name: commenter.name, image: commenter.image}
        }));
        await Post.updateOne({_id: postId}, {$inc: {commentCount: 1}}, {new: true});
        res.status(200).json({...updatedPostComments});
    }
    catch(error){
        res.status(400).json({message: 'Something went wrong!!'});
    }
}