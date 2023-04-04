import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate} from "react-router-dom";
import { Button } from "../UI/Form/Button";
import Input from "../UI/Form/Input";
import classes from "./AuthForm.module.css";
import { useGoogleLogin } from "@react-oauth/google";
import googleImage from "../../images/google.png";
import { signInAction, signUpAction } from "../../actions/auth";
import axios from "axios";
import {Notification} from "../UI/Popups";

const InitialData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const AuthForm = (props) => {
  const [signUp, setSignUp] = useState(false);
  const [formData, setFormData] = useState(InitialData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const switchHandler = () => {
    setSignUp((value) => !value);
    setFormData(InitialData);
  };

  const onChangeHandler = (event) => {
    setFormData((data) => {
      return { ...data, [event.target.name]: event.target.value };
    });
  };

  const formSubmissionHandler = (event) => {
    event.preventDefault();
    for(const key in formData){
      if(signUp && formData[key].trim() ===  ""){
        Notification.fire({
          icon: 'error',
          text: `Enter valid ${key}!!`
        })
        return;
      }
      formData[key] = formData[key].trim();
    }
    if(signUp && formData.password !== formData.confirmPassword){
      Notification.fire({
        icon: 'error',
        text: 'Passwords do not match!!'
      })
      return;
    }
    props.setLoader(true);
    if (signUp) dispatch(signUpAction(formData, navigate));
    else dispatch(signInAction(formData, navigate));
    setFormData(InitialData);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      props.setLoader(true);
      const {data} = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      );
      if(data.email_verified){
        const userinfo = {email: data.email, name: data.name, image: data.picture, google: true}
        if (signUp) dispatch(signUpAction(userinfo, navigate));
        else dispatch(signInAction(userinfo, navigate));
      }else{
        console.log('Not authorized!!');
      }
    },
    onError: (errorResponse) => console.log(errorResponse),
  });

  return (
    <div className={classes.authForm}>
      <form onSubmit={formSubmissionHandler}>
        {signUp && (
          <>
            <div>
              <Input>
                <label htmlFor="firstName">First Name*</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={onChangeHandler}
                  required
                />
              </Input>
              <Input>
                <label htmlFor="lastName">Last Name*</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={onChangeHandler}
                  required
                />
              </Input>
            </div>
            <Input>
              <label htmlFor="email">Email Id*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onChangeHandler}
                required
              />
            </Input>
            <Input>
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={onChangeHandler}
                required
              />
            </Input>
            <Input>
              <label htmlFor="confirmPassword">Confirm Password*</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChangeHandler}
              />
            </Input>
          </>
        )}
        {!signUp && (
          <>
            <Input>
              <label htmlFor="email">Email Id*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onChangeHandler}
                required
              />
            </Input>
            <Input>
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                onChange={onChangeHandler}
                value={formData.password}
                name="password"
                required
              />
            </Input>
          </>
        )}
        <div className={classes.action}>
          <Button>{signUp ? "Sign Up" : "Sign In"}</Button>
        </div>
        <div className={classes.google}>
          <Button type="button" onClick={googleLogin}>
            <img src={googleImage} alt="google" />
            {signUp ? "Sign Up with Google" : "Sign In with Google"}
          </Button>
        </div>
        <div className={classes.switch} onClick={switchHandler}>
          {signUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </div>
      </form>
    </div>
  );
};
export default AuthForm;
