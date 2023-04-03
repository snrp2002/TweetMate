import axios from 'axios';
import { EDITUSER } from '../constants/actionTypes';
import decode from 'jwt-decode';

const API = axios.create({baseURL:"https://tweetmate.onrender.com/user"});
API.interceptors.request.use((req) => {
    if(localStorage.getItem('user')){
        const token = JSON.parse(localStorage.getItem('user')).token; 
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});
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
export const editUser = (userData) => async(dispatch) => {
    if(check(dispatch)){
        console.log('Token Expired.');
        return;
    }
    try{
        const response = await API.patch('/editUser', userData);
        dispatch({type: EDITUSER, payload: response.data});
    }catch(error){
        console.log(error.message);
    }
}