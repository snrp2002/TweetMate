import classes from './UserPosts.module.css';
import UserPost from './UserPost';

export default function UserPosts({ postIds }: { postIds: string[] }) {
  return (
    <section className={classes.wrap}>
      <h2 className={classes.title}>Photos</h2>

      {postIds.length === 0 ? (
        <div className={classes.empty}>
          <p>No photos yet.</p>
        </div>
      ) : (
        <div className={classes.grid}>
          {postIds.map((id, index) => (
            <UserPost key={id} postId={id} order={Math.min(index, 9)} />
          ))}
        </div>
      )}
    </section>
  );
}
