import Container from '../components/UI/Container';
import NewPost from '../components/posts/newPost/NewPost';
import Posts from '../components/posts/Posts';
import Loader from '../components/UI/Loader';
import classes from './HomePage.module.css';
import { usePosts } from '../queries/posts';
import { toErrorMessage } from '../api/client';

export default function HomePage() {
  const { data: posts, isPending, isError, error, refetch } = usePosts();

  return (
    <Container>
      <div className={classes.spread}>
        <div className={classes.feed}>
          <header className={classes.head}>
            <h1 className={classes.title}>
              Today&rsquo;s <i>frames</i>
            </h1>
            <p className={classes.sub}>
              {posts ? `${posts.length} ${posts.length === 1 ? 'photo' : 'photos'} shared` : 'The latest from everyone'}
            </p>
          </header>

          {isPending && <Loader label="Loading the feed" />}

          {isError && (
            <div className={classes.failure} role="alert">
              <h2 className={classes.failureTitle}>Couldn&rsquo;t load the feed</h2>
              <p className={classes.failureText}>{toErrorMessage(error)}</p>
              <button type="button" className={classes.retry} onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          )}

          {posts && <Posts posts={posts} />}
        </div>

        <NewPost />
      </div>
    </Container>
  );
}
