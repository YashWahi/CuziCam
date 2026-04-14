import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className = '', children, padding = 'md', ...props }: CardProps) {
  return (
    <div className={`${styles.card} ${styles[`p-${padding}`]} ${className}`} {...props}>
      {children}
    </div>
  );
}
