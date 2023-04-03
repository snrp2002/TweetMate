import classes from "./User.module.css";
import profileImage from "../../images/profile.png";
import editImage from "../../images/edit.png";
import EditProfile from "./EditProfile/EditProfile";
import { useState } from "react";
import { useSelector } from "react-redux";
const User = (props) => {
  const authData = useSelector((state) => state.auth.authData);
  const [showModal, setShowModal] = useState(false);
  const editProfileHandler = () => {
    setShowModal(true);
  };
  return (
    <>
      <div className={classes.user}>
        <div className={classes.userPhoto}>
          <img src={props.user.image || profileImage} alt="dp" />
        </div>
        <div className={classes.userInfo}>
          <div className={classes.userName}>
            {props.user.name}
            {authData && props.user._id === authData.user._id && (
              <div className={classes.edit} onClick={editProfileHandler}>
                <img src={editImage} alt="edit" height="20px" />
              </div>
            )}
          </div>
          <div className={classes.userPosts}>
            {props.user.posts.length}&nbsp;&nbsp;posts
          </div>
          <div className={classes.userBio}>{props.user.bio.split('\n').map(str => <p key={Math.random()}>{str}</p>)}</div>
        </div>
      </div>
      {authData && props.user._id === authData.user._id && (
        <EditProfile setShowModal={setShowModal} showModal={showModal} />
      )}
    </>
  );
};
export default User;
