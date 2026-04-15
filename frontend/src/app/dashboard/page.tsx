'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { userApi, chaosApi } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Sidebar } from '@/components/Sidebar';
import styles from './page.module.css';

interface Connection {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  college: string;
  connectedAt: string;
}

interface ChaosStatus {
  isActive: boolean;
  scheduledHour: number;
  scheduledEnd: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [chaosStatus, setChaosStatus] = React.useState<ChaosStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [connRes, chaosRes] = await Promise.all([
          userApi.getConnections(),
          chaosApi.getStatus(),
        ]);
        setConnections(connRes.data);
        setChaosStatus(chaosRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
              <h3 className="mono" style={{ margin: 0 }}>
                {chaosStatus?.isActive ? 'THE CHAOS WINDOW IS OPEN' : 'THE CHAOS WINDOW IS CLOSED'}
              </h3>
              <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                {chaosStatus?.isActive 
                  ? `Ends at ${chaosStatus.scheduledEnd}:00. Anything can happen.` 
                  : `Opens at ${chaosStatus?.scheduledHour || 22}:00 tonight. Get ready.`}
              </p>
            </div>
            {chaosStatus?.isActive ? (
               <Link href="/queue">
                <Button variant="primary" size="sm">Join Now</Button>
               </Link>
            ) : (
              <Button variant="outline" size="sm">Set Reminder</Button>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.vibeCard}>
            <span className={styles.scoreLabel}>Vibe Score</span>
            <div className={styles.score}>{user?.vibeScore || '0.0'}</div>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.vibeScore && user.vibeScore > 8 ? 'Top 5% of your campus. Keep keeping it real.' : 'Start matching to build your score.'}
            </p>
          </div>
          <Card className={styles.vibeCard}>
            <span className={styles.scoreLabel}>Active Matches</span>
            <div className={styles.score} style={{ color: 'var(--accent-secondary)' }}>{connections.length}</div>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connections made. Keep chatting.</p>
          </Card>
        </div>

        <div className={styles.contentRow}>
          <section>
            <div className={styles.sectionTitle}>
              <span className="serif">Recent Stars</span>
              <Badge label="Connect" count={connections.length} />
            </div>
            
            <div className={styles.connectionGrid}>
              {connections.length > 0 ? (
                connections.map(conn => (
                  <Card key={conn.id} glass style={{ padding: '1.25rem' }}>
                    <Avatar size="md" name={conn.name} src={conn.avatarUrl} style={{ marginBottom: '1rem' }} />
                    <h4 className="serif" style={{ marginBottom: '0.25rem' }}>{conn.name}</h4>
                    <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {conn.college}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      <Badge label="New Match" />
                    </div>
                  </Card>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p className="mono" style={{ fontSize: '0.8rem' }}>No stars yet. Start matching to find your crew.</p>
                </div>
              )}
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
