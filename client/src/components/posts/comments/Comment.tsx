import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import classes from './Comment.module.css';
import Avatar from '../../UI/Avatar';
import type { Comment as CommentType } from '../../../types/api';

export default function Comment({ comment }: { comment: CommentType }) {
  const navigate = useNavigate();
  const goToProfile = () => void navigate(`/user/${comment.user}`);

  const date = new Date(comment.createdAt);
  const when = Number.isNaN(date.getTime()) ? '' : formatDistanceToNow(date, { addSuffix: true });

  return (
    <li className={classes.item}>
      <Avatar src={comment.image} name={comment.name} size={30} onClick={goToProfile} />

      <div className={classes.body}>
        <p className={classes.meta}>
          <button type="button" className={classes.name} onClick={goToProfile}>
            {comment.name}
          </button>
          <span className={classes.when}>{when}</span>
        </p>
        <p className={classes.text}>{comment.comment}</p>
      </div>
    </li>
  );
}
