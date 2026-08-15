import classes from './UserPosts.module.css';
import tile from './UserPost.module.css';
import UserPost from './UserPost';
import { useUserPosts } from '../../queries/posts';

interface UserPostsProps {
  userId: string;
  /**
   * How many tiles to reserve while loading. Comes from the profile document
   * we already have, so the skeleton grid matches the real one and the page
   * does not jump when it arrives.
   */
  expectedCount: number;
}

export default function UserPosts({ userId, expectedCount }: UserPostsProps) {
  const { data: posts, isPending } = useUserPosts(userId);

  return (
    <section className={classes.wrap}>
      <h2 className={classes.title}>Photos</h2>

      {isPending ? (
        <div className={classes.grid}>
          {Array.from({ length: Math.min(Math.max(expectedCount, 1), 12) }, (_, index) => (
            <div key={index} className={`${tile.tile} ${tile.skeleton}`} aria-hidden="true" />
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className={classes.empty}>
          <p>No photos yet.</p>
        </div>
      ) : (
        <div className={classes.grid}>
          {posts.map((post, index) => (
            <UserPost key={post._id} post={post} order={Math.min(index, 9)} />
          ))}
        </div>
      )}
    </section>
  );
}
