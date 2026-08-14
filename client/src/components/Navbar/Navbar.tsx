import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import classes from './Navbar.module.css';
import { Modal, Overlay } from '../UI/Modal';
import Icon from '../UI/Icon';
import Avatar from '../UI/Avatar';
import { notifySuccess } from '../UI/Popups';
import { useAuth } from '../../auth/AuthContext';
import { useScrollToHash } from '../UI/HashLink/useScrollToHash';

function portal(node: ReactNode, id: string) {
  const target = document.getElementById(id);
  return target ? createPortal(node, target) : null;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const scrollToComposer = useScrollToHash('/', 'newPost');

  const handleSignOut = () => {
    signOut();
    notifySuccess('Signed out');
    setShowMenu(false);
    void navigate('/');
  };

  const onFeed = location.pathname === '/';

  return (
    <>
      <header className={classes.bar}>
        <div className={classes.inner}>
          <Link to="/" className={classes.logo}>
            Tweet<i>Mate</i>
          </Link>

          <nav className={classes.nav}>
            <Link to="/" className={`${classes.link} ${onFeed ? classes.linkOn : ''}`}>
              Feed
            </Link>
            <button type="button" className={classes.link} onClick={scrollToComposer}>
              Post
            </button>

            {user ? (
              <div className={classes.account}>
                <Avatar src={user.image} size={36} onClick={() => setShowMenu((v) => !v)} />
              </div>
            ) : (
              <Link to="/auth" className={classes.cta}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {showMenu && isAuthenticated && user && (
        <>
          {portal(<Overlay onClose={() => setShowMenu(false)} bare />, 'overlay-root')}
          {portal(
            <Modal className={classes.menu ?? ''} anchored>
              <Link
                to={`/user/${user._id}`}
                onClick={() => setShowMenu(false)}
                className={classes.menuItem}
              >
                <Icon name="user" size={16} />
                Profile
              </Link>
              <button type="button" className={classes.menuItem} onClick={handleSignOut}>
                <Icon name="logout" size={16} />
                Sign out
              </button>
            </Modal>,
            'modal-root',
          )}
        </>
      )}
    </>
  );
}
