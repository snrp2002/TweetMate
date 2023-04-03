import { Modal, Overlay } from "../../UI/Modal";
import Image from "../../UI/Form/Image";
import Input from "../../UI/Form/Input";
import ReactDOM from "react-dom";
import classes from "./EditProfile.module.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, ButtonAlt } from "../../UI/Form/Button";
import { editUser } from "../../../actions/user";
import {Notification} from "../../UI/Popups";
const EditProfile = (props) => {
  const dispatch = useDispatch();
  const authData = useSelector((state) => state.auth.authData);
  const { showModal, setShowModal } = props;
  const [userData, setUserData] = useState({
    bio: authData.user.bio,
    image: authData.user.image,
  });
  const editProfileHandler = (event) => {
    event.preventDefault();
    dispatch(editUser({...userData, _id: authData.user._id}));
    Notification.fire({
      icon: 'success',
      text: 'Profile Edited!'
    })
    setShowModal(false);
  } 
  return (
    <>
      {showModal &&
        ReactDOM.createPortal(
          <Overlay setShowModal={setShowModal} className={classes.overlay} />,
          document.getElementById("overlay-root")
        )}
      {showModal &&
        ReactDOM.createPortal(
          <Modal setShowModal={setShowModal} className={classes.modal}>
            <form onSubmit={editProfileHandler}>
              <Input>
                <label htmlFor="bio">Bio*</label>
                <textarea
                  type="text"
                  id="bio"
                  name="bio"
                  value={userData.bio}
                  onChange={(event) =>
                    setUserData({ ...userData, bio: event.target.value })
                  }
                  required
                  style={{height: '50px'}}
                />
              </Input>
              <Image
                value={userData.image}
                onDone={(base64) => setUserData({ ...userData, image: base64 })}
              />
              <Button type="submit">Submit</Button>
              <ButtonAlt type="Button" onClick={() => setShowModal(false)}>
                Cancel
              </ButtonAlt>
            </form>
          </Modal>,
          document.getElementById("modal-root")
        )}
    </>
  );
};
export default EditProfile;
