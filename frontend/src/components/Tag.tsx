import React from 'react';
import styles from './Tag.module.css';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export function Tag({
  className = '',
  active = false,
  interactive = false,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={`${styles.tag} ${active ? styles.active : ''} ${
        interactive ? styles.interactive : ''
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
