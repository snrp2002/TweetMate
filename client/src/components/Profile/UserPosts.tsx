import classes from './UserPosts.module.css';
import UserPost from './UserPost';
import postsImage from '../../images/posts.png';

export default function UserPosts({ postIds }: { postIds: string[] }) {
  return (
    <div className={classes.postsContainer}>
      <div className={classes.options}>
        <div className={classes.option}>
          <img src={postsImage} alt="" />
          Posts
        </div>
      </div>

      {postIds.length === 0 ? (
        <div className={classes.noPosts}>
          <h2>No Posts Available.</h2>
        </div>
      ) : (
        <div className={classes.userPosts}>
          {postIds.map((id) => (
            <UserPost key={id} postId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
