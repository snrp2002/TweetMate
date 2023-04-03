import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true
    },
    tags: [String],
    likes: {
        type: [String],
        default: [],
        required: true
    },
    commentCount: {
        type: Number,
        default: 0,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        required: true
    }
});

const Post = mongoose.model('Post', postSchema);
export default Post;