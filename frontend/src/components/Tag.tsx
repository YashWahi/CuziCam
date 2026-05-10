import React from 'react';
import styles from './Tag.module.css';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  interactive?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; // Added variant support
  children: React.ReactNode;
}

export function Tag({
  className = '',
  active = false,
  interactive = false,
  variant,
  children,
  ...props
}: TagProps) {
  const variantClass = variant ? styles[variant] : '';
  
  return (
    <span
      className={`${styles.tag} ${active ? styles.active : ''} ${
        interactive ? styles.interactive : ''
      } ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
