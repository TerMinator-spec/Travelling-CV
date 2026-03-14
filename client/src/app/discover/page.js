'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Globe, Search, Filter, Users, Compass, MessageCircle, Heart } from 'lucide-react';
import CompatibilityBadge from '../../components/CompatibilityBadge';

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    travel_style: '', country: '', destination: '', location: ''
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState(null);
  const [compatScores, setCompatScores] = useState({});

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (searchParams.get('q')) handleSearch();
    else loadTravelers();
  }, [user, authLoading]);

  const loadTravelers = async () => {
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const data = await api.discoverTravelers(activeFilters);
      setTravelers(data.filter(t => t.id !== user?.id));
      setSearchResults(null);
      
      // Load compatibility scores
      if (user) {
        data.filter(t => t.id !== user.id).slice(0, 10).forEach(async (t) => {
          try {
            const compat = await api.getCompatibility(t.id);
            setCompatScores(prev => ({ ...prev, [t.id]: compat.score }));
          } catch (err) {}
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadTravelers(); return; }
    setLoading(true);
    try {
      const results = await api.search({ q: searchQuery });
      setSearchResults(results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFilter = () => {
    setLoading(true);
    loadTravelers();
  };

  if (authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  const travelStyles = ['backpacking', 'luxury', 'digital nomad', 'trekking', 'solo', 'cultural', 'adventure', 'photography'];

  return (
    <div className="page container" style={{ paddingBottom: '60px' }}>
      <div className="page-header">
        <h1>Discover Travelers</h1>
        <p>Find compatible travel partners from around the world</p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search travelers, destinations, groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ paddingLeft: '42px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}><Search size={16} /></button>
      </div>

      {/* Filters */}
      {!searchResults && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" value={filters.travel_style} onChange={e => setFilters({ ...filters, travel_style: e.target.value })} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}>
              <option value="">All Styles</option>
              {travelStyles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="form-input" placeholder="Country" value={filters.country} onChange={e => setFilters({ ...filters, country: e.target.value })} style={{ width: '140px', padding: '8px 12px', fontSize: '0.85rem' }} />
            <input className="form-input" placeholder="Location" value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} style={{ width: '140px', padding: '8px 12px', fontSize: '0.85rem' }} />
            <button className="btn btn-secondary btn-sm" onClick={handleFilter}>Apply</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : searchResults ? (
        /* Search Results */
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Search Results for &quot;{searchQuery}&quot;</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearchResults(null); setSearchQuery(''); loadTravelers(); }}>Clear</button>
          </div>

          {searchResults.travelers?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}><Users size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Travelers</h3>
              <div className="grid-3">
                {searchResults.travelers.map(t => (
                  <Link key={t.id} href={`/profile/${t.id}`} className="traveler-card">
                    <div className="avatar-wrap">
                      <div className="avatar avatar-lg avatar-placeholder">{t.name?.charAt(0)}</div>
                    </div>
                    <h3>{t.name}</h3>
                    {t.current_location && <div className="location"><MapPin size={14} /> {t.current_location}</div>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchResults.posts?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>📝 Posts</h3>
              {searchResults.posts.map(p => (
                <Link key={p.id} href={`/posts/${p.id}`} className="card" style={{ display: 'block', marginBottom: '8px', padding: '16px' }}>
                  <h4>{p.title}</h4>
                  {p.destination && <span style={{ color: 'var(--text-accent)', fontSize: '0.85rem' }}><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.destination}</span>}
                </Link>
              ))}
            </div>
          )}

          {searchResults.groups?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>👥 Groups</h3>
              {searchResults.groups.map(g => (
                <Link key={g.id} href={`/groups/${g.id}`} className="card" style={{ display: 'block', marginBottom: '8px', padding: '16px' }}>
                  <h4>{g.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{g.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Traveler Cards */
        <div className="grid-3">
          {travelers.map(t => (
            <div key={t.id} className="traveler-card animate-in">
              <div className="avatar-wrap">
                <div className="avatar avatar-xl avatar-placeholder">
                  {t.avatar ? <img src={t.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : t.name?.charAt(0)}
                </div>
              </div>
              <h3>{t.name}</h3>
              {t.current_location && <div className="location"><MapPin size={14} /> {t.current_location}</div>}
              <div className="countries" style={{ marginBottom: '8px' }}>
                <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {t.countryCount} countries visited
              </div>

              {t.travel_style && (
                <div className="travel-style">
                  <div className="tags" style={{ justifyContent: 'center' }}>
                    {t.travel_style.split(',').slice(0, 3).map(s => <span key={s} className="tag" style={{ fontSize: '0.72rem' }}>{s.trim()}</span>)}
                  </div>
                </div>
              )}

              {compatScores[t.id] !== undefined && (
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <CompatibilityBadge score={compatScores[t.id]} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <Link href={`/profile/${t.id}`} className="btn btn-primary btn-sm">View CV</Link>
                <Link href={`/messages?to=${t.id}`} className="btn btn-secondary btn-sm"><MessageCircle size={14} /></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
