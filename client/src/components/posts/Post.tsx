import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { WhatsappShareButton } from 'react-share';
import classes from './Post.module.css';
import timeImage from '../../images/time.png';
import profileImage from '../../images/profile.png';
import moreImage from '../../images/more.png';
import likedImage from '../../images/liked.png';
import likeImage from '../../images/like.png';
import commentImage from '../../images/comment.png';
import shareImage from '../../images/share.png';
import PostModal from './PostModal';
import Comments from './comments/Comments';
import { notifyError, notifyWarning } from '../UI/Popups';
import { useAuth } from '../../auth/AuthContext';
import { useLikePost } from '../../queries/posts';
import { toErrorMessage } from '../../api/client';
import { postUrl } from '../../config';
import type { Post as PostType } from '../../types/api';

function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function Post({ post }: { post: PostType }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const likeMutation = useLikePost();

  const [showModal, setShowModal] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const goToProfile = () => void navigate(`/user/${post.creator}`);

  const handleLike = () => {
    if (!user) {
      notifyWarning('Login to like the post!');
      return;
    }
    likeMutation.mutate(post._id, {
      onError: (error) => notifyError(toErrorMessage(error)),
    });
  };

  const hasLiked = user ? post.likes.includes(user._id) : false;
  const tags = post.tags.filter(Boolean);

  return (
    <>
      <div className={classes.post}>
        <div className={classes.header}>
          <div className={classes.profile}>
            <div className={classes.profileImage}>
              <img src={post.userImage || profileImage} alt="" onClick={goToProfile} />
            </div>
            <div className={classes.headerInfo}>
              <div className={classes.creator} onClick={goToProfile}>
                {post.userName}
              </div>
              <div className={classes.time}>
                <img src={timeImage} style={{ marginRight: '5px', height: '12px' }} alt="" />
                {relativeTime(post.createdAt)}
              </div>
            </div>
          </div>
          <div className={classes.more} onClick={() => setShowModal(true)}>
            <img src={moreImage} alt="Post options" height="20px" />
          </div>
        </div>

        {tags.length > 0 && (
          <div className={classes.tags}>{tags.map((tag) => `#${tag} `)}</div>
        )}

        {post.image && (
          <div className={classes.poster}>
            <img src={post.image} alt="" />
          </div>
        )}

        <div className={classes.content}>
          <div className={classes.message}>
            {post.message.split('\n').map((line, index) => (
              // Index keys are stable here: the list is derived from the
              // message and never reordered.
              <p key={`${post._id}-line-${index}`}>{line}</p>
            ))}
          </div>

          <div className={classes.action}>
            <div className={classes.actionButton} onClick={handleLike}>
              <img src={hasLiked ? likedImage : likeImage} alt="Like" />
              {post.likes.length}
            </div>
            <div className={classes.actionButton} onClick={() => setShowComments((v) => !v)}>
              <img src={commentImage} alt="Comments" />
              {post.commentCount}
            </div>
            <div className={classes.actionButton}>
              <WhatsappShareButton
                url={postUrl(post._id)}
                title={`Check out this TweetMate Post by ${post.userName} : `}
                style={{ margin: 0 }}
              >
                <img src={shareImage} alt="Share" />
              </WhatsappShareButton>
            </div>
          </div>

          {showComments && <Comments postId={post._id} />}
        </div>
      </div>

      <PostModal post={post} showModal={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
