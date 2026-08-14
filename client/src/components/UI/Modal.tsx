import type { ReactNode } from 'react';
import classes from './Modal.module.css';

interface ModalProps {
  children: ReactNode;
  className?: string;
  /** Positioned by the caller (e.g. a dropdown) rather than centred. */
  anchored?: boolean;
}

export function Modal({ children, className = '', anchored = false }: ModalProps) {
  return (
    <div
      className={`${classes.modal} ${anchored ? classes.anchored : classes.centered} ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

interface OverlayProps {
  onClose: () => void;
  className?: string;
  /** Invisible click-catcher, for dropdowns that should not dim the page. */
  bare?: boolean;
}

export function Overlay({ onClose, className = '', bare = false }: OverlayProps) {
  return (
    <div
      className={`${classes.overlay} ${bare ? classes.bare : ''} ${className}`}
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    />
  );
}
