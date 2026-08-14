import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { WhatsappShareButton } from 'react-share';
import classes from './Post.module.css';
import PostModal from './PostModal';
import Comments from './comments/Comments';
import Icon from '../UI/Icon';
import Avatar from '../UI/Avatar';
import { notifyError, notifyWarning } from '../UI/Popups';
import { useAuth } from '../../auth/AuthContext';
import { useLikePost } from '../../queries/posts';
import { toErrorMessage } from '../../api/client';
import { postUrl } from '../../config';
import type { Post as PostType } from '../../types/api';

interface PostProps {
  post: PostType;
  /** Stagger index for the page-load reveal. */
  order?: number;
}

export default function Post({ post, order = 0 }: PostProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const likeMutation = useLikePost();

  const [showModal, setShowModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!pulse) return;
    const timer = setTimeout(() => setPulse(false), 620);
    return () => clearTimeout(timer);
  }, [pulse]);

  const hasLiked = user ? post.likes.includes(user._id) : false;
  const date = new Date(post.createdAt);
  const when = Number.isNaN(date.getTime()) ? '' : formatDistanceToNow(date, { addSuffix: true });
  const goToProfile = () => void navigate(`/user/${post.creator}`);

  const handleLike = () => {
    if (!user) {
      notifyWarning('Sign in to like this post');
      return;
    }
    if (!hasLiked) setPulse(true);
    likeMutation.mutate(post._id, {
      onError: (error) => notifyError(toErrorMessage(error)),
    });
  };

  const tags = post.tags.filter(Boolean);

  return (
    <>
      <article className={classes.card} style={{ '--order': order } as React.CSSProperties}>
        <header className={classes.head}>
          <Avatar src={post.userImage} name={post.userName} size={36} onClick={goToProfile} />
          <div className={classes.who}>
            <button type="button" className={classes.name} onClick={goToProfile}>
              {post.userName}
            </button>
            <span className={classes.when}>{when}</span>
          </div>
          <button
            type="button"
            className={classes.more}
            onClick={() => setShowModal(true)}
            aria-label="Post options"
          >
            <Icon name="more" size={18} />
          </button>
        </header>

        {post.image && (
          <div className={classes.media}>
            <img src={post.image} alt="" loading="lazy" />
          </div>
        )}

        <div className={classes.caption}>
          {post.message.split('\n').map((line, index) =>
            line.trim() === '' ? null : <p key={`${post._id}-line-${index}`}>{line}</p>,
          )}
        </div>

        {tags.length > 0 && (
          <div className={classes.tags}>
            {tags.map((tag) => (
              <span key={tag} className={classes.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className={classes.actions}>
          <button
            type="button"
            className={`${classes.action} ${hasLiked ? classes.liked : ''}`}
            onClick={handleLike}
            aria-pressed={hasLiked}
          >
            <span className={`${classes.icon} ${pulse ? classes.pulse : ''}`}>
              <Icon name="heart" size={16} filled={hasLiked} />
              {pulse && <span className={classes.ring} aria-hidden="true" />}
            </span>
            {post.likes.length}
          </button>

          <button
            type="button"
            className={`${classes.action} ${showComments ? classes.actionOn : ''}`}
            onClick={() => setShowComments((value) => !value)}
            aria-expanded={showComments}
          >
            <Icon name="comment" size={16} />
            {post.commentCount}
          </button>

          <WhatsappShareButton
            url={postUrl(post._id)}
            title={`A photo on TweetMate by ${post.userName}: `}
            className={classes.action}
          >
            <Icon name="share" size={16} />
            <span className={classes.shareWord}>Share</span>
          </WhatsappShareButton>
        </div>

        {showComments && <Comments postId={post._id} />}
      </article>

      <PostModal post={post} showModal={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
