import { useParams } from 'react-router-dom';
import classes from './PostPage.module.css';
import Post from '../components/posts/Post';
import Container from '../components/UI/Container';
import Loader from '../components/UI/Loader';
import { usePost } from '../queries/posts';
import { toErrorMessage } from '../api/client';

export default function PostPage() {
  const { postId = '' } = useParams();
  // Fetches on its own, so a shared `/post/:id` link works without the feed.
  const { data: post, isPending, isError, error } = usePost(postId);

  return (
    <Container>
      <div className={classes.singlePost}>
        {isPending && <Loader />}
        {isError && <p role="alert">{toErrorMessage(error)}</p>}
        {post && <Post post={post} />}
      </div>
    </Container>
  );
}
