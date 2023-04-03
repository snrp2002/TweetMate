import axios from 'axios';
import { AUTH } from '../constants/actionTypes';

const API = axios.create({baseURL:"http://localhost:5000/auth"});

export const signUpAction = (formData, navigate) => async(dispatch) => {
    try{
        const response = await API.post('/signup', formData);
        dispatch({type: AUTH, payload: response.data});
        navigate('/');
    }catch(error){
        console.log("Sign up error");
        console.log(error.message);
    }
}
export const signInAction = (formData, navigate) => async(dispatch) => {
    try{
        const response = await API.post('/signin', formData);
        dispatch({type: AUTH, payload: response.data});
        navigate('/');
    }catch(error){
        console.log("Sign in error");
        console.log(error.message);
    }
}

