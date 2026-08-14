import { useState, type FormEvent } from 'react';
import classes from './Comments.module.css';
import Comment from './Comment';
import Loader from '../../UI/Loader';
import Icon from '../../UI/Icon';
import { notifyError, notifyWarning } from '../../UI/Popups';
import { useAuth } from '../../../auth/AuthContext';
import { useAddComment, useComments } from '../../../queries/comments';
import { toErrorMessage } from '../../../api/client';

export default function Comments({ postId }: { postId: string }) {
  const { isAuthenticated } = useAuth();
  const { data: thread, isPending, isError, error } = useComments(postId, true);
  const addComment = useAddComment(postId);
  const [draft, setDraft] = useState('');

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
        {thread?.comments.map((comment) => <Comment key={comment._id} comment={comment} />)}
      </ol>
    </section>
  );
}
