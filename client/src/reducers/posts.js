import { COMMENT, CREATE, DELETE, FETCH_ALL, UPDATE } from '../constants/actionTypes';
const posts = (state = [], action) => {
    if(action.type === FETCH_ALL){
        action.payload = action.payload.reverse();
        const posts = action.payload.map((post) => {return {...post, comments: []}});
        return posts;
    }
    if(action.type === CREATE){
        const post = {
            ...action.payload,
            comments: []
        }
        return [post, ...state];
    }
    if(action.type === DELETE){
        return state.filter(post => post._id !== action.payload);
    }
    if(action.type === UPDATE){
        return state.map(post => post._id === action.payload._id ? {...action.payload, comments: post.comments} : post);
    }
    if(action.type === COMMENT){
        return state.map((post) => {
            if(post._id === action.payload.postId){
                post.comments = action.payload.comments;
                post.commentCount = action.payload.comments.length;
            }
            return post;
        })
    }
    return state;
}
export default posts;