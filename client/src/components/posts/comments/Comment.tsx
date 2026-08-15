import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import classes from './Comment.module.css';
import Avatar from '../../UI/Avatar';
import Icon from '../../UI/Icon';
import type { Comment as CommentType } from '../../../types/api';

interface CommentProps {
  comment: CommentType;
  /** Shown only when the viewer is allowed to remove this comment. */
  onDelete?: (() => void) | undefined;
  deleting?: boolean;
}

export default function Comment({ comment, onDelete, deleting = false }: CommentProps) {
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

          {onDelete && (
            <button
              type="button"
              className={classes.delete}
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Delete comment by ${comment.name}`}
              title="Delete comment"
            >
              <Icon name="trash" size={13} />
            </button>
          )}
        </p>
        <p className={classes.text}>{comment.comment}</p>
      </div>
    </li>
  );
}
