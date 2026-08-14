import classes from './NewPost.module.css';
import PostForm from './PostForm';
import { useAuth } from '../../../auth/AuthContext';

export default function NewPost() {
  const { isAuthenticated } = useAuth();

  return (
    <div id="newPost" className={classes['newpost-container']}>
      <div className={classes.newpost}>
        {isAuthenticated ? <PostForm /> : <h3>Sign In to create a post...</h3>}
      </div>
    </div>
  );
}
