'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';
import styles from '../signin/page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <span className="serif">Reset</span> <br />
            <span className="serif" style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>password.</span>
          </h1>
          
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.iconBox}>🔒</div>
              <span className="mono">Secure account recovery</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.iconBox}>📧</div>
              <span className="mono">Quick email verification</span>
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
            <h2 className="serif">Forgot Password</h2>
            <p>Remember your password? <Link href="/signin">Sign in</Link></p>
          </div>

          {success ? (
            <div className={styles.successBanner} style={{ backgroundColor: 'rgba(52, 168, 83, 0.1)', color: '#34A853', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(52, 168, 83, 0.2)' }}>
              Check your email for a reset link ✓
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className={styles.errorBanner}>{error}</div>}

              <Input
                label="College Email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />

              <Button type="submit" fullWidth disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <p className={styles.switchLink} style={{ marginTop: '2rem' }}>
            <Link href="/signin">← Back to Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
