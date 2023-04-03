import { EDIT, INITIAL, UPGRADE } from "../constants/actionTypes";

const initialState = {method: 'POST', data: {message: '', tags: '', image: ''}};
const postForm = (state=initialState, action) => {
    if(action.type === EDIT){
        return {method: 'PATCH', data:{...action.payload}};
    }
    if(action.type === UPGRADE){
        return {method: action.payload.method, data: {...action.payload.data}};
    }
    if(action.type === INITIAL){
        return initialState;
    }
    return state;
}
export default postForm;