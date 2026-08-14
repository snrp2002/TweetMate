import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import classes from './EditProfile.module.css';
import { Modal, Overlay } from '../../UI/Modal';
import Image from '../../UI/Form/Image';
import Input from '../../UI/Form/Input';
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

  // Re-seed the form whenever it is reopened, so a cancelled edit is discarded.
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
      notifySuccess('Profile Edited!');
      onClose();
    } catch (error) {
      notifyError(toErrorMessage(error));
    }
  };

  return (
    <>
      {portal(<Overlay onClose={onClose} className={classes.overlay ?? ''} />, 'overlay-root')}
      {portal(
        <Modal className={classes.modal ?? ''}>
          <form onSubmit={handleSubmit}>
            <Input>
              <label htmlFor="bio">Bio*</label>
              <textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                required
                style={{ height: '50px' }}
              />
            </Input>
            <Image value={image} onDone={setImage} label="Change Photo" />
            <Button type="submit" disabled={editProfile.isPending}>
              {editProfile.isPending ? 'Saving...' : 'Submit'}
            </Button>
            <ButtonAlt type="button" onClick={onClose}>
              Cancel
            </ButtonAlt>
          </form>
        </Modal>,
        'modal-root',
      )}
    </>
  );
}
