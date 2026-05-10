'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import fetchClient, { userApi } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import styles from './page.module.css';

const INTERESTS = [
  'Coding', 'Design', 'Hackathons', 'Gaming', 'Greek Life', 
  'Entrepreneurship', 'Basketball', 'Football', 'Soccer', 
  'Anime', 'Photography', 'Music Production', 'Hiking', 
  'Debate', 'Theater', 'Chess', 'Investing', 'Fitness', 
  'Cooking', 'Travel', 'Art', 'Sustainability', 'Psychology'
];

const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Masters', 'PhD'];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    branch: '',
    interests: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [stats, setStats] = useState<any>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    userApi.getStats()
      .then(data => setStats(data))
      .catch(err => console.error("Failed to load stats", err));
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        year: user.year || '',
        branch: user.branch || '',
        interests: Array.isArray(user.interests) ? user.interests : (typeof user.interests === 'string' && user.interests ? [user.interests] : []),
      });
    }
  }, [user]);

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await userApi.updateProfile(formData);
      setSaveStatus('success');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await fetchClient('/users/me', { method: 'DELETE' });
      if (logout) {
        logout();
      }
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setIsDeactivating(false);
      setIsDeactivateModalOpen(false);
    }
  };

  return (
    <div className={styles.profileLayout}>
      <Sidebar />

      {isDeactivateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-light)', maxWidth: '400px', width: '90%' }}>
            <h3 className="serif" style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '1.5rem' }}>Deactivate Account</h3>
            <p className="mono" style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Are you sure? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setIsDeactivateModalOpen(false)} disabled={isDeactivating}>Cancel</Button>
              <Button variant="danger" onClick={handleDeactivate} disabled={isDeactivating}>{isDeactivating ? 'Deactivating...' : 'Confirm'}</Button>
            </div>
          </motion.div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <AnimatePresence>
          {saveStatus === 'success' && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <span className="mono" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>Profile updated ✓</span>
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--danger)', borderRadius: 'var(--border-radius)', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
               <span className="mono" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>Failed to save. Please try again.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className={styles.mainContainer}>
        <header className={styles.header}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mono" style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>// USER_PROFILE_V2.0</p>
            <h1 className="serif">Your <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>Identity.</span></h1>
            <p className="mono" style={{ color: 'var(--text-muted)' }}>Customize how you appear to the campus.</p>
          </motion.div>
        </header>

        <div className={styles.grid}>
          <section className={styles.formSection}>
            <form onSubmit={handleSave}>
              <div className={styles.section}>
                <span className={styles.sectionTitle}>Basic Information</span>
                <div className={styles.formGrid}>
                  <Input 
                    label="Display Name" 
                    placeholder="e.g. Alex" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    fullWidth
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Year of Study</label>
                    <select 
                      className="input" 
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--border-radius)',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit'
                      }}
                      value={formData.year}
                      onChange={e => setFormData({...formData, year: e.target.value})}
                    >
                      <option value="">Select Year</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <Input 
                  label="Major / Program" 
                  placeholder="e.g. Computer Science" 
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                  fullWidth
                />
              </div>

              <div className={styles.section}>
                <span className={styles.sectionTitle}>Your Interests</span>
                <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Choose what defines you. This helps our AI match your vibes.
                </p>
                <div className={styles.interestGrid}>
                  {INTERESTS.map(interest => (
                    <div 
                      key={interest} 
                      onClick={() => toggleInterest(interest)}
                      className={styles.interestBtn}
                    >
                      <Tag 
                        active={formData.interests.includes(interest)}
                      >
                         {interest}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  disabled={isSaving}
                  style={{ minWidth: '200px' }}
                >
                  {isSaving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ height: '1.25rem', width: '1.25rem', border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%' }} />
                      Saving...
                    </span>
                  ) : 'Update Profile'}
                </Button>
              </div>
            </form>

            <div className={styles.dangerZone}>
              <h3 className="serif" style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger Zone</h3>
              <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Once you deactivate your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger" size="sm" type="button" onClick={() => setIsDeactivateModalOpen(true)}>Deactivate Account</Button>
            </div>
          </section>

          <aside className={styles.statsSidebar}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Vibe Score</span>
              <div className={styles.statValue}>{stats?.vibeScore || user?.vibeScore || '0'}</div>
              <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Your score is based on etiquette and positive matches.
              </p>
              <div className={styles.rankBadge}>
                <Badge variant="primary">Elite Student</Badge>
              </div>
            </div>

            <Card style={{ padding: '1.5rem' }}>
              <span className={styles.statLabel}>Verification</span>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>✓</div>
                <div>
                  <p className="mono" style={{ fontSize: '0.875rem' }}>{user?.college?.name}</p>
                  <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Institutional access active</p>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <span className={styles.statLabel}>Campus Activity</span>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>Matches made</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{stats?.matchesMade || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>Confessions posted</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>{stats?.confessionsPosted || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>Stars received</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)' }}>{stats?.starsReceived || 0}</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
