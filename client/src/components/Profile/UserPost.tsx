import { useNavigate } from 'react-router-dom';
import classes from './UserPost.module.css';
import Icon from '../UI/Icon';
import { tileImage } from '../../lib/cloudinary';
import type { Post } from '../../types/api';

interface UserPostProps {
  post: Post;
  order?: number;
}

export default function UserPost({ post, order = 0 }: UserPostProps) {
  const navigate = useNavigate();

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
