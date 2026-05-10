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
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [connRes, chaosRes] = await Promise.all<any>([
        userApi.getConnections(),
        chaosApi.getStatus(),
      ]);
      setConnections(connRes.data);
      setChaosStatus(chaosRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSetReminder = () => {
    localStorage.setItem('chaosReminder', 'true');
    setToast("Reminder set! We'll notify you 👀");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      {/* Main Content */}
      <main className={styles.mainContainer}>
        {isLoading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
            <div style={{ height: '3rem', width: '40%', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: 0.7 }} />
            <div style={{ height: '8rem', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: 0.7 }} />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ height: '6rem', flex: '1 1 300px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: 0.7 }} />
              <div style={{ height: '6rem', flex: '1 1 300px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
               <div style={{ height: '20rem', flex: '2 1 400px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: 0.7 }} />
               <div style={{ height: '10rem', flex: '1 1 200px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', opacity: 0.7 }} />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'rgba(255,0,0,0.1)', 
                color: 'var(--accent-primary)', 
                borderRadius: '8px', 
                marginBottom: '1rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span className="mono">{error}</span>
                <Button variant="secondary" size="sm" onClick={fetchDashboardData}>Retry</Button>
              </div>
            )}
            
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
                  <Button variant="secondary" size="sm" onClick={handleSetReminder}>Set Reminder</Button>
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
                  <Badge>Connect {connections.length}</Badge>
                </div>
                
                <div className={styles.connectionGrid}>
                  {connections.length > 0 ? (
                    connections.map(conn => (
                      <Card key={conn.id} style={{ padding: '1.25rem' }}>
                        <Avatar size="md" name={conn.name} url={conn.avatarUrl} style={{ marginBottom: '1rem' }} />
                        <h4 className="serif" style={{ marginBottom: '0.25rem' }}>{conn.name}</h4>
                        <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          {conn.college}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <Badge>{new Date(conn.connectedAt).toLocaleDateString()}</Badge>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <p className="mono" style={{ fontSize: '0.8rem' }}>No connections yet. Start a conversation 👋</p>
                    </div>
                  )}
                </div>
              </section>

              <aside>
                <div className={styles.sectionTitle}>
                  <span className="serif">Quick Actions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Link href="/queue?mode=random" style={{ textDecoration: 'none', width: '100%' }}>
                    <Button fullWidth style={{ justifyContent: 'flex-start', height: 'auto', padding: '1.5rem' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--bg-primary)', fontWeight: 800 }}>START CHATTING</div>
                        <div className="serif" style={{ fontSize: '1.25rem', color: 'var(--bg-primary)' }}>Enter the Match Queue</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/confessions" style={{ textDecoration: 'none', width: '100%' }}>
                    <Button variant="secondary" fullWidth style={{ justifyContent: 'flex-start', height: 'auto', padding: '1.5rem' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>CAMPUS TEA</div>
                        <div className="serif" style={{ fontSize: '1.25rem' }}>Read Confessions</div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <p className="mono" style={{ margin: 0, fontSize: '0.875rem' }}>{toast}</p>
        </div>
      )}
    </div>
  );
}
