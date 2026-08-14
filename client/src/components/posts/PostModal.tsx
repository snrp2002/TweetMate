import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import classes from './PostModal.module.css';
import { Modal, Overlay } from '../UI/Modal';
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
  const scrollToNewPost = useScrollToHash('/', 'newPost');

  const isOwner = user?._id === post.creator;

  const handleDelete = async () => {
    onClose();
    if (!(await confirmAction('Are you sure you want to delete this post?'))) return;

    try {
      await deleteMutation.mutateAsync(post._id);
      notifySuccess('Successfully Deleted!');
      void navigate('/');
    } catch (error) {
      notifyError(toErrorMessage(error));
    }
  };

  const handleEdit = async () => {
    onClose();
    if (!(await confirmAction('Are you sure you want to edit this post?'))) return;
    startEditing(post);
    scrollToNewPost();
  };

  const handleCopyLink = async () => {
    onClose();
    try {
      await navigator.clipboard.writeText(postUrl(post._id));
      notifySuccess('Link copied!');
    } catch {
      notifyError('Could not copy the link.');
    }
  };

  if (!showModal) return null;

  return (
    <>
      {portal(<Overlay onClose={onClose} className={classes.overlay ?? ''} />, 'overlay-root')}
      {portal(
        <Modal className={classes.modal ?? ''}>
          <Link to={`/post/${post._id}`} onClick={onClose}>
            <div className={classes.modalContent}>View Post</div>
          </Link>
          {isOwner && (
            <div className={classes.modalContent} onClick={handleEdit}>
              Edit Post
            </div>
          )}
          <div className={classes.modalContent} onClick={handleCopyLink}>
            Copy Link
          </div>
          {isOwner && (
            <div className={classes.modalContent} onClick={handleDelete}>
              Delete Post
            </div>
          )}
        </Modal>,
        'modal-root',
      )}
    </>
  );
}
