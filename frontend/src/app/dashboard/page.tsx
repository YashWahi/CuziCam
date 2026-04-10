'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Sidebar } from '@/components/Sidebar';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user } = useAuth();

  const MOCK_CONNECTIONS = [
    { id: '1', name: 'Alex', college: 'MIT', year: 'Jr', interests: ['Coding', 'Gaming'] },
    { id: '2', name: 'Zoe', college: 'Stanford', year: 'So', interests: ['Design', 'Art'] },
  ];

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      {/* Main Content */}
      <main className={styles.mainContainer}>
        <header className={styles.header}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mono" style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>// DASHBOARD_V2.0</p>
            <h1 className="serif">Good vibes, <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>{user?.name?.split(' ')[0] || 'friend'}.</span></h1>
          </motion.div>
        </header>

        <div className={styles.chaosBanner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="mono" style={{ margin: 0 }}>THE CHAOS WINDOW IS CLOSED</h3>
              <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Opens at 10 PM tonight. Get ready.</p>
            </div>
            <Button variant="outline" size="sm">Set Reminder</Button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.vibeCard}>
            <span className={styles.scoreLabel}>Vibe Score</span>
            <div className={styles.score}>9.8</div>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 5% of your campus. Keep keeping it real.</p>
          </div>
          <Card className={styles.vibeCard}>
            <span className={styles.scoreLabel}>Active Matches</span>
            <div className={styles.score} style={{ color: 'var(--accent-secondary)' }}>12</div>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connections made this week. Keep chatting.</p>
          </Card>
        </div>

        <div className={styles.contentRow}>
          <section>
            <div className={styles.sectionTitle}>
              <span className="serif">Recent Stars</span>
              <Badge label="Connect" count={MOCK_CONNECTIONS.length} />
            </div>
            
            <div className={styles.connectionGrid}>
              {MOCK_CONNECTIONS.map(conn => (
                <Card key={conn.id} glass style={{ padding: '1.25rem' }}>
                  <Avatar size="md" name={conn.name} style={{ marginBottom: '1rem' }} />
                  <h4 className="serif" style={{ marginBottom: '0.25rem' }}>{conn.name}</h4>
                  <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {conn.college} • {conn.year}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {conn.interests.map(i => <Badge key={i} label={i} />)}
                  </div>
                </Card>
              ))}
              <div className={styles.emptyState}>
                <p className="mono" style={{ fontSize: '0.8rem' }}>More connections await in the queue.</p>
              </div>
            </div>
          </section>

          <aside>
            <div className={styles.sectionTitle}>
              <span className="serif">Quick Actions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button fullWidth style={{ justifyContent: 'flex-start', height: 'auto', padding: '1.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--bg-primary)', fontWeight: 800 }}>START CHATTING</div>
                  <div className="serif" style={{ fontSize: '1.25rem', color: 'var(--bg-primary)' }}>Enter the Match Queue</div>
                </div>
              </Button>
              <Button variant="outline" fullWidth style={{ justifyContent: 'flex-start', height: 'auto', padding: '1.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>CAMPUS TEA</div>
                  <div className="serif" style={{ fontSize: '1.25rem' }}>Read Confessions</div>
                </div>
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
