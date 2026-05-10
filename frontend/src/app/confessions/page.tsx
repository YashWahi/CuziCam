'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { confessionsApi } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import styles from './page.module.css';

interface Confession {
  id: string;
  content: string;
  upvotes: number;
  category?: string;
  collegeId: string;
  createdAt: string;
}

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonLine} style={{ width: '80%' }} />
      <div className={styles.skeletonLine} style={{ width: '95%' }} />
      <div className={styles.skeletonLine} style={{ width: '60%' }} />
    </div>
    <div className={styles.skeletonFooter}>
      <div className={styles.skeletonButton} />
      <div className={styles.skeletonButton} style={{ width: '40px' }} />
    </div>
  </div>
);

export default function ConfessionsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newConfession, setNewConfession] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchConfessions();
  }, [activeCategory, user]);

  const fetchConfessions = async () => {
    if (!user?.college?.id) return;
    
    setIsLoading(true);
    try {
      const response = await confessionsApi.getAll({ 
        sort: activeCategory === 'Trending' ? 'trending' : 'new' 
      });
      setConfessions((response as any).data || response);
    } catch (err) {
      console.error('Failed to fetch confessions', err);
      setError('Failed to load confessions. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePost = async () => {
    if (!newConfession.trim() || !user?.college?.id) return;
    
    setIsPosting(true);
    setError('');
    try {
      const response = await confessionsApi.create({
        content: newConfession,
      });
      
      const newConf = (response as any).data || response;
      setConfessions([newConf, ...confessions]);
      setNewConfession('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post confession.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      await confessionsApi.like(id);
      setConfessions(prev => prev.map(c => 
        c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
      ));
    } catch (err: any) {
      if (err.response?.status === 403) {
        showToast("You've already upvoted this 🔥");
      } else {
        console.error('Failed to upvote', err);
      }
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContainer}>
        <div className={styles.container}>
          <header className={styles.header}>
            <motion.p 
              className="mono" 
              style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              // CAMPUS_CONFESSIONS_BOARD
            </motion.p>
            <h1 className="serif">Speak your <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>truth.</span></h1>
            <p className="mono" style={{ color: 'var(--text-muted)' }}>The anonymous pulse of your campus.</p>
          </header>

          <div className={styles.composer}>
            <textarea 
              placeholder="What's on your mind? Keep it anonymous..."
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
            />
            <div className={styles.composerFooter}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Tag variant="outline">Anonymous</Tag>
                <Tag variant="secondary">
                  {activeCategory !== 'Trending' && activeCategory !== 'New' ? activeCategory : 'General'}
                </Tag>
              </div>
              <Button onClick={handlePost} disabled={!newConfession.trim() || isPosting}>
                {isPosting ? 'Posting...' : 'Post Confession'}
              </Button>
            </div>
          </div>

          <div className={styles.filters}>
            {['Trending', 'New', 'Love', 'Rant', 'Academic', 'Wholesome'].map(cat => (
              <div key={cat} onClick={() => setActiveCategory(cat)} style={{ cursor: 'pointer' }}>
                <Tag 
                  active={activeCategory === cat}
                  interactive
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '20px' }}
                >
                  {cat}
                </Tag>
              </div>
            ))}
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.feed}>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                [...Array(3)].map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
              ) : confessions.length > 0 ? (
                confessions.map((c, index) => (
                  <motion.div
                    key={c.id}
                    className={styles.confessionCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    layout
                  >
                    <div className={styles.cardContent}>
                      {c.content}
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.voteGroup}>
                        <button 
                          className={styles.voteBtn} 
                          onClick={() => handleUpvote(c.id)}
                        >
                          🔥 {c.upvotes}
                        </button>
                        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {user?.college?.name || 'Campus'}
                        </span>
                      </div>
                      <span className={styles.timestamp}>{formatTimestamp(c.createdAt)}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p className="mono">Silence... for now. Be the first to speak.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div 
            className={styles.toast}
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          >
            <p className="mono" style={{ margin: 0, fontSize: '0.875rem' }}>{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
