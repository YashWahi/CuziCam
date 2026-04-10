'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';
import styles from '../signin/page.module.css';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('.edu') && !email.includes('ac.in')) {
      setError('Please use a valid college (.edu) email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // Mock register logic -> redirect to onboarding
    setTimeout(() => {
      // Store temp signup info
      localStorage.setItem('temp_signup_email', email);
      localStorage.setItem('temp_signup_name', name);
      router.push('/onboarding');
    }, 1000);
  };

  return (
    <div className={styles.splitContainer}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <motion.div 
          className={styles.leftContent}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.headline}>
            <span className="serif">Join the</span> <br />
            <span className="serif" style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>community.</span>
          </h1>
          
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.iconBox}>🎓</div>
              <span className="mono">Verified college students only</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.iconBox}>🤖</div>
              <span className="mono">AI-matched conversations</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.iconBox}>🛡️</div>
              <span className="mono">Safe, moderated environment</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <motion.div 
          className={styles.formContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.formHeader}>
            <h2 className="serif">Create your account</h2>
            <p>Already have an account? <Link href="/signin">Sign in</Link></p>
          </div>

          <Button variant="secondary" fullWidth className={styles.googleBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <form onSubmit={handleSignup}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <Input
              label="Full Name"
              type="text"
              placeholder="J. Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />

            <Input
              label="College Email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <p className={styles.helperText} style={{ marginTop: '-0.75rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Must be .edu or college domain
            </p>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
            />

            <Button type="submit" fullWidth disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}
