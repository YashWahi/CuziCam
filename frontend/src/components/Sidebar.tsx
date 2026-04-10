'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from './Avatar';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: 'Home', href: '/dashboard', icon: '🏠' },
    { label: 'Match Queue', href: '/queue', icon: '🚀' },
    { label: 'Confessions', href: '/confessions', icon: '🎭' },
    { label: 'Profile', href: '/profile', icon: '👤' },
  ];

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.logo}>CuziCam</Link>
      
      <nav className={styles.navLinks}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <span>{item.icon}</span> <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar size="sm" src={user?.avatarUrl} name={user?.name} />
          <div style={{ overflow: 'hidden' }}>
            <p className="mono" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </p>
            <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {user?.college || '.edu verified'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
