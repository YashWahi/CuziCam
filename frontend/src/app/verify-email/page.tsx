'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import styles from './page.module.css';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!userId) {
      router.push('/signup');
    }
  }, [userId, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authApi.verifyOTP({ userId: userId!, otp });
      setSuccess('Email verified successfully! Redirecting...');
      
      // Post-verification flow: check if user needs onboarding
      // For now, we redirect to onboarding as per current flow
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    setError('');
    try {
      await authApi.resendOtp(userId!);
      setSuccess('A new code has been sent to your email.');
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <h1 className="serif">Verify your email</h1>
          <p className="mono">We've sent a 6-digit code to <br /><strong>{email || 'your email'}</strong></p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        <form onSubmit={handleVerify} className={styles.form}>
          <Input 
            label="Verification Code"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            disabled={loading}
            fullWidth
            style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
          />

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
            disabled={otp.length !== 6 || loading}
          >
            Verify Account
          </Button>
        </form>

        <div className={styles.footer}>
          <p className="mono">Didn't get the code?</p>
          <button 
            onClick={handleResend} 
            disabled={resending || cooldown > 0}
            className={styles.resendBtn}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
