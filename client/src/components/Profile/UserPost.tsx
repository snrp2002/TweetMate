import { useNavigate } from 'react-router-dom';
import classes from './UserPost.module.css';
import Icon from '../UI/Icon';
import { usePost } from '../../queries/posts';
import { tileImage } from '../../lib/cloudinary';

interface UserPostProps {
  postId: string;
  order?: number;
}

export default function UserPost({ postId, order = 0 }: UserPostProps) {
  const navigate = useNavigate();
  // React Query dedupes and caches these, so revisiting a profile is free.
  const { data: post, isPending } = usePost(postId);

  if (isPending || !post) {
    return <div className={`${classes.tile} ${classes.skeleton}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className={classes.tile}
      style={{ '--order': order } as React.CSSProperties}
      onClick={() => void navigate(`/post/${post._id}`)}
      aria-label={`Open post: ${post.message.slice(0, 60)}`}
    >
      <span className={classes.image} style={{ backgroundImage: `url(${tileImage(post.image)})` }} />

      <span className={classes.overlay}>
        <span className={classes.stat}>
          <Icon name="heart" size={15} filled />
          {post.likes.length}
        </span>
        <span className={classes.stat}>
          <Icon name="comment" size={15} />
          {post.commentCount}
        </span>
      </span>
    </button>
  );
}
