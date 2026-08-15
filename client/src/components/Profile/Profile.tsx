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

  if (isPending) return <Loader label="Loading profile" />;

  if (isError) {
    return (
      <div className={classes.error} role="alert">
        <h2 className={classes.errorTitle}>Profile not found</h2>
        <p className={classes.errorText}>{toErrorMessage(error)}</p>
      </div>
    );
  }

  return (
    <div className={classes.profile}>
      <User user={user} />
      <UserPosts userId={user._id} expectedCount={user.posts.length} />
    </div>
  );
}
