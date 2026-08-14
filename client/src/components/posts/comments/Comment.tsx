import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import classes from './Comment.module.css';
import profileImage from '../../../images/profile.png';
import type { Comment as CommentType } from '../../../types/api';

export default function Comment({ comment }: { comment: CommentType }) {
  const navigate = useNavigate();
  const goToProfile = () => void navigate(`/user/${comment.user}`);

  const date = new Date(comment.createdAt);
  const when = Number.isNaN(date.getTime()) ? '' : formatDistanceToNow(date, { addSuffix: true });

  return (
    <div className={classes.commentContainer}>
      <img src={comment.image || profileImage} alt="" onClick={goToProfile} />
      <div className={classes.comment}>
        <div className={classes.name} onClick={goToProfile}>
          {comment.name}
        </div>
        <div className={classes.message}>{comment.comment}</div>
        <div className={classes.time}>{when}</div>
      </div>
    </div>
  );
}
