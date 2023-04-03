import axios from 'axios';
import decode from 'jwt-decode';
import { COMMENT, CREATE, DELETE, FETCH_ALL, UPDATE } from '../constants/actionTypes';

const API = axios.create({baseURL: "https://tweetmate.onrender.com"});

API.interceptors.request.use((req) => {
    if(localStorage.getItem('user')){
        const token = JSON.parse(localStorage.getItem('user')).token; 
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
}) 
const check = (dispatch) => {
    if(localStorage.getItem('user')){
        const token = JSON.parse(localStorage.getItem('user')).token;
        const decodedToken = decode(token);
        if((decodedToken.exp * 1000) < (new Date().getTime())) {
            dispatch({type: 'LOGOUT'});
            return true;
        }else{
            return false;
        }
    }
    return false;
}

export const getPosts = () => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
    }
    try{
        const {data} = await API.get('/posts');
        dispatch({type: FETCH_ALL, payload: data});
    }catch(error){
        console.log(error.message);
    }
}
export const createPost = (post) => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
        return;
    }
    try{
        const {data} = await API.post('/posts', post);
        dispatch({type: CREATE, payload: data});
    }catch(error){
        console.log(error.message);
    }
}
export const deletePost = (postId) => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
        return;
    }
    try{
        await API.delete(`/posts/${postId}`);
        dispatch({type: DELETE, payload: postId});
    }catch(error){
        console.log(error.message);
    }
}
export const editPost = (post) => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
        return;
    }
    try{
        const {data} = await API.patch('/posts', post);
        dispatch({type: UPDATE, payload: data});
    }catch(error){
        console.log(error.message);
    }
}

export const likePost = (postId) => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
        return;
    }
    try{
        const {data} = await API.post(`/posts/likePost/${postId}`);
        dispatch({type: UPDATE, payload: data});
    }catch(error){
        console.log(error.message);
    }
}
export const addComments = (comment) => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
        return;
    }
    try{
        const {data} = await API.post(`/comments`, comment);
        dispatch({type: COMMENT, payload: data});
    }catch(error){
        console.log(error.message);
    }
}
export const getComments = (postId) => async(dispatch) => {
    if(check(dispatch)){
        console.log('token expired');
        return;
    }
    try{
        const {data} = await API.get(`/comments/${postId}`);
        dispatch({type: COMMENT, payload: data});
    }catch(error){
        console.log(error.message);
    }
}