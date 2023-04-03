import classes from "./UserPost.module.css";
import axios from "axios";
import { useEffect, useState } from "react";
import commentImage from "../../images/chat.png";
import likeImage from "../../images/heart.png";
import { useNavigate } from "react-router-dom";
import Loader from "../UI/Loader";
const UserPost = (props) => {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [show, setShow] = useState(false);
  const postId = props.postId;
  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "http://localhost:5000/posts/post/" + postId
      );
      setPost(response.data);
    };
    fetchData();
  }, [postId]);
  const viewPostHandler = () => {
    navigate(`/post/${post._id}`);
  }
  return ( 
    <div className={classes.userPost} onMouseEnter={() => setShow(true)}onMouseLeave={() => setShow(false)}>
      {post 
      ?<>
        <div className={classes.postImage}>
          <img src={post.image} alt="postImage" />
        </div>
        {show &&
        <div className={classes.postElements} onClick={viewPostHandler}>
          <div className={classes.postElement}>
            <img src={likeImage} alt="like" /> {post.likes.length}
          </div>
          <div className={classes.postElement}>
            <img src={commentImage} alt="comment" /> {post.commentCount}
          </div>
        </div>}
      </>
      :<Loader/>}
    </div>
  )
};
export default UserPost;
