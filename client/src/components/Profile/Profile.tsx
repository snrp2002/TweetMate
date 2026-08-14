import { useParams } from 'react-router-dom';
import classes from './Profile.module.css';
import User from './User';
import UserPosts from './UserPosts';
import Loader from '../UI/Loader';
import { useUser } from '../../queries/users';
import { toErrorMessage } from '../../api/client';

export default function Profile() {
  const { userId = '' } = useParams();
  const { data: user, isPending, isError, error } = useUser(userId);

  if (isPending) return <Loader />;
  if (isError) return <p role="alert">{toErrorMessage(error)}</p>;

  return (
    <div className={classes.profile}>
      <User user={user} />
      <UserPosts postIds={user.posts} />
    </div>
  );
}
