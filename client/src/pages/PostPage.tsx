import { Link, useParams } from 'react-router-dom';
import classes from './PostPage.module.css';
import Post from '../components/posts/Post';
import Container from '../components/UI/Container';
import Loader from '../components/UI/Loader';
import Icon from '../components/UI/Icon';
import { usePost } from '../queries/posts';
import { toErrorMessage } from '../api/client';

export default function PostPage() {
  const { postId = '' } = useParams();
  // Fetches on its own, so a shared `/post/:id` link works without the feed.
  const { data: post, isPending, isError, error } = usePost(postId);

  return (
    <Container>
      <div className={classes.page}>
        <Link to="/" className={classes.back}>
          <Icon name="home" size={14} />
          Back to feed
        </Link>

        <div className={classes.stage}>
          {isPending && <Loader label="Loading post" />}
          {isError && (
            <p role="alert" className={classes.error}>
              {toErrorMessage(error)}
            </p>
          )}
          {post && <Post post={post} />}
        </div>
      </div>
    </Container>
  );
}
