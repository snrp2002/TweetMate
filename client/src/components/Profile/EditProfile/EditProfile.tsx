import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import classes from './EditProfile.module.css';
import { Modal, Overlay } from '../../UI/Modal';
import Image from '../../UI/Form/Image';
import Input from '../../UI/Form/Input';
import Icon from '../../UI/Icon';
import { Button, ButtonAlt } from '../../UI/Form/Button';
import { notifyError, notifySuccess } from '../../UI/Popups';
import { useAuth } from '../../../auth/AuthContext';
import { useEditProfile } from '../../../queries/users';
import { toErrorMessage } from '../../../api/client';

function portal(node: ReactNode, id: string) {
  const target = document.getElementById(id);
  return target ? createPortal(node, target) : null;
}

interface EditProfileProps {
  showModal: boolean;
  onClose: () => void;
}

export default function EditProfile({ showModal, onClose }: EditProfileProps) {
  const { user } = useAuth();
  const editProfile = useEditProfile();

  const [bio, setBio] = useState(user?.bio ?? '');
  const [image, setImage] = useState(user?.image ?? '');

  // Re-seed whenever reopened, so a cancelled edit is discarded.
  useEffect(() => {
    if (showModal) {
      setBio(user?.bio ?? '');
      setImage(user?.image ?? '');
    }
  }, [showModal, user?.bio, user?.image]);

  if (!showModal || !user) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await editProfile.mutateAsync({ bio, image });
      notifySuccess('Profile updated');
      onClose();
    } catch (error) {
      notifyError(toErrorMessage(error));
    }
  };

  return (
    <>
      {portal(<Overlay onClose={onClose} />, 'overlay-root')}
      {portal(
        <Modal className={classes.modal ?? ''}>
          <header className={classes.head}>
            <h2 className={classes.title}>Edit profile</h2>
            <button type="button" className={classes.close} onClick={onClose} aria-label="Close">
              <Icon name="close" size={15} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className={classes.form}>
            <Image value={image} onDone={setImage} label="Change photo" />

            <Input>
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                required
                maxLength={280}
                placeholder="A line or two about you"
              />
            </Input>

            <div className={classes.actions}>
              <Button type="submit" disabled={editProfile.isPending}>
                {editProfile.isPending ? 'Saving…' : 'Save'}
              </Button>
              <ButtonAlt type="button" onClick={onClose}>
                Cancel
              </ButtonAlt>
            </div>
          </form>
        </Modal>,
        'modal-root',
      )}
    </>
  );
}
