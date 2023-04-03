import classes from "./Post.module.css";
import moment from "moment";
import timeImage from "../../images/time.png";
import profile from "../../images/profile.png";
import moreImage from "../../images/more.png";
import likedImage from "../../images/liked.png";
import likeImage from "../../images/like.png";
import commentImage from "../../images/comment.png";
import shareImage from "../../images/share.png";
import { useDispatch, useSelector } from "react-redux";
import { getComments, likePost } from "../../actions/posts";
import { useState } from "react";
import PostModal from "./PostModal";
import { useNavigate } from "react-router-dom";
import Comments from "./comments/Comments";
import { WhatsappShareButton } from "react-share";
import { Notification } from "../UI/Popups";

const Post = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const authData = useSelector((state) => state.auth.authData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const showProfileHandler = () => {
    navigate(`/user/${props.post.creator}`);
  };
  const showModalHandler = () => {
    setShowModal(true);
  };
  const likePostHandler = () => {
    if(!authData){
      Notification.fire({
        icon: 'warning',
        text: 'Login to like the post!'
      })
    }else{
      dispatch(likePost(props.post._id));
    }
  };
  const commentPostHandler = () => {
    dispatch(getComments(props.post._id));
    setShowComments((state) => !state);
  };
  const sharePostHandler = () => {
    document.getElementById("share").click();
  };
  const tags = props.post.tags.map((tag) => tag !== "" && "#" + tag + " ");
  const like =
    authData && props.post.likes.includes(authData.user._id) ? (
      <img src={likedImage} alt="like" />
    ) : (
      <img src={likeImage} alt="like" />
    );

  return (
    <>
      <div className={classes.post}>
        <div className={classes.header}>
          <div className={classes.profile}>
            <div className={classes.profileImage}>
              <img
                src={props.post.userImage || profile}
                alt="profile"
                onClick={showProfileHandler}
              />
            </div>
            <div className={classes.headerInfo}>
              <div className={classes.creator} onClick={showProfileHandler}>
                {props.post.userName}
              </div>
              <div className={classes.time}>
                <img
                  src={timeImage}
                  style={{ marginRight: "5px", height: "12px" }}
                  alt="time"
                />
                {moment(props.post.createdAt).fromNow()}
              </div>
            </div>
          </div>
          {
            <div className={classes.more} onClick={showModalHandler}>
              <img src={moreImage} alt="edit" height="20px" />
            </div>
          }
        </div>
        {tags[0] && <div className={classes.tags}>{tags}</div>}
        {props.post.image && (
          <div className={classes.poster}>
            <img src={props.post.image} alt="post" />
          </div>
        )}
        <div className={classes.content}>
          <div className={classes.message}>
            {props.post.message.split("\n").map((str) => (
              <p key={Math.random()}>{str}</p>
            ))}
          </div>
          <div className={classes.action}>
            <div
              className={classes.actionButton}
              onClick={likePostHandler}
            >
              {like}
              {props.post.likes.length}
            </div>
            <div
              className={classes.actionButton}
              onClick={commentPostHandler}
            >
              <img src={commentImage} alt="comment" />
              {props.post.commentCount}
            </div>
            <div className={classes.actionButton} onClick={sharePostHandler}>
              <WhatsappShareButton
                id="share"
                url={`http://localhost:3000/post/${props.post._id}`}
                title={`Check out this TweetMate Post by ${props.post.userName} : `}
                style={{ margin: 0 }}
              >
                <img src={shareImage} alt="share" />
              </WhatsappShareButton>
            </div>
          </div>
          {showComments && <Comments post={props.post} />}
        </div>
      </div>
      <PostModal
        showModal={showModal}
        setShowModal={setShowModal}
        post={props.post}
      />
    </>
  );
};
export default Post;
