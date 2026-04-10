import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export function Badge({ className = '', variant = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
