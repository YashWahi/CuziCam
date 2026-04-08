"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to BE /api/auth/login
    // Mock login
    if (email.endsWith('.edu')) {
      localStorage.setItem('token', 'mock_token');
      router.push('/chat');
    } else {
      setError('Please use a valid college (.edu) email.');
    }
  };

  return (
    <div className="auth-container glass animate-fade-in">
      <div className="auth-header">
        <h1>Welcome Back</h1>
        <p>Login to start vibing with your campus.</p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="email">College Email (.edu)</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="name@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="Your secret password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn btn-primary btn-block">Login</button>
      </form>

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <button className="btn btn-secondary btn-block">
        Continue with Google
      </button>

      <div className="auth-footer">
        Don't have an account? <Link href="/register">Join CuziCam</Link>
      </div>

      <style jsx>{`
        .auth-container {
          max-width: 450px;
          margin: 100px auto;
          padding: 40px;
          border-radius: var(--border-radius-lg);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-header h1 { font-size: 2.25rem; margin-bottom: 8px; }
        .auth-header p { color: var(--text-muted); }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }
        .auth-divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; color: var(--text-muted); font-size: 0.875rem; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        .auth-footer { text-align: center; margin-top: 32px; font-size: 0.9rem; color: var(--text-muted); }
        .auth-footer a { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
        .error-message { color: var(--danger); font-size: 0.875rem; text-align: center; }
        .btn-block { width: 100%; height: 50px; }
      `}</style>
    </div>
  );
}
