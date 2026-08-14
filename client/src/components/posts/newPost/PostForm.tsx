import type { ChangeEvent, FormEvent } from 'react';
import classes from './PostForm.module.css';
import Image from '../../UI/Form/Image';
import Input from '../../UI/Form/Input';
import { Button, ButtonAlt } from '../../UI/Form/Button';
import { notifyError, notifySuccess } from '../../UI/Popups';
import { usePostForm } from '../../../postForm/PostFormContext';
import { useCreatePost, useEditPost } from '../../../queries/posts';
import { toErrorMessage } from '../../../api/client';

const CAPTION_LIMIT = 400;

export default function PostForm() {
  const { mode, postId, data, setField, reset } = usePostForm();
  const createMutation = useCreatePost();
  const editMutation = useEditPost();

  const isSubmitting = createMutation.isPending || editMutation.isPending;
  const remaining = CAPTION_LIMIT - data.message.length;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === 'message' || name === 'tags' || name === 'image') {
      setField(name, value);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (data.message.trim() === '' || data.image === '') {
      notifyError(`Add ${data.message.trim() === '' ? 'a caption' : 'a photo'} first`);
      return;
    }

    try {
      if (mode === 'edit' && postId) {
        await editMutation.mutateAsync({ ...data, _id: postId });
        notifySuccess('Post updated');
      } else {
        await createMutation.mutateAsync(data);
        notifySuccess('Posted');
      }
      reset();
    } catch (error) {
      notifyError(toErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Image value={data.image} onDone={(base64) => setField('image', base64)} />

      <Input>
        <label htmlFor="message">Caption</label>
        <textarea
          id="message"
          name="message"
          value={data.message}
          onChange={handleChange}
          maxLength={CAPTION_LIMIT}
          placeholder="Say something about it…"
        />
      </Input>

      <p className={classes.counter} aria-live="polite">
        <span className={remaining < 40 ? classes.low : ''}>{remaining}</span> left
      </p>

      <Input>
        <label htmlFor="tags">Tags</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={data.tags}
          onChange={handleChange}
          placeholder="sunset, film, tokyo"
        />
      </Input>

      <div className={classes.actions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing…' : mode === 'edit' ? 'Save changes' : 'Publish'}
        </Button>
        <ButtonAlt type="button" onClick={reset} disabled={isSubmitting}>
          {mode === 'edit' ? 'Discard' : 'Clear'}
        </ButtonAlt>
      </div>
    </form>
  );
}
