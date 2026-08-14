import type { ReactNode } from 'react';
import classes from './Input.module.css';

export default function Input({ children }: { children: ReactNode }) {
  return <div className={classes.input}>{children}</div>;
}
