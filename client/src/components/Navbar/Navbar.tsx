import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import classes from './Navbar.module.css';
import logoImage from '../../images/brandLogo.png';
import homeImage from '../../images/home.png';
import profileImage from '../../images/profile.png';
import newPostImage from '../../images/newPost.png';
import logoutImage from '../../images/logout.png';
import { Modal, Overlay } from '../UI/Modal';
import { notifySuccess } from '../UI/Popups';
import { useAuth } from '../../auth/AuthContext';
import { useScrollToHash } from '../UI/HashLink/useScrollToHash';

function portal(node: ReactNode, id: string) {
  const target = document.getElementById(id);
  return target ? createPortal(node, target) : null;
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const scrollToNewPost = useScrollToHash('/', 'newPost');

  const handleSignOut = () => {
    signOut();
    notifySuccess('Logged Out successfully!');
    setShowModal(false);
    void navigate('/');
  };

  return (
    <>
      <div className={classes.navbar}>
        <Link to="/" className={classes.brandName}>
          <img src={logoImage} alt="" />
          TweetMate
        </Link>
        <div className={classes.navOptions}>
          <button
            type="button"
            className={classes.option}
            onClick={scrollToNewPost}
            aria-label="New post"
          >
            <img src={newPostImage} alt="" />
          </button>
          <Link to="/" className={classes.option} aria-label="Home">
            <img src={homeImage} alt="" />
          </Link>
          {user ? (
            <div className={classes.profile}>
              <img
                src={user.image || profileImage}
                alt="Your profile"
                onClick={() => setShowModal((value) => !value)}
              />
            </div>
          ) : (
            <Link to="/auth" className={classes.auth}>
              Sign&nbsp;In
            </Link>
          )}
        </div>
      </div>

      {showModal && isAuthenticated && user && (
        <>
          {portal(<Overlay onClose={() => setShowModal(false)} />, 'overlay-root')}
          {portal(
            <Modal className={classes.modal}>
              <Link to={`/user/${user._id}`}>
                <div className={classes.modalContent} onClick={() => setShowModal(false)}>
                  <img src={profileImage} alt="" />
                  Your Profile
                </div>
              </Link>
              <div className={classes.modalContent} onClick={handleSignOut}>
                <img src={logoutImage} alt="" />
                Logout
              </div>
            </Modal>,
            'modal-root',
          )}
        </>
      )}
    </>
  );
}
