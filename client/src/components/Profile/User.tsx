import { useState } from 'react';
import classes from './User.module.css';
import profileImage from '../../images/profile.png';
import editImage from '../../images/edit.png';
import EditProfile from './EditProfile/EditProfile';
import { useAuth } from '../../auth/AuthContext';
import type { UserProfile } from '../../types/api';

export default function User({ user }: { user: UserProfile }) {
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isOwnProfile = currentUser?._id === user._id;

  return (
    <>
      <div className={classes.user}>
        <div className={classes.userPhoto}>
          <img src={user.image || profileImage} alt="" />
        </div>
        <div className={classes.userInfo}>
          <div className={classes.userName}>
            {user.name}
            {isOwnProfile && (
              <div className={classes.edit} onClick={() => setShowModal(true)}>
                <img src={editImage} alt="Edit profile" height="20px" />
              </div>
            )}
          </div>
          <div className={classes.userPosts}>{user.posts.length}&nbsp;&nbsp;posts</div>
          <div className={classes.userBio}>
            {user.bio.split('\n').map((line, index) => (
              <p key={`${user._id}-bio-${index}`}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfile showModal={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
