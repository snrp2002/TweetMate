import PostForm from "./PostForm";
import classes from "./NewPost.module.css";
// import { useState } from "react";
import { useSelector } from "react-redux";
const NewPost = () => {
  // const [showForm, setShowForm] = useState(false);
  const authData = useSelector((state) => state.auth.authData);
  // const showFormHandler = () => {
  //   setShowForm((current) => !current);
  // };
  return (
    <div id="newPost" className={classes["newpost-container"]}>
      <div className={classes.newpost}>
        {!authData && <h3>Sign In to create a post...</h3>}
        {/* {authData && !showForm && (
          <button className={classes.tweet} onClick={showFormHandler}>
            Tweet Something New...
          </button>
        )} */}
        {authData && <PostForm />}
      </div>
    </div>
  );
};
export default NewPost;
