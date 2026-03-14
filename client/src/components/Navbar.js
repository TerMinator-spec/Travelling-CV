'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, MessageCircle, PlusCircle, Search, Menu, X, Map, LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (pathname === '/') return null; // Hide on landing

  const navLinks = user ? [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/messages', label: 'Chat', icon: MessageCircle },
    { href: '/trips', label: 'Trips', icon: Map },
  ] : [];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/discover?q=${encodeURIComponent(searchQuery)}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href={user ? '/feed' : '/'} className="navbar-brand">
          <span className="globe">🌍</span>
          Travelling CV
        </Link>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className={isActive(href) ? 'active' : ''} onClick={() => setMenuOpen(false)}>
                <Icon size={18} />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {user && (
            <>
              {searchOpen ? (
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{ width: '200px', padding: '6px 12px', fontSize: '0.85rem' }}
                  />
                  <button type="button" className="btn-icon btn-ghost" onClick={() => setSearchOpen(false)}>
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <button className="btn-icon btn-ghost" onClick={() => setSearchOpen(true)}>
                  <Search size={18} />
                </button>
              )}
              <Link href="/posts/create" className="btn btn-primary btn-sm">
                <PlusCircle size={16} />
                Post
              </Link>
              <Link href={`/profile/${user.id}`}>
                <div className="navbar-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    user.name?.charAt(0)
                  )}
                </div>
              </Link>
              <button className="btn-icon btn-ghost" onClick={logout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          )}
          {!user && (
            <Link href="/auth" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
