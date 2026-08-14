import type { ReactNode } from 'react';
import classes from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ children, className = '' }: ContainerProps) {
  return <div className={`${classes.container} ${className}`}>{children}</div>;
}
