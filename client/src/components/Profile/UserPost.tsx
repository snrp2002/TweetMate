import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './UserPost.module.css';
import commentImage from '../../images/chat.png';
import likeImage from '../../images/heart.png';
import Loader from '../UI/Loader';
import { usePost } from '../../queries/posts';

export default function UserPost({ postId }: { postId: string }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  // React Query dedupes and caches these, so revisiting a profile is free.
  const { data: post, isPending } = usePost(postId);

  if (isPending || !post) {
    return (
      <div className={classes.userPost}>
        <Loader />
      </div>
    );
  }

  return (
    <div
      className={classes.userPost}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={classes.postImage} style={{ backgroundImage: `url(${post.image})` }} />
      {hovered && (
        <div className={classes.postElements} onClick={() => void navigate(`/post/${post._id}`)}>
          <div className={classes.postElement}>
            <img src={likeImage} alt="" /> {post.likes.length}
          </div>
          <div className={classes.postElement}>
            <img src={commentImage} alt="" /> {post.commentCount}
          </div>
        </div>
      )}
    </div>
  );
}
