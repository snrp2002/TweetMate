import type { ChangeEvent, FormEvent } from 'react';
import classes from './PostForm.module.css';
import Image from '../../UI/Form/Image';
import Input from '../../UI/Form/Input';
import { Button, ButtonAlt } from '../../UI/Form/Button';
import { notifyError, notifySuccess } from '../../UI/Popups';
import { usePostForm } from '../../../postForm/PostFormContext';
import { useCreatePost, useEditPost } from '../../../queries/posts';
import { toErrorMessage } from '../../../api/client';

export default function PostForm() {
  const { mode, postId, data, setField, reset } = usePostForm();
  const createMutation = useCreatePost();
  const editMutation = useEditPost();

  const isSubmitting = createMutation.isPending || editMutation.isPending;

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === 'message' || name === 'tags' || name === 'image') {
      setField(name, value);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (data.message.trim() === '' || data.image === '') {
      notifyError(`Enter Valid ${data.message.trim() === '' ? 'Caption' : 'Image'}!!`);
      return;
    }

    try {
      if (mode === 'edit' && postId) {
        await editMutation.mutateAsync({ ...data, _id: postId });
        notifySuccess('Successfully edited!');
      } else {
        await createMutation.mutateAsync(data);
        notifySuccess('Successfully posted!');
      }
      reset();
    } catch (error) {
      notifyError(toErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input>
        <label htmlFor="message">Caption*</label>
        <textarea id="message" name="message" value={data.message} onChange={handleChange} />
      </Input>
      <Input>
        <label htmlFor="tags">Tags</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={data.tags}
          onChange={handleChange}
          placeholder="react, node, vite"
        />
      </Input>
      <Image value={data.image} onDone={(base64) => setField('image', base64)} />
      <div className={classes.action}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save' : 'Post'}
        </Button>
        <ButtonAlt type="button" onClick={reset} disabled={isSubmitting}>
          Cancel
        </ButtonAlt>
      </div>
    </form>
  );
}
