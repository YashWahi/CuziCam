'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { Tag } from '@/components/Tag';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingContainer}>
      <nav className={styles.nav}>
        <div className={styles.logo}>CuziCam</div>
        <div className={styles.navLinks}>
          <Link href="/confessions">CONFESSIONS</Link>
          <Link href="/signin">SIGN IN</Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">JOIN NOW</Button>
          </Link>
        </div>
      </nav>

      <header className={styles.heroSection}>
        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mono" style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>// CAMPUS_VIBE_TERMINAL_V2.0</p>
          <h1 className="serif">
            Find your people. <br />
            <span className={styles.italic}>Real conversations.</span>
          </h1>
          <p>
            Exclusive real-time anonymous video and text chat platform for verified college students. 
            No bots. No fakes. Just your campus.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup">
              <Button variant="primary" size="lg" style={{ padding: '1.5rem 3rem' }}>
                START MATCHING
              </Button>
            </Link>
            <Link href="/confessions">
              <Button variant="outline" size="lg" style={{ padding: '1.5rem 3rem' }}>
                READ CONFESSIONS
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className={styles.heroVisual}>
          <motion.div 
            className={`${styles.floatingCard} ${styles.card1}`}
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Badge variant="primary">Active Match</Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Avatar size="sm" />
              <div>
                <p className="mono" style={{ fontSize: '0.75rem' }}>Match found!</p>
                <p className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Vibe Score: 9.8</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className={`${styles.floatingCard} ${styles.card2}`}
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>SHARED_INTERESTS</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Tag variant="outline">Coding</Tag>
              <Tag variant="outline">Anime</Tag>
            </div>
          </motion.div>

          <motion.div 
            className={`${styles.floatingCard} ${styles.card3}`}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <p className="serif" style={{ fontStyle: 'italic' }}>"I haven't slept in 48 hours..."</p>
            <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Latest Confession - Stanford</p>
          </motion.div>
        </div>
      </header>

      <section className={styles.statsStrip}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>10K+</span>
          <span className={styles.statLabel}>Students Active</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>500+</span>
          <span className={styles.statLabel}>Colleges Verified</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>1M+</span>
          <span className={styles.statLabel}>Matches Made</span>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🛡️</span>
            <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>.EDU VERIFIED</h3>
            <p className="mono" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Only students with a valid college email can join. No outsiders, no bots.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🤖</span>
            <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI MATCHMAKING</h3>
            <p className="mono" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Our AI analyzes your vibes and interests to find the perfect conversation partner.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>⚡</span>
            <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>VIBE SCORING</h3>
            <p className="mono" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Maintain high etiquette to boost your vibe score and unlock exclusive status badges.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.chaosSection}>
        <div className={styles.chaosText}>
          <p className="mono" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>THE_DAILY_PROTOCOL</p>
          <h2 className="serif">The <span className={styles.glitch}>CHAOS WINDOW</span> <br />is coming.</h2>
          <p className="mono" style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
            A daily 2-hour window where the rules of matchmaking shift. Unexpected connections, anonymous thrills, and pure campus chaos.
          </p>
        </div>
        <Button variant="danger" size="lg" style={{ padding: '1.5rem 3rem' }}>
          SET REMINDER
        </Button>
      </section>

      <footer className={styles.footer}>
        <div className={styles.logo}>CuziCam</div>
        <div className={styles.navLinks}>
          <Link href="#">PRIVACY</Link>
          <Link href="#">TERMS</Link>
          <Link href="#">SAFETY</Link>
        </div>
        <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          © 2026 CUZICAM PROJECT. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
