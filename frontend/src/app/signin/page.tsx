'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';
import styles from './page.module.css';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response: any = await authApi.login({ email, password });
      const { token, refreshToken, user } = response;
      
      // Initialize full session/context
      await login(token, refreshToken);
      
      if (!user.isVerified) {
        router.push(`/verify-email?userId=${user.id}&email=${encodeURIComponent(email)}`);
        return;
      }

      // Check if user has completed onboarding (by checking college)
      if (!user.college || !user.college.id) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
            <span className="serif">Welcome</span> <br />
            <span className="serif" style={{ color: 'var(--accent-primary)', fontStyle: 'italic' }}>back.</span>
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
            <h2 className="serif">Sign in to CuziCam</h2>
            <p>New here? <Link href="/signup">Create account</Link></p>
          </div>

          <Button variant="secondary" fullWidth className={styles.googleBtn} onClick={() => alert('Google OAuth coming soon!')}>
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

          <form onSubmit={handleLogin}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <Input
              label="College Email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <div className={styles.passwordHeader}>
              <label>Password</label>
              <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>
            
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              style={{ marginTop: '-0.5rem' }} 
            />

            <Button type="submit" fullWidth disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className={styles.switchLink}>
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
