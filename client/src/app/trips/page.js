'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Map, Calendar, Users, Clock, Plus, CheckCircle, XCircle, MapPin, DollarSign } from 'lucide-react';

export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [collabPosts, setCollabPosts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [posts, requests] = await Promise.all([
        api.getFeed({ type: 'collaboration' }),
        user ? api.getMyRequests().catch(() => []) : []
      ]);
      setCollabPosts(posts);
      setMyRequests(requests);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getCountdown = (dateStr) => {
    if (!dateStr) return null;
    const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;
    const diff = new Date(match[0]).getTime() - Date.now();
    if (diff <= 0) return 'In progress';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days away`;
  };

  if (authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  return (
    <div className="page container" style={{ paddingBottom: '60px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h1>Trip Planning</h1>
          <p>Explore open trips and manage your travel collaborations</p>
        </div>
        <Link href="/posts/create" className="btn btn-primary">
          <Plus size={16} /> Post Trip
        </Link>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>🌍 Open Trips</button>
        <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>📩 My Requests ({myRequests.length})</button>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : activeTab === 'explore' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {collabPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <h3>No open trips</h3>
              <p>Be the first to post a trip collaboration!</p>
              <Link href="/posts/create" className="btn btn-primary">Post Trip</Link>
            </div>
          ) : (
            collabPosts.map(post => (
              <Link key={post.id} href={`/posts/${post.id}`} className="card animate-in" style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>✈️</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{post.title}</h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px', fontSize: '0.85rem' }}>
                      {post.destination && <span style={{ color: 'var(--text-accent)' }}><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {post.destination}</span>}
                      {post.travel_dates && <span style={{ color: 'var(--text-secondary)' }}><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {post.travel_dates}</span>}
                      {post.budget_estimate && <span style={{ color: 'var(--text-secondary)' }}><DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {post.budget_estimate}</span>}
                      {post.travelers_wanted && <span style={{ color: 'var(--text-secondary)' }}><Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {post.travelers_wanted} wanted</span>}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{post.description?.slice(0, 150)}{post.description?.length > 150 ? '...' : ''}</p>
                    {post.travel_dates && getCountdown(post.travel_dates) && (
                      <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.1)', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: '600' }}>
                        <Clock size={14} /> {getCountdown(post.travel_dates)}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div className="avatar avatar-placeholder avatar-sm">{post.user_name?.charAt(0)}</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{post.user_name}</span>
                  {post.tags && <div className="tags" style={{ marginLeft: 'auto' }}>{post.tags.split(',').slice(0, 3).map(t => <span key={t} className="tag" style={{ fontSize: '0.72rem' }}>{t.trim()}</span>)}</div>}
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📩</div>
              <h3>No requests yet</h3>
              <p>Browse open trips and send join requests!</p>
            </div>
          ) : (
            myRequests.map(req => (
              <div key={req.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h4>{req.post_title}</h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {req.post_destination} · by {req.post_author}
                  </span>
                </div>
                <span className={`tag ${req.status === 'accepted' ? 'tag-success' : req.status === 'rejected' ? '' : 'tag-accent'}`}>
                  {req.status === 'accepted' && <CheckCircle size={12} />}
                  {req.status === 'rejected' && <XCircle size={12} />}
                  {req.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
