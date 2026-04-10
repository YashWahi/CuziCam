'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
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
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    branch: '',
    interests: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        year: user.year || '',
        branch: user.branch || '',
        interests: user.interests || []
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

    // Simulate API call
    setTimeout(() => {
      updateUser(formData);
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className={styles.profileLayout}>
      <Sidebar />

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
                        label={interest} 
                        variant={formData.interests.includes(interest) ? 'primary' : 'outline'} 
                      />
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
                  {isSaving ? 'Saving...' : 'Update Profile'}
                </Button>
                {saveStatus === 'success' && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mono" 
                    style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}
                  >
                    ✓ Profile updated successfully
                  </motion.span>
                )}
              </div>
            </form>

            <div className={styles.dangerZone}>
              <h3 className="serif" style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger Zone</h3>
              <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Once you deactivate your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger" size="sm">Deactivate Account</Button>
            </div>
          </section>

          <aside className={styles.statsSidebar}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Vibe Score</span>
              <div className={styles.statValue}>{user?.vibeScore || '7.5'}</div>
              <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Your score is based on etiquette and positive matches.
              </p>
              <div className={styles.rankBadge}>
                <Badge label="Elite Student" variant="primary" />
              </div>
            </div>

            <Card glass style={{ padding: '1.5rem' }}>
              <span className={styles.statLabel}>Verification</span>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>✓</div>
                <div>
                  <p className="mono" style={{ fontSize: '0.875rem' }}>{user?.college}</p>
                  <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Institutional access active</p>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <span className={styles.statLabel}>Campus Activity</span>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>Matches made</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>124</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>Confessions posted</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>Stars received</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)' }}>89</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
