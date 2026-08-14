import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import classes from './PostModal.module.css';
import { Modal, Overlay } from '../UI/Modal';
import Icon from '../UI/Icon';
import { confirmAction, notifyError, notifySuccess } from '../UI/Popups';
import { useAuth } from '../../auth/AuthContext';
import { usePostForm } from '../../postForm/PostFormContext';
import { useDeletePost } from '../../queries/posts';
import { useScrollToHash } from '../UI/HashLink/useScrollToHash';
import { toErrorMessage } from '../../api/client';
import { postUrl } from '../../config';
import type { Post } from '../../types/api';

function portal(node: ReactNode, id: string) {
  const target = document.getElementById(id);
  return target ? createPortal(node, target) : null;
}

interface PostModalProps {
  post: Post;
  showModal: boolean;
  onClose: () => void;
}

export default function PostModal({ post, showModal, onClose }: PostModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startEditing } = usePostForm();
  const deleteMutation = useDeletePost();
  const scrollToComposer = useScrollToHash('/', 'newPost');

  const isOwner = user?._id === post.creator;

  const handleDelete = async () => {
    onClose();
    if (!(await confirmAction('Delete this post? This cannot be undone.'))) return;

    try {
      await deleteMutation.mutateAsync(post._id);
      notifySuccess('Post deleted');
      void navigate('/');
    } catch (error) {
      notifyError(toErrorMessage(error));
    }
  };

  const handleEdit = async () => {
    onClose();
    if (!(await confirmAction('Edit this post?'))) return;
    startEditing(post);
    scrollToComposer();
  };

  const handleCopyLink = async () => {
    onClose();
    try {
      await navigator.clipboard.writeText(postUrl(post._id));
      notifySuccess('Link copied');
    } catch {
      notifyError('Could not copy the link');
    }
  };

  if (!showModal) return null;

  return (
    <>
      {portal(<Overlay onClose={onClose} />, 'overlay-root')}
      {portal(
        <Modal className={classes.modal ?? ''}>
          <Link to={`/post/${post._id}`} onClick={onClose} className={classes.item}>
            <Icon name="grid" size={16} />
            View post
          </Link>

          <button type="button" className={classes.item} onClick={handleCopyLink}>
            <Icon name="share" size={16} />
            Copy link
          </button>

          {isOwner && (
            <button type="button" className={classes.item} onClick={handleEdit}>
              <Icon name="edit" size={16} />
              Edit post
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              className={`${classes.item} ${classes.danger}`}
              onClick={handleDelete}
            >
              <Icon name="close" size={16} />
              Delete post
            </button>
          )}
        </Modal>,
        'modal-root',
      )}
    </>
  );
}
