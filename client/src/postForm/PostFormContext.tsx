import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Post, PostInput } from '../types/api';

export type PostFormMode = 'create' | 'edit';

export interface PostFormState {
  mode: PostFormMode;
  /** Set only while editing. */
  postId: string | null;
  data: PostInput;
}

const EMPTY: PostFormState = {
  mode: 'create',
  postId: null,
  data: { message: '', tags: '', image: '' },
};

interface PostFormContextValue extends PostFormState {
  setField: <K extends keyof PostInput>(field: K, value: PostInput[K]) => void;
  startEditing: (post: Post) => void;
  reset: () => void;
}

const PostFormContext = createContext<PostFormContextValue | null>(null);

export function PostFormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PostFormState>(EMPTY);

  const setField = useCallback<PostFormContextValue['setField']>((field, value) => {
    setState((current) => ({ ...current, data: { ...current.data, [field]: value } }));
  }, []);

  const startEditing = useCallback((post: Post) => {
    setState({
      mode: 'edit',
      postId: post._id,
      data: { message: post.message, tags: post.tags.join(', '), image: post.image },
    });
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const value = useMemo<PostFormContextValue>(
    () => ({ ...state, setField, startEditing, reset }),
    [state, setField, startEditing, reset],
  );

  return <PostFormContext value={value}>{children}</PostFormContext>;
}

export function usePostForm(): PostFormContextValue {
  const context = use(PostFormContext);
  if (!context) throw new Error('usePostForm must be used inside <PostFormProvider>');
  return context;
}
