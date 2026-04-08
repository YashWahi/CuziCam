"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './auth.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState(''); // Handle this with a select in a real app
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('.edu')) {
      return setError('Please use a valid college (.edu) email.');
    }
    // Mock registration
    localStorage.setItem('token', 'mock_token');
    router.push('/profile'); // Redirect to profile to setup details
  };

  return (
    <div className="auth-container glass animate-fade-in">
      <div className="auth-header">
        <h1>Join the Campus</h1>
        <p>Register with your .edu email to start.</p>
      </div>

      <form className="auth-form" onSubmit={handleRegister}>
        <div className="input-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            className="input"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn btn-primary btn-block">Join Now</button>
      </form>

      <div className="auth-footer">
        Already a student? <Link href="/login">Login here</Link>
      </div>

      <style jsx>{`
        .auth-container { max-width: 450px; margin: 100px auto; padding: 40px; border-radius: var(--border-radius-lg); }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .auth-footer { text-align: center; margin-top: 32px; font-size: 0.9rem; color: var(--text-muted); }
        .auth-footer a { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
        .error-message { color: var(--danger); font-size: 0.875rem; text-align: center; }
        .btn-block { width: 100%; height: 50px; }
      `}</style>
    </div>
  );
}
