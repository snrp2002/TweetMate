import classes from "./PostForm.module.css";
import Image from "../../UI/Form/Image";
import { useDispatch } from "react-redux";
import { createPost, editPost } from "../../../actions/posts";
import { useSelector } from "react-redux";
import { INITIAL, UPGRADE } from "../../../constants/actionTypes";
import Input from "../../UI/Form/Input";
import { Button, ButtonAlt } from "../../UI/Form/Button";
import { Notification } from "../../UI/Popups";

const PostForm = (props) => {
  const dispatch = useDispatch();
  const method = useSelector((state) => state.postForm.method);
  const postData = useSelector((state) => state.postForm.data);

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if(postData.message.trim() === '' || postData.image === ''){
      const field = postData.message.trim() === '' ? 'Caption' : 'Image';
      Notification.fire({
        icon: 'error',
        title: `Enter Valid ${field}!!`
      })
      return;
    }
    if (method === "POST") {
      dispatch(createPost(postData));
      Notification.fire({
        icon: 'success',
        text: 'Successfully posted!'
      })
    }
    if (method === "PATCH") {
      dispatch(editPost(postData));
      Notification.fire({
        icon: 'success',
        text: 'Successfully edited!'
      })
    }
    dispatch({ type: INITIAL });
  };

  const cancelButtonHandler = () => {
    dispatch({ type: INITIAL });
    // props.changeShow();
  };

  const onChangeHandler = (event) => {
    dispatch({
      type: UPGRADE,
      payload: {
        method: method,
        data: { ...postData, [event.target.name]: event.target.value},
      },
    })
  };
  

  return (
    <form onSubmit={onSubmitHandler}>
      <Input>
        <label htmlFor="message">Caption*</label>
        <textarea
          type="text"
          id="message"
          name="message"
          value={postData.message}
          onChange={onChangeHandler}
        />
      </Input>
      <Input>
        <label htmlFor="tags">Tags</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={postData.tags}
          onChange={onChangeHandler}
        />
      </Input>
      <Image
        value={postData.image}
        onDone={(base64) =>
          dispatch({
            type: UPGRADE,
            payload: { method: method, data: { ...postData, image: base64 } },
          })
        }
      />
      <div className={classes.action}>
        <Button type="submit">{method === 'POST' ? 'Post' : 'Save'}</Button>
        <ButtonAlt type="button" onClick={cancelButtonHandler}>
          Cancel
        </ButtonAlt>
      </div>
    </form>
  );
};
export default PostForm;
