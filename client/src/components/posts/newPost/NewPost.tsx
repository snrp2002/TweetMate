import { Link } from 'react-router-dom';
import classes from './NewPost.module.css';
import PostForm from './PostForm';
import { useAuth } from '../../../auth/AuthContext';
import { usePostForm } from '../../../postForm/PostFormContext';

export default function NewPost() {
  const { isAuthenticated } = useAuth();
  const { mode } = usePostForm();

  return (
    <aside id="newPost" className={classes.rail}>
      <div className={classes.panel}>
        <h2 className={classes.title}>{mode === 'edit' ? 'Edit post' : 'New post'}</h2>

        {isAuthenticated ? (
          <PostForm />
        ) : (
          <div className={classes.gate}>
            <p className={classes.gateText}>Sign in to share a photo with the feed.</p>
            <Link to="/auth" className={classes.gateLink}>
              Sign in
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
