import type { ReactNode } from 'react';
import classes from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ children, className = '' }: ContainerProps) {
  return <div className={`${className} ${classes.container}`}>{children}</div>;
}
