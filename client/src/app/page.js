'use client';
import Link from 'next/link';
import { Globe, Users, Map, MessageCircle, Compass, Shield, Star, ArrowRight, Plane } from 'lucide-react';

export default function LandingPage() {
  return (
    <div>
      <div className="hero">
        {/* Floating elements */}
        <span className="floating-element" style={{ top: '15%', left: '10%', animationDelay: '0s' }}>✈️</span>
        <span className="floating-element" style={{ top: '20%', right: '15%', animationDelay: '2s' }}>🏔️</span>
        <span className="floating-element" style={{ top: '60%', left: '8%', animationDelay: '1s' }}>🌊</span>
        <span className="floating-element" style={{ top: '70%', right: '10%', animationDelay: '3s' }}>🎒</span>
        <span className="floating-element" style={{ top: '40%', left: '20%', animationDelay: '4s' }}>🗺️</span>
        <span className="floating-element" style={{ top: '50%', right: '20%', animationDelay: '1.5s' }}>⛺</span>

        <div className="hero-content">
          <h1 className="animate-in">
            Your Journey,<br />Your Story
          </h1>
          <p className="animate-in-delay-1">
            Build your travel resume, find compatible travel partners, and collaborate on the next big adventure. The social platform made for explorers.
          </p>
          <div className="hero-actions animate-in-delay-2">
            <Link href="/auth" className="btn btn-primary btn-lg">
              Start Your CV
              <ArrowRight size={20} />
            </Link>
            <Link href="/auth" className="btn btn-secondary btn-lg">
              Explore Travelers
            </Link>
          </div>
          <div className="hero-stats animate-in-delay-3">
            <div className="hero-stat">
              <div className="number">10K+</div>
              <div className="label">Travelers</div>
            </div>
            <div className="hero-stat">
              <div className="number">195</div>
              <div className="label">Countries</div>
            </div>
            <div className="hero-stat">
              <div className="number">50K+</div>
              <div className="label">Trips Shared</div>
            </div>
            <div className="hero-stat">
              <div className="number">85%</div>
              <div className="label">Match Rate</div>
            </div>
          </div>
        </div>
      </div>

      <section className="features-section container">
        <h2>Everything Travelers Need</h2>
        <div className="grid-3">
          <div className="card feature-card animate-in">
            <div className="icon">🌍</div>
            <h3>Travel Resume</h3>
            <p>Showcase your travel history, skills, and experiences in a beautiful public profile that tells your travel story.</p>
          </div>
          <div className="card feature-card animate-in-delay-1">
            <div className="icon">🤝</div>
            <h3>Find Travel Partners</h3>
            <p>Our compatibility algorithm matches you with travelers who share your style, budget, and dream destinations.</p>
          </div>
          <div className="card feature-card animate-in-delay-2">
            <div className="icon">📊</div>
            <h3>Compatibility Score</h3>
            <p>See how well you match with other travelers based on destinations, style, budget, and travel dates.</p>
          </div>
          <div className="card feature-card animate-in">
            <div className="icon">💬</div>
            <h3>Real-time Chat</h3>
            <p>Message travelers directly, plan trips together, and join group conversations about destinations.</p>
          </div>
          <div className="card feature-card animate-in-delay-1">
            <div className="icon">🗺️</div>
            <h3>Trip Collaboration</h3>
            <p>Post your travel plans and find companions. Or browse open trips and request to join exciting adventures.</p>
          </div>
          <div className="card feature-card animate-in-delay-2">
            <div className="icon">🏆</div>
            <h3>Badges & Stats</h3>
            <p>Earn badges as you explore. Track countries, cities, continents, and climb the explorer leaderboard.</p>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 0 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Ready to Build Your Travel CV?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
          Join thousands of travelers sharing their journeys
        </p>
        <Link href="/auth" className="btn btn-primary btn-lg">
          Get Started Free <ArrowRight size={20} />
        </Link>
      </section>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '40px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <span>🌍</span>
            <strong style={{ color: 'var(--text-secondary)' }}>Travelling CV</strong>
          </div>
          <p>© 2026 Travelling CV. Made for travelers, by travelers.</p>
        </div>
      </footer>
    </div>
  );
}
