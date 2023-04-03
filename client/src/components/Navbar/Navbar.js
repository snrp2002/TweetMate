import ReactDOM from "react-dom";
import classes from "./Navbar.module.css";
import logoImage from "../../images/brandLogo.png";
import homeImage from "../../images/home.png";
import profileImage from "../../images/profile.png";
import newPostImage from "../../images/newPost.png";
import logoutImage from "../../images/logout.png";
import { Modal, Overlay } from "../UI/Modal";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LOGOUT } from "../../constants/actionTypes";
import { Notification } from "../UI/Popups";
import {HashLink} from "react-router-hash-link";
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authData = useSelector((state) => state.auth.authData);
  const [showModal, setShowModal] = useState(false);
  const profileModalHandler = () => {
    setShowModal((value) => !value);
  };
  const logoutHandler = (event) => {
    dispatch({ type: LOGOUT });
    Notification.fire({
      icon: 'success',
      text: 'Logged Out successfully!'
    });
    setShowModal(false);
    navigate("/");
  };

  const showProfileHandler = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className={classes.navbar}>
        <Link to="" className={classes.brandName}>
          <img src={logoImage} alt="brand-logo" />
          TweetMate
        </Link>
        <div className={classes.navOptions}>
          <HashLink smooth to={'/#newPost'} className={classes.option}>
            <img src={newPostImage} alt="add"/>
          </HashLink>
          <Link to="/" className={classes.option}>
            <img src={homeImage} alt="home" />
          </Link>
          {authData && (
            <div className={classes.profile}>
              <img
                src={authData.user.image || profileImage}
                alt="profile"
                onClick={profileModalHandler}
              />
            </div>
          )}
          {!authData && (
            <Link to="/auth" className={classes.auth}>
              Sign&nbsp;In
            </Link>
          )}
        </div>
      </div>
      {showModal &&
        ReactDOM.createPortal(
          <Overlay setShowModal={setShowModal} />,
          document.getElementById("overlay-root")
        )}
      {showModal &&
        ReactDOM.createPortal(
          <Modal setShowModal={setShowModal} className={classes.modal}>
            <Link to={`/user/${authData.user._id}`}>
              <div className={classes.modalContent} onClick={showProfileHandler}>
                <img src={profileImage} alt="user" />
                Your Profile
              </div>
            </Link>
            <div className={classes.modalContent} onClick={logoutHandler}>
              <img src={logoutImage} alt="logout" />
              Logout
            </div>
          </Modal>,
          document.getElementById("modal-root")
        )}
    </>
  );
};
export default Navbar;
