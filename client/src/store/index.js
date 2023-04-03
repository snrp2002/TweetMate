import {applyMiddleware, combineReducers, createStore, compose} from 'redux';
import posts from '../reducers/posts.js';
import postForm from '../reducers/postForm.js';
import auth from '../reducers/auth.js';
import thunk from 'redux-thunk';
const reducers = combineReducers({
    posts,
    postForm,
    auth
});
const store = createStore(reducers, compose(applyMiddleware(thunk)));
export default store;