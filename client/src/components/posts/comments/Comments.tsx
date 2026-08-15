import { useState, type FormEvent } from 'react';
import classes from './Comments.module.css';
import Comment from './Comment';
import Loader from '../../UI/Loader';
import Icon from '../../UI/Icon';
import { notifyError, notifyWarning } from '../../UI/Popups';
import { useAuth } from '../../../auth/AuthContext';
import { useAddComment, useComments, useDeleteComment } from '../../../queries/comments';
import { toErrorMessage } from '../../../api/client';

interface CommentsProps {
  postId: string;
  /** Needed because the post's owner may delete anyone's comment on it. */
  postCreator: string;
}

export default function Comments({ postId, postCreator }: CommentsProps) {
  const { isAuthenticated, user } = useAuth();
  const { data: thread, isPending, isError, error } = useComments(postId, true);
  const addComment = useAddComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [draft, setDraft] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isPostOwner = !!user && user._id === postCreator;

  const handleDelete = async (commentId: string) => {
    setRemovingId(commentId);
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (mutationError) {
      notifyError(toErrorMessage(mutationError, 'Could not delete that comment.'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      notifyWarning('Sign in to comment');
      setDraft('');
      return;
    }
    if (draft.trim() === '') return;

    try {
      await addComment.mutateAsync(draft.trim());
      setDraft('');
    } catch (mutationError) {
      notifyError(toErrorMessage(mutationError));
    }
  };

  return (
    <section className={classes.wrap}>
      <form onSubmit={handleSubmit} className={classes.form}>
        <input
          type="text"
          id={`comment-${postId}`}
          className={classes.field}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment…"
          disabled={addComment.isPending}
          aria-label="Add a comment"
        />
        <button
          type="submit"
          className={classes.submit}
          disabled={addComment.isPending || draft.trim() === ''}
          aria-label="Post comment"
        >
          <Icon name="share" size={15} />
        </button>
      </form>

      {isPending && <Loader label="Loading comments" />}
      {isError && (
        <p role="alert" className={classes.error}>
          {toErrorMessage(error)}
        </p>
      )}

      {thread && thread.comments.length === 0 && (
        <p className={classes.none}>No comments yet.</p>
      )}

      <ol className={classes.list}>
        {thread?.comments.map((comment) => {
          // Mirrors the server rule exactly: the comment's author, or the
          // owner of the post it sits on.
          const canDelete = isPostOwner || (!!user && user._id === comment.user);
          return (
            <Comment
              key={comment._id}
              comment={comment}
              onDelete={canDelete ? () => void handleDelete(comment._id) : undefined}
              deleting={removingId === comment._id}
            />
          );
        })}
      </ol>
    </section>
  );
}
