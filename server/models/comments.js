import mongoose from "mongoose";
const commentSchema = mongoose.Schema(
    {
        postId: {
            type: String,
            required: true
        },
        comments: {
            type: [
                {
                    user: {
                        type: String,
                        required: true
                    },
                    comment:{
                        type: String,
                        required: true
                    },
                    createdAt: {
                        type: Date,
                        required: true,
                        default: Date.now()
                    }
                }
            ],
            default: [],
            required: true
        },
    }
);
const Comments = mongoose.model('comment', commentSchema);
export default Comments;
