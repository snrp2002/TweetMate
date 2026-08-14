import type { ButtonHTMLAttributes } from 'react';
import classes from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Solid ink block with an offset spot-colour shadow. */
export function Button({ className = '', ...props }: ButtonProps) {
  return <button {...props} className={`${classes.button} ${className}`} />;
}

/** Outlined counterpart for destructive or secondary actions. */
export function ButtonAlt({ className = '', ...props }: ButtonProps) {
  return <button {...props} className={`${classes.buttonAlt} ${className}`} />;
}
