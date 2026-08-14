import { useState } from 'react';
import classes from './User.module.css';
import EditProfile from './EditProfile/EditProfile';
import Avatar from '../UI/Avatar';
import Icon from '../UI/Icon';
import { useAuth } from '../../auth/AuthContext';
import type { UserProfile } from '../../types/api';

export default function User({ user }: { user: UserProfile }) {
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isOwnProfile = currentUser?._id === user._id;
  // '----' is the server-side default, not something anyone typed.
  const bioLines = user.bio
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !/^-+$/.test(line));

  return (
    <>
      <header className={classes.header}>
        <Avatar src={user.image} name={user.name} size={132} />

        <div className={classes.details}>
          <h1 className={classes.name}>{user.name}</h1>

          {bioLines.length > 0 ? (
            <div className={classes.bio}>
              {bioLines.map((line, index) => (
                <p key={`${user._id}-bio-${index}`}>{line}</p>
              ))}
            </div>
          ) : (
            <p className={classes.noBio}>
              {isOwnProfile ? 'Add a bio to tell people about yourself.' : 'No bio yet.'}
            </p>
          )}

          <div className={classes.row}>
            <span className={classes.stat}>
              <b>{user.posts.length}</b> {user.posts.length === 1 ? 'post' : 'posts'}
            </span>

            {isOwnProfile && (
              <button type="button" className={classes.edit} onClick={() => setShowModal(true)}>
                <Icon name="edit" size={15} />
                Edit profile
              </button>
            )}
          </div>
        </div>
      </header>

      {isOwnProfile && <EditProfile showModal={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
}
