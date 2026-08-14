import { useState, type FormEvent } from 'react';
import classes from './Comments.module.css';
import Input from '../../UI/Form/Input';
import Comment from './Comment';
import Loader from '../../UI/Loader';
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
      notifyWarning('Login to comment the post!');
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
    <div className={classes.commentsContainer}>
      <form onSubmit={handleSubmit}>
        <Input>
          <input
            type="text"
            id={`comment-${postId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a comment"
            disabled={addComment.isPending}
          />
        </Input>
      </form>

      {isPending && <Loader label="Loading comments..." />}
      {isError && <p role="alert">{toErrorMessage(error)}</p>}
      {thread?.comments.map((comment) => <Comment key={comment._id} comment={comment} />)}
    </div>
  );
}
