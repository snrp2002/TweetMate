import classes from "./Comments.module.css";
import Input from "../../UI/Form/Input";
import { useState } from "react";
import {useDispatch, useSelector} from "react-redux";
import Comment from "./Comment";
import { addComments } from "../../../actions/posts";
const Comments = (props) => {
  const dispatch = useDispatch();
  const authData = useSelector((state) => state.auth.authData);
  const [comment, setComment] = useState('');
  const commentChangeHandler = (event) => {
    setComment(event.target.value);
  };
  const formSubmissionHandler = (event) =>{
    event.preventDefault();
    const newComment = {
      user: authData.user._id,
      comment: comment
    }
    dispatch(addComments({postId: props.post._id, comment: newComment}));
    setComment('');
  }
  return (
    <div className={classes.commentsContainer}>
      <form onSubmit={formSubmissionHandler}>
        <Input>
          <input
            type="text"
            id="comment"
            value={comment}
            onChange={commentChangeHandler}
            placeholder="Write a comment"
          />
        </Input>
      </form>
      {props.post.comments.map(comment => <Comment key={comment._id} comment={comment}/>)}
    </div>
  );
};
export default Comments;
