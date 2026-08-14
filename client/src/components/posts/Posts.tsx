import classes from './Posts.module.css';
import Post from './Post';
import type { Post as PostType } from '../../types/api';

export default function Posts({ posts }: { posts: PostType[] }) {
  if (posts.length === 0) {
    return (
      <div className={classes.empty}>
        <h2 className={classes.emptyTitle}>Nothing here yet</h2>
        <p className={classes.emptyText}>
          Be the first to share a photo — it only takes a moment.
        </p>
      </div>
    );
  }

  return (
    <section>
      {posts.map((post, index) => (
        <Post key={post._id} post={post} order={Math.min(index, 6)} />
      ))}
    </section>
  );
}
