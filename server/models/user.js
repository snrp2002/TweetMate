import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    posts: {
        type: [String],
        default: [],
        required: true
    },
    password: {
        type: String
    },
    image: {
        type: String
    },
    bio: {
        type: String,
        default: '----',
        required: true
    }
});

const User = mongoose.model('User', userSchema);
export default User;