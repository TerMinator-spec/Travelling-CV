'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, MessageCircle, PlusCircle, Search, Menu, X, Map, LogOut, User, Heart, Bell, Settings, HelpCircle, Bookmark, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === '/') return null; // Hide on landing

  const navLinks = user ? [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/messages', label: 'Chat', icon: MessageCircle },
    { href: '/trips', label: 'Trips', icon: Map },
  ] : [];

  const drawerLinks = user ? [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/messages', label: 'Chat', icon: MessageCircle },
    { href: '/trips', label: 'Trips', icon: Map },
    { href: '/posts/saved', label: 'Saved Posts', icon: Bookmark },
    { href: `/profile/${user.id}`, label: 'My Profile', icon: User },
  ] : [];

  const bottomNavLinks = user ? [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/posts/create', label: 'Post', icon: PlusCircle },
    { href: '/messages', label: 'Chat', icon: MessageCircle },
    { href: `/profile/${user.id}`, label: 'Profile', icon: User },
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
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href={user ? '/feed' : '/'} className="navbar-brand">
            <span className="globe">🌍</span>
            Travelling CV
          </Link>

          <ul className="navbar-links">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={isActive(href) ? 'active' : ''}>
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
                  <button className="btn-icon btn-ghost desktop-only" onClick={() => setSearchOpen(true)}>
                    <Search size={18} />
                  </button>
                )}
                <Link href="/posts/create" className="btn btn-primary btn-sm desktop-only">
                  <PlusCircle size={16} />
                  Post
                </Link>
                <Link href={`/profile/${user.id}`} className="desktop-only">
                  <div className="navbar-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user.name?.charAt(0)
                    )}
                  </div>
                </Link>
                <button className="btn-icon btn-ghost desktop-only" onClick={logout} title="Logout">
                  <LogOut size={18} />
                </button>
              </>
            )}
            {!user && (
              <Link href="/auth" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )}
            {user && (
              <div className="mobile-drawer-actions">
                <Link href={`/profile/${user.id}`}>
                  <div className="navbar-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user.name?.charAt(0)
                    )}
                  </div>
                </Link>
                <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {user && (
        <div className={`drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile Right-Side Drawer */}
      {user && (
        <aside className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
          {/* User Profile Section */}
          <div className="drawer-profile">
            <div className="drawer-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <span>{user.name?.charAt(0)}</span>
              )}
            </div>
            <div className="drawer-user-info">
              <h3 className="drawer-user-name">{user.name || 'Traveler'}</h3>
              <span className="drawer-user-role">Travel Explorer</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="drawer-nav">
            {drawerLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href + label}
                href={href}
                className={`drawer-nav-item ${isActive(href) ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="drawer-footer">
            <button className="drawer-nav-item drawer-logout" onClick={() => { logout(); setMenuOpen(false); }}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="mobile-bottom-nav">
          {bottomNavLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
