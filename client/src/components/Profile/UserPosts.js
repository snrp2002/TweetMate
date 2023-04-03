import classes from "./UserPosts.module.css";
import UserPost from "./UserPost";
import postsImage from "../../images/posts.png";
const UserPosts = (props) => {
  return (
    <div className={classes.postsContainer}>
      <div className={classes.options}>
        <div className={classes.option}>
          <img src={postsImage} alt="posts" />
          Posts
        </div>
      </div>
      {props.posts.length === 0 ? (
        <div className={classes.noPosts}>
          <h2>No Posts Available.</h2>
        </div>
      ) : (
        <div className={classes.userPosts}>
          {props.posts.map((id) => (
            <UserPost key={id} postId={id} />
          ))}
        </div>
      )}
    </div>
  );
};
export default UserPosts;
