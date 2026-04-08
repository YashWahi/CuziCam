import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="glass">
        <div className="logo">CuziCam</div>
        <div className="nav-links">
          <Link href="/confessions">Confessions</Link>
          <button className="btn btn-primary btn-sm">Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-fade-in">
          <div className="badge glass">Exclusive for .edu students</div>
          <h1>Find your people. <br /><span>Real conversations, real vibes.</span></h1>
          <p>
            CuziCam is the ultimate safe space for college students to connect, 
            confess, and chat. No bots, no fakes—just your campus community.
          </p>
          <div className="hero-actions">
            <Link href="/chat" className="btn btn-primary btn-lg">
              🚀 Join the Match Queue
            </Link>
            <Link href="/confessions" className="btn btn-secondary btn-lg">
              🎭 Read Confessions
            </Link>
          </div>
          <div className="social-proof">
            <div className="avatars">
              {/* Mock Avatars */}
              <div className="avatar-circle"></div>
              <div className="avatar-circle"></div>
              <div className="avatar-circle"></div>
              <div className="avatar-circle"><span>+10k</span></div>
            </div>
            <p>10,000+ students active across 500+ colleges</p>
          </div>
        </div>
        <div className="hero-visual animate-pulse-slow">
          {/* A conceptual visualization of connections */}
          <div className="visual-circle outer"></div>
          <div className="visual-circle middle"></div>
          <div className="visual-circle inner"></div>
          <div className="floating-card glass top-left">✨ CS Major?</div>
          <div className="floating-card glass bottom-right">⚽ Shared: Football</div>
          <div className="floating-card glass top-right">🔥 9.5 Vibe Score</div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="features-section">
        <div className="feature-card glass">
          <div className="icon">🔒</div>
          <h3>Safe & Verified</h3>
          <p>Only verified .edu emails can join. We use AI to keep the community toxic-free.</p>
        </div>
        <div className="feature-card glass">
          <div className="icon">🤖</div>
          <h3>AI Matchmaking</h3>
          <p>We match you based on your interests, college, and even your vibe score.</p>
        </div>
        <div className="feature-card glass">
          <div className="icon">🎭</div>
          <h3>Confessions Board</h3>
          <p>Anonymously share your thoughts on campus life and see what's trending.</p>
        </div>
      </section>

      {/* Chaos Window Teaser */}
      <section className="chaos-section glass animate-fade-in">
        <div className="chaos-content">
          <h2>The <span>Chaos Window</span> is coming...</h2>
          <p>A daily 2-hour window where the rules of matching change. Are you ready for the vibe shift?</p>
        </div>
        <button className="btn btn-danger">Set Reminder</button>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-links">
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Safety Guidelines</Link>
        </div>
        <p>© 2026 CuziCam. Built with ❤️ for students.</p>
      </footer>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          overflow-x: hidden;
          background: radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 100%);
        }

        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 4rem;
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo {
          font-size: 1.75rem;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 500;
          transition: var(--transition);
        }

        .nav-links a:hover {
          color: var(--text-primary);
        }

        .btn-sm { padding: 0.5rem 1.25rem; font-size: 0.875rem; }

        .hero-section {
          padding: 10rem 4rem 6rem;
          display: flex;
          align-items: center;
          gap: 4rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .hero-content { flex: 1.2; }

        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: var(--accent-primary);
          font-weight: 700;
          font-size: 0.875rem;
          margin-bottom: 2rem;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .hero-content h1 {
          font-size: 4.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -2px;
        }

        .hero-content span {
          color: var(--accent-primary);
        }

        .hero-content p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 3rem;
          max-width: 600px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }

        .social-proof {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatars { display: flex; }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #475569;
          border: 2px solid var(--bg-primary);
          margin-left: -12px;
        }

        .avatar-circle:first-child { margin-left: 0; }

        .avatar-circle span {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        .social-proof p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .hero-visual {
          flex: 0.8;
          position: relative;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .visual-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(139, 92, 246, 0.1);
        }

        .outer { width: 500px; height: 500px; animation: spin 20s linear infinite; }
        .middle { width: 350px; height: 350px; border-color: rgba(59, 130, 246, 0.15); animation: spin 15s linear reverse infinite; }
        .inner { width: 200px; height: 200px; background: rgba(139, 92, 246, 0.05); }

        .floating-card {
          position: absolute;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          white-space: nowrap;
          z-index: 10;
        }

        .top-left { top: 10%; left: 0; border-left: 3px solid var(--accent-primary); }
        .bottom-right { bottom: 20%; right: 0; border-right: 3px solid #3b82f6; }
        .top-right { top: 30%; right: 10%; background: var(--accent-gradient); color: white; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .features-section {
          padding: 6rem 4rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feature-card {
          padding: 3rem;
          border-radius: var(--border-radius-lg);
          text-align: center;
          transition: var(--transition);
        }

        .feature-card:hover { transform: translateY(-10px); }

        .feature-card .icon {
          font-size: 3.5rem;
          margin-bottom: 2rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .chaos-section {
          max-width: 1200px;
          margin: 4rem auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4rem 6rem;
          border-radius: var(--border-radius-lg);
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .chaos-content h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .chaos-content span { color: var(--danger); text-transform: uppercase; }

        .chaos-content p { color: var(--text-secondary); font-size: 1.1rem; }

        footer {
          padding: 6rem 4rem 4rem;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-bottom: 2rem;
        }

        .footer-links a {
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          transition: var(--transition);
        }

        .footer-links a:hover { color: var(--text-primary); }

        footer p { color: var(--text-muted); font-size: 0.8rem; }

        @media (max-width: 1024px) {
          .hero-section { flex-direction: column; text-align: center; padding: 8rem 2rem 4rem; }
          .hero-content h1 { font-size: 3.5rem; }
          .hero-content p { margin: 0 auto 2rem; }
          .hero-actions { justify-content: center; }
          .social-proof { justify-content: center; }
          .hero-visual { display: none; }
          .features-section { grid-template-columns: 1fr; padding: 4rem 2rem; }
          .chaos-section { flex-direction: column; text-align: center; gap: 2rem; padding: 3rem 2rem; }
          nav { padding: 1rem 2rem; }
        }
      `}</style>
    </div>
  );
}
