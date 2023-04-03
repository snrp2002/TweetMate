import classes from "./Auth.module.css";
import AuthForm from "./AuthForm";
import {Notification} from '../UI/Popups';
import { useNavigate, useLocation } from "react-router-dom";
import Loader from '../UI/Loader';
import { useState } from "react";
const Auth = () => {
  const [loader, setLoader] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  if(location.state){
    Notification.fire({
      icon: 'error',
      text: location.state.error
    }).then(()=>{
      navigate({state: null});
      setLoader(false);
    })
  }
  
  return (
    loader ? <Loader/>
    :<div className={classes.auth}>
      <AuthForm setLoader={setLoader}/>
    </div>
  );
};
export default Auth;
