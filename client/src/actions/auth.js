import axios from 'axios';
import { AUTH } from '../constants/actionTypes';

const API = axios.create({baseURL:"https://tweetmate.onrender.com/auth"});

export const signUpAction = (formData, navigate) => async(dispatch) => {
    try{
        const response = await API.post('/signup', formData);
        dispatch({type: AUTH, payload: response.data});
        navigate('/', {state: {message: "Signed up successfully!"}});
    }catch(error){
        navigate('/auth', {state: {error: error.response.data.message}});
    }
}
export const signInAction = (formData, navigate) => async(dispatch) => {
    try{
        const response = await API.post('/signin', formData);
        dispatch({type: AUTH, payload: response.data});
        navigate('/', {state: {message: "Signed in successfully!"}});
    }catch(error){
        navigate('/auth', {state: {error: error.response.data.message}});
    }
}

