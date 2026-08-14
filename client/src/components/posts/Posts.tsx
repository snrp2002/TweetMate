import classes from './Posts.module.css';
import Post from './Post';
import type { Post as PostType } from '../../types/api';

export default function Posts({ posts }: { posts: PostType[] }) {
  if (posts.length === 0) {
    return <div className={classes.posts}>No posts yet. Be the first to tweet!</div>;
  }

  return (
    <div className={classes.posts}>
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  );
}
