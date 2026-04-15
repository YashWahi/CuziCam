'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { chaosApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import styles from './page.module.css';

export default function QueuePage() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(1284);
  const [inQueue, setInQueue] = useState(42);
  const [status, setStatus] = useState('Finding your vibe...');
  const [chaosActive, setChaosActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    chaosApi.getStatus().then(res => setChaosActive(res.data.isActive)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join queue as soon as we enter
    socket.emit('match:join', { mode: 'random', preferences: {} });

    socket.on('match:searching', () => {
      setStatus('Finding your vibe...');
    });

    socket.on('match:found', (data) => {
      setStatus('Match found! Connecting...');
      // Store match data in state or local storage if needed, 
      // but the chat page will also listen or we can pass via URL
      setTimeout(() => {
        router.push(`/chat/${data.sessionId}?role=${data.role}`);
      }, 1500);
    });

    socket.on('error', (err) => {
      console.error('[Queue Error]', err);
      setStatus('Something went wrong. Retrying...');
    });

    // Minor fluctuation in numbers for realism (or fetch from server if API exists)
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setInQueue(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 3000);

    return () => {
      socket.off('match:searching');
      socket.off('match:found');
      socket.off('error');
      clearInterval(interval);
    };
  }, [socket, isConnected, router]);

  const handleCancel = () => {
    if (socket) {
      socket.emit('match:cancel');
    }
    router.push('/dashboard');
  };

  return (
    <div className={styles.queueContainer}>
      {chaosActive && (
        <div style={{ position: 'absolute', top: 0, width: '100%', background: 'red', color: 'white', textAlign: 'center', padding: '0.5rem', zIndex: 10 }}>
          CHAOS WINDOW IS ACTIVE
        </div>
      )}
      <div className={styles.backgroundEffects}>
        {/* Subtle background motion can go here */}
      </div>

      <motion.h1 
        className={styles.searchingText}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      >
        {status}
      </motion.h1>

      <div className={styles.matchCore}>
        {/* Pulsing Rings */}
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

        {/* Floating "Potential Matches" silhouettes */}
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
            <span>{inQueue} IN MATCH QUEUE</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" className="mono" onClick={handleCancel}>
            CANCEL SEARCH
          </Button>
          <Button variant="outline" className="mono">
            CHANGE FILTERS
          </Button>
        </div>
      </div>
    </div>
  );
}
