'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { chaosApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';
import styles from './page.module.css';

export default function QueuePage() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const router = useRouter();

  const [onlineCount, setOnlineCount] = useState(0);
  const [inQueue, setInQueue] = useState(0);
  const [status, setStatus] = useState('Finding your vibe...');
  const [chaosActive, setChaosActive] = useState(false);
  
  // Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    mode: 'random',
    collegeOnly: false,
    year: '',
  });

  const joinQueue = useCallback((currentFilters = filters) => {
    if (!socket || !isConnected) return;
    
    console.log('[Queue] Joining with filters:', currentFilters);
    socket.emit('match:join', { 
      mode: currentFilters.mode, 
      preferences: {
        collegeOnly: currentFilters.collegeOnly,
        year: currentFilters.year || undefined
      } 
    });
  }, [socket, isConnected, filters]);

  // Fetch Chaos Status
  useEffect(() => {
    chaosApi.getStatus()
      .then((res: any) => setChaosActive(res.data?.isActive || false))
      .catch(() => {
        // Silently hide chaos banner on failure
        setChaosActive(false);
      });
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleStats = (data: { onlineCount: number; inQueue: number }) => {
      setOnlineCount(data.onlineCount);
      setInQueue(data.inQueue);
    };

    const handleSearching = () => {
      setStatus('Finding your vibe...');
    };

    const handleMatchFound = (data: { sessionId: string; role: string }) => {
      setStatus('Match found! Connecting...');
      setTimeout(() => {
        router.push(`/chat/${data.sessionId}?role=${data.role}`);
      }, 1500);
    };

    const handleError = (err: any) => {
      console.error('[Queue Error]', err);
      setStatus('Something went wrong. Retrying...');
    };

    socket.on('queue:stats', handleStats);
    socket.on('match:searching', handleSearching);
    socket.on('match:found', handleMatchFound);
    socket.on('error', handleError);

    // Initial join when connected
    if (isConnected) {
      joinQueue();
    }

    return () => {
      socket.off('queue:stats', handleStats);
      socket.off('match:searching', handleSearching);
      socket.off('match:found', handleMatchFound);
      socket.off('error', handleError);
    };
  }, [socket, isConnected, joinQueue, router]);

  const handleCancel = () => {
    if (socket) {
      socket.emit('match:cancel');
    }
    router.push('/dashboard');
  };

  const handleSaveFilters = () => {
    joinQueue(filters);
    setIsFilterModalOpen(false);
  };

  return (
    <div className={styles.queueContainer}>
      <AnimatePresence>
        {!isConnected && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            exit={{ y: -50 }}
            className={styles.reconnectBanner}
          >
            Connection lost. Reconnecting...
          </motion.div>
        )}
      </AnimatePresence>

      {chaosActive && (
        <div className={styles.chaosBanner}>
          CHAOS WINDOW IS ACTIVE
        </div>
      )}

      <div className={styles.backgroundEffects} />

      <motion.h1 
        className={styles.searchingText}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      >
        {status}
      </motion.h1>

      <div className={styles.matchCore}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={styles.pulseRing}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut"
            }}
          />
        ))}

        <div className={styles.centerInfo}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Avatar size="lg" name={user?.name || 'You'} style={{ border: '4px solid var(--accent-primary)' }} />
          </motion.div>
          <h2 className="serif">Searching.</h2>
        </div>

        <div className={styles.floatingAvatars}>
          {[
            { top: '10%', left: '15%' },
            { top: '30%', right: '20%' },
            { bottom: '25%', left: '25%' },
            { top: '60%', right: '10%' }
          ].map((pos, i) => (
            <motion.div
              key={i}
              className={styles.avatarItem}
              style={pos}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.2 }}
              transition={{ delay: i * 0.5 }}
            >
              <Avatar size="md" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className={styles.overlay}>
        <div className={styles.liveStats}>
          <div className={styles.statItem}>
            <div className={styles.statusDot} />
            <span>{onlineCount.toLocaleString()} STUDENTS ONLINE</span>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statusDot} style={{ backgroundColor: 'var(--accent-secondary)', boxShadow: '0 0 10px var(--accent-secondary)' }} />
            <span>{inQueue.toLocaleString()} IN MATCH QUEUE</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" className="mono" onClick={handleCancel}>
            CANCEL SEARCH
          </Button>
          <Button variant="secondary" className="mono" onClick={() => setIsFilterModalOpen(true)}>
            CHANGE FILTERS
          </Button>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)}
        title="Matching Preferences"
      >
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label>Matching Mode</label>
            <div className={styles.modeSelector}>
              {['random', 'study', 'debate'].map(m => (
                <button
                  key={m}
                  className={`${styles.modeButton} ${filters.mode === m ? styles.activeMode : ''}`}
                  onClick={() => setFilters({ ...filters, mode: m })}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={filters.collegeOnly} 
                onChange={(e) => setFilters({ ...filters, collegeOnly: e.target.checked })}
              />
              <span>Only match with students from my college</span>
            </label>
          </div>

          <div className={styles.filterGroup}>
            <label>Year Filter</label>
            <select 
              className={styles.selectInput}
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            >
              <option value="">Any Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <Button fullWidth onClick={handleSaveFilters}>
              SAVE & RE-JOIN QUEUE
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
