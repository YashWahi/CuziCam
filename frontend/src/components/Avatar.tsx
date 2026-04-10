import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name?: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

export function Avatar({ name = 'U', url, size = 'md', online = false, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={`${styles.avatarWrapper} ${styles[size]} ${className}`}>
      {url ? (
        <img src={url} alt={name} className={styles.image} />
      ) : (
        <div className={styles.placeholder}>{initials}</div>
      )}
      {online && <div className={styles.onlineDot} />}
    </div>
  );
}
