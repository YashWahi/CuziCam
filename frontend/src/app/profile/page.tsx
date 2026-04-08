"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const INTEREST_OPTIONS = [
  'Python', 'React', 'Photography', 'Gaming', 'Football', 'Anime', 
  'Hiking', 'Music Production', 'Startups', 'Blockchain', 'Reading', 'Lo-fi'
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD'];

export default function ProfilePage() {
  const [name, setName] = useState('Anonymous Student');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const router = useRouter();

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = () => {
    // TODO: Send to /api/users/profile
    router.push('/chat'); // Ready to match!
  };

  return (
    <div className="profile-container glass animate-fade-in">
      <div className="profile-header">
        <h1>Setup Your Vibe</h1>
        <p>Tell us a bit about you to help our AI find your best matches.</p>
      </div>

      <div className="profile-section">
        <label>Your Name</label>
        <input 
          type="text" 
          className="input" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
      </div>

      <div className="profile-grid">
        <div className="profile-section">
          <label>Department / Branch</label>
          <input 
            type="text" 
            className="input" 
            placeholder="e.g. CSE, IT" 
            value={branch} 
            onChange={(e) => setBranch(e.target.value)} 
          />
        </div>
        <div className="profile-section">
          <label>Year of Study</label>
          <select 
            className="input" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Select Year</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="profile-section">
        <label>Your Interests (Select at least 3)</label>
        <div className="interests-grid">
          {INTEREST_OPTIONS.map(interest => (
            <button 
              key={interest} 
              className={`interest-chip ${interests.includes(interest) ? 'active' : ''}`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-primary btn-block" 
        onClick={handleSave}
        disabled={interests.length < 3}
      >
        {interests.length < 3 ? `Pick ${3 - interests.length} more` : "Ready to Start Matching"}
      </button>

      <style jsx>{`
        .profile-container { max-width: 600px; margin: 60px auto; padding: 40px; border-radius: var(--border-radius-lg); }
        .profile-header { text-align: center; margin-bottom: 40px; }
        .profile-section { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .interests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-top: 8px; }
        .interest-chip { 
          padding: 10px; 
          border-radius: 20px; 
          background: var(--bg-tertiary); 
          border: 1px solid rgba(255,255,255,0.1); 
          color: var(--text-secondary); 
          cursor: pointer; 
          transition: var(--transition); 
          font-weight: 500;
        }
        .interest-chip.active { background: var(--accent-gradient); color: white; border-color: transparent; }
        .btn-block { width: 100%; padding: 16px; margin-top: 20px; font-size: 1.1rem; }
      `}</style>
    </div>
  );
}
