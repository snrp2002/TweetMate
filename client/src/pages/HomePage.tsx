import Container from '../components/UI/Container';
import NewPost from '../components/posts/newPost/NewPost';
import Posts from '../components/posts/Posts';
import Loader from '../components/UI/Loader';
import { usePosts } from '../queries/posts';
import { toErrorMessage } from '../api/client';

export default function HomePage() {
  const { data: posts, isPending, isError, error, refetch } = usePosts();

  return (
    <Container>
      <NewPost />
      {isPending && <Loader />}
      {isError && (
        <div role="alert">
          <p>{toErrorMessage(error)}</p>
          <button type="button" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      )}
      {posts && <Posts posts={posts} />}
    </Container>
  );
}
