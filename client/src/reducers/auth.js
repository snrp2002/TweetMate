import { AUTH, EDITUSER, LOGOUT } from "../constants/actionTypes"

const auth = (state = {authData: JSON.parse(localStorage.getItem('user')) }, action) => {
    if(action.type === AUTH){
        localStorage.setItem('user', JSON.stringify(action.payload));
        return {authData: action.payload};
    }
    if(action.type === LOGOUT){
        localStorage.clear();
        return {authData: null};
    }
    if(action.type === EDITUSER){
        const authData = {...state.authData, user: action.payload};
        localStorage.setItem('user', JSON.stringify(authData));
        return {authData: authData};
    }
    return state;
}
export default auth;
