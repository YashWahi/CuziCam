"use client";

import React, { useEffect, useState } from 'react';
import './confessions.css';

interface Confession {
  id: string;
  content: string;
  upvotes: number;
  createdAt: string;
}

export default function ConfessionsPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newConfession, setNewConfession] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock fetching confessions initially
  useEffect(() => {
    // In production, fetch from /api/confessions
    const mockConfessions: Confession[] = [
      { id: '1', content: 'Met someone on CuziCam today and we talked for 2 hours! 💖', upvotes: 42, createdAt: new Date().toISOString() },
      { id: '2', content: "Anyone else struggling with the DS exam next week? 😭", upvotes: 15, createdAt: new Date().toISOString() },
      { id: '3', content: "The Chaos Window was wild today lol.", upvotes: 89, createdAt: new Date().toISOString() },
    ];
    
    setConfessions(mockConfessions);
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfession.trim()) return;

    const confession: Confession = {
      id: Math.random().toString(36).substr(2, 9),
      content: newConfession,
      upvotes: 0,
      createdAt: new Date().toISOString(),
    };

    setConfessions([confession, ...confessions]);
    setNewConfession('');
  };

  const handleUpvote = (id: string) => {
    setConfessions(confessions.map(c => 
      c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
    ));
  };

  return (
    <div className="confessions-container">
      <header className="confessions-header glass">
        <h1>Campus Confessions</h1>
        <p>Anonymous board for your college.</p>
      </header>

      <form className="post-confession glass animate-fade-in" onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind? Keep it anonymous."
          value={newConfession}
          onChange={(e) => setNewConfession(e.target.value)}
          className="input"
          rows={3}
        />
        <button type="submit" className="btn btn-primary">Post Anonymously</button>
      </form>

      <div className="confessions-list">
        {loading ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : (
          confessions.map((c) => (
            <div key={c.id} className="confession-card glass animate-fade-in">
              <p className="content">{c.content}</p>
              <div className="footer">
                <span className="timestamp">{new Date(c.createdAt).toLocaleDateString()}</span>
                <button className="upvote-btn" onClick={() => handleUpvote(c.id)}>
                  🔥 {c.upvotes} Upvotes
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
