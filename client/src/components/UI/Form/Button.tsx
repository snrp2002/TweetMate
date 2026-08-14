import type { ButtonHTMLAttributes } from 'react';
import classes from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', ...props }: ButtonProps) {
  return <button {...props} className={`${classes.buttonNormal} ${className}`} />;
}

export function ButtonAlt({ className = '', ...props }: ButtonProps) {
  return <button {...props} className={`${classes.buttonAlt} ${className}`} />;
}
