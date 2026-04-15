'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { confessionApi } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import { Card } from '@/components/Card';
import styles from './page.module.css';

interface Confession {
  id: string;
  content: string;
  upvotes: number;
  category?: string;
  collegeId: string;
  createdAt: string;
}

export default function ConfessionsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newConfession, setNewConfession] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchConfessions();
  }, [activeCategory, user]);

  const fetchConfessions = async () => {
    if (!user?.collegeId) return;
    
    setIsLoading(true);
    try {
      const response = await confessionApi.getAll(
        user.collegeId, 
        activeCategory === 'Trending' ? 'trending' : 'new'
      );
      setConfessions(response.data);
    } catch (err) {
      console.error('Failed to fetch confessions', err);
      setError('Failed to load confessions. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newConfession.trim() || !user?.collegeId) return;
    
    setIsPosting(true);
    setError('');
    try {
      const response = await confessionApi.create({
        content: newConfession,
        category: activeCategory !== 'Trending' ? activeCategory : 'General',
        collegeId: user.collegeId
      });
      
      // Optimistically add or just re-fetch
      setConfessions([response.data, ...confessions]);
      setNewConfession('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post confession.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      await confessionApi.vote(id);
      setConfessions(prev => prev.map(c => 
        c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
      ));
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('You have already upvoted this confession today.');
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

  const filteredConfessions = activeCategory === 'All' 
    ? confessions 
    : confessions.filter(c => c.category === activeCategory);

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
                <Tag label="Anonymous" variant="outline" />
                <Tag label={activeCategory !== 'All' ? activeCategory : 'General'} variant="secondary" />
              </div>
              <Button onClick={handlePost} disabled={!newConfession.trim()}>
                Post Confession
              </Button>
            </div>
          </div>

          <div className={styles.filters}>
            {['Trending', 'New', 'Love', 'Rant', 'Academic', 'Wholesome'].map(cat => (
              <div key={cat} onClick={() => setActiveCategory(cat)} style={{ cursor: 'pointer' }}>
                <Tag 
                  label={cat} 
                  variant={activeCategory === cat ? 'primary' : 'outline'} 
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '20px' }}
                />
              </div>
            ))}
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.feed}>
            <AnimatePresence>
              {isLoading ? (
                <div className={styles.emptyState}>
                  <p className="mono">Tuning into campus vibrations...</p>
                </div>
              ) : confessions.length > 0 ? (
                confessions.map((c, index) => (
                  <motion.div
                    key={c.id}
                    className={styles.confessionCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 1) }}
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
                          {user?.college?.name}
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
    </div>
  );
}
