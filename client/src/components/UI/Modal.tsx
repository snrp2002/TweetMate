import type { ReactNode } from 'react';
import classes from './Modal.module.css';

interface ModalProps {
  children: ReactNode;
  className?: string;
}

export function Modal({ children, className = '' }: ModalProps) {
  return <div className={`${classes.modal} ${className}`}>{children}</div>;
}

interface OverlayProps {
  onClose: () => void;
  className?: string;
}

export function Overlay({ onClose, className = '' }: OverlayProps) {
  return (
    <div
      className={`${classes.overlay} ${className}`}
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    />
  );
}
