'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import { Card } from '@/components/Card';
import styles from './page.module.css';

interface Confession {
  id: string;
  content: string;
  upvotes: number;
  category: string;
  campus: string;
  timestamp: string;
}

const MOCK_CONFESSIONS: Confession[] = [
  { id: '1', content: "Finally told my crush I like them via a CuziCam star and they starred back! My heart is racing. 💖", upvotes: 142, category: 'Love', campus: 'Stanford', timestamp: '2h ago' },
  { id: '2', content: "The coffee at the library is actually just warm dirt. Change my mind.", upvotes: 89, category: 'Rant', campus: 'MIT', timestamp: '4h ago' },
  { id: '3', content: "I haven't slept in 48 hours because of this hackathon and I'm starting to see code in my cereal.", upvotes: 210, category: 'Academic', campus: 'UC Berkeley', timestamp: '5h ago' },
  { id: '4', content: "Anyone know why there was a guy dressed as a penguin in the quad today? No? Just another Tuesday?", upvotes: 56, category: 'Campus Life', campus: 'Harvard', timestamp: '8h ago' },
  { id: '5', content: "Met a CS major who actually showers. Unicorn alert! 🦄", upvotes: 312, category: 'Vibe Check', campus: 'Georgia Tech', timestamp: '10h ago' },
  { id: '6', content: "Shoutout to the person who shared their umbrella with me today. You're a real one.", upvotes: 77, category: 'Wholesome', campus: 'NYU', timestamp: '12h ago' },
];

const CATEGORIES = ['All', 'Trending', 'Love', 'Rant', 'Academic', 'Wholesome'];

export default function ConfessionsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [confessions, setConfessions] = useState<Confession[]>(MOCK_CONFESSIONS);
  const [newConfession, setNewConfession] = useState('');

  const handlePost = () => {
    if (!newConfession.trim()) return;
    const item: Confession = {
      id: Date.now().toString(),
      content: newConfession,
      upvotes: 0,
      category: 'Recent',
      campus: 'Your College',
      timestamp: 'Just now'
    };
    setConfessions([item, ...confessions]);
    setNewConfession('');
  };

  const handleUpvote = (id: string) => {
    setConfessions(prev => prev.map(c => 
      c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
    ));
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
            {CATEGORIES.map(cat => (
              <div key={cat} onClick={() => setActiveCategory(cat)} style={{ cursor: 'pointer' }}>
                <Tag 
                  label={cat} 
                  variant={activeCategory === cat ? 'primary' : 'outline'} 
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '20px' }}
                />
              </div>
            ))}
          </div>

          <div className={styles.feed}>
            <AnimatePresence>
              {filteredConfessions.map((c, index) => (
                <motion.div
                  key={c.id}
                  className={styles.confessionCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
                        {c.campus}
                      </span>
                    </div>
                    <span className={styles.timestamp}>{c.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
