import { Modal, Overlay } from "../UI/Modal";
import { deletePost } from "../../actions/posts";
import { EDIT } from "../../constants/actionTypes";
import { useDispatch, useSelector } from "react-redux";
import classes from "./PostModal.module.css";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Confirm, Notification } from "../UI/Popups";
import { HashLink } from "react-router-hash-link";
import { useRef } from "react";

const PostModal = (props) => {
  const authData = useSelector((state) => state.auth.authData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const editRef = useRef(null);
  
  const deletePostHandler = () => {
    props.setShowModal(false);
    Confirm.fire({
      icon: 'question',
      title: '<h5 style="margin: 0;">Are you sure you want to delete this post?</h5>'
    }).then((result) => {
        if (result.isConfirmed) {     
          dispatch(deletePost(props.post._id));
          Notification.fire({
            icon: 'success',
            text: "Successfully Deleted!"
          });
          navigate('/');
        }
    });
  };

  const editPostHandler = (event) => {
    props.setShowModal(false);
    Confirm.fire({
      icon: 'question',
      title: '<h5 style="margin: 0;">Are you sure you want to edit this post?</h5>'
    }).then((result) => {
        if (result.isConfirmed) {
          editRef.current.click();     
          dispatch({ type: EDIT, payload: { ...props.post } });
        }
    });
  };
  const copyLinkHandler = () =>{
    navigator.clipboard.writeText(`https://souvik-tweetmate-91.netlify.app/post/${props.post._id}`);
    Notification.fire({
      icon: 'success',
      text: "Link copied!"
    });
    props.setShowModal(false);
  }
  const viewPostHandler = () => {
    props.setShowModal(false);
  }
  return (
    <>
      <HashLink to='/#newPost' ref={editRef}></HashLink>
      {props.showModal &&
        ReactDOM.createPortal(
          <Overlay setShowModal={props.setShowModal} className={classes.overlay}/>,
          document.getElementById("overlay-root")
        )}
      {props.showModal &&
        ReactDOM.createPortal(
          <Modal setShowModal={props.setShowModal} className={classes.modal}>
            <Link to={`/post/${props.post._id}`} onClick={viewPostHandler}>
              <div className={classes.modalContent}>
                View Post
              </div>
            </Link>
            
            {authData && authData.user._id === props.post.creator && 
            <div className={classes.modalContent} onClick={editPostHandler}>
              Edit Post
            </div>}
            <div className={classes.modalContent} onClick={copyLinkHandler}>
              Copy Link
            </div>
            {authData && authData.user._id === props.post.creator && (
              <div className={classes.modalContent} onClick={deletePostHandler}>
                Delete Post
              </div>
            )}
          </Modal>,
          document.getElementById("modal-root")
        )}
    </>
  );
};
export default PostModal;
