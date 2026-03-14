'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Calendar, DollarSign, Users, Clock, Trash2, Flag } from 'lucide-react';
import TripsHappeningNow from '../../components/TripsHappeningNow';
import MapPreview from '../../components/MapPreview';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('recent');
  const [typeFilter, setTypeFilter] = useState('');
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    loadFeed();
  }, [filter, typeFilter]);

  const loadFeed = async () => {
    try {
      const params = { sort: filter };
      if (typeFilter) params.type = typeFilter;
      const data = await api.getFeed(params);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.likePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, liked: res.liked, likes_count: p.likes_count + (res.liked ? 1 : -1) } : p));
    } catch (err) { console.error(err); }
  };

  const handleSave = async (postId) => {
    try {
      const res = await api.savePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, saved: res.saved } : p));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      const comment = await api.commentPost(postId, text);
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), comment], comments_count: p.comments_count + 1 } : p));
      setCommentText({ ...commentText, [postId]: '' });
    } catch (err) { console.error(err); }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (authLoading || !user) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="page container">
      <div className="page-header" style={{ paddingBottom: '0' }}>
        <h1>Travel Feed</h1>
        <p>Discover trips, stories, and collaboration opportunities</p>
      </div>

      <div className="feed-layout">
        {/* LEFT SIDEBAR */}
        <aside className="feed-sidebar left">
          <nav className="sidebar-nav">
            <Link href="/feed" className="active">📰 Feed</Link>
            <Link href="/discover">🌍 Discover Travelers</Link>
            <Link href="/discover/map">🗺️ Explore Map</Link>
            <Link href="/groups">👥 Groups</Link>
            <Link href="/trips">✈️ Trips</Link>
            <Link href="/posts/saved">🔖 Saved Posts</Link>
            <Link href={`/profile/${user.id}`}>👤 My Travelling CV</Link>
          </nav>
        </aside>

        {/* MAIN FEED AREA */}
        <main className="feed-main">

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: '0', borderBottom: 'none', flex: 1 }}>
          {[
            { key: 'recent', label: '🕐 Recent' },
            { key: 'popular', label: '🔥 Popular' },
          ].map(f => (
            <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="tabs" style={{ marginBottom: '0', borderBottom: 'none' }}>
          <button className={`tab ${typeFilter === '' ? 'active' : ''}`} onClick={() => setTypeFilter('')}>All</button>
          {['experience', 'collaboration', 'advice', 'trip_plan'].map(t => (
            <button key={t} className={`tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'experience' ? '🌄' : t === 'collaboration' ? '🤝' : t === 'advice' ? '💡' : '🗺️'} {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📝</div>
          <h3>No posts yet</h3>
          <p>Be the first to share your travel experience!</p>
          <Link href="/posts/create" className="btn btn-primary" style={{ marginTop: '16px' }}>Create Post</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {posts.map(post => (
            <article key={post.id} className="post-card animate-in">
              <img 
                src={post.images ? post.images.split(',')[0] : `https://picsum.photos/seed/${encodeURIComponent(post.destination || post.id || 'travel')}/800/400`} 
                alt={post.destination || 'Travel destination'} 
                className="post-cover-image"
                loading="lazy"
              />
              <div className="post-header">
                <Link href={`/profile/${post.user_id}`}>
                  <div className="avatar avatar-placeholder" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                    {post.user_avatar ? (
                      <img src={post.user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : post.user_name?.charAt(0)}
                  </div>
                </Link>
                <div className="post-meta">
                  <h4><Link href={`/profile/${post.user_id}`} style={{ color: 'var(--text-primary)' }}>{post.user_name}</Link></h4>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
                <span className={`post-type-badge post-type-${post.type}`}>{post.type.replace('_', ' ')}</span>
              </div>

              <Link href={`/posts/${post.id}`} style={{ color: 'inherit' }}>
                <h3 className="post-title">{post.title}</h3>
              </Link>

              {post.destination && (
                <div className="post-destination">
                  <MapPin size={16} /> {post.destination}
                </div>
              )}

              {post.type === 'trip_plan' && post.destination && (
                <div style={{ marginBottom: '16px' }}>
                  <MapPreview routeStr={post.destination} />
                </div>
              )}

              <p className="post-body">{post.description?.slice(0, 250)}{post.description?.length > 250 ? '...' : ''}</p>

              {(post.travel_dates || post.budget_estimate || post.travelers_wanted) && (
                <div className="post-details">
                  {post.travel_dates && <div className="post-detail-item"><Calendar size={14} /> <strong>{post.travel_dates}</strong></div>}
                  {post.budget_estimate && <div className="post-detail-item"><DollarSign size={14} /> <strong>{post.budget_estimate}</strong></div>}
                  {post.travelers_wanted && <div className="post-detail-item"><Users size={14} /> <strong>{post.travelers_wanted} travelers wanted</strong></div>}
                </div>
              )}

              {post.tags && (
                <div className="tags" style={{ marginBottom: '12px' }}>
                  {post.tags.split(',').map(tag => (
                    <span key={tag} className="tag">{tag.trim()}</span>
                  ))}
                </div>
              )}

              <div className="post-actions">
                <button className={`post-action-btn ${post.liked ? 'liked' : ''}`} onClick={() => handleLike(post.id)}>
                  <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes_count || 0}
                </button>
                <button className="post-action-btn" onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}>
                  <MessageCircle size={18} /> {post.comments_count || 0}
                </button>
                <button className={`post-action-btn ${post.saved ? 'saved' : ''}`} onClick={() => handleSave(post.id)}>
                  <Bookmark size={18} fill={post.saved ? 'currentColor' : 'none'} />
                </button>
                <button className="post-action-btn" onClick={() => navigator.clipboard?.writeText(window.location.origin + `/posts/${post.id}`)}>
                  <Share2 size={18} />
                </button>
              </div>

              {/* Comments */}
              {post.comments?.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {post.comments.slice(-2).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--text-accent)' }}>{c.user_name}</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.content}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input
                  id={`comment-${post.id}`}
                  className="form-input"
                  placeholder="Add a comment..."
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => handleComment(post.id)}>Post</button>
              </div>
            </article>
          ))}
        </div>
      )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="feed-sidebar right">
        <div className="sidebar-widget">
          <h3>🌍 Trips Happening Now</h3>
          <TripsHappeningNow />
        </div>
        
        <div className="sidebar-widget" style={{ marginTop: '20px' }}>
          <h3>🔥 Trending Destinations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>🇯🇵 Japan</span> <span style={{ color: 'var(--text-muted)' }}>1.2k posts</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>🇮🇩 Bali, Indonesia</span> <span style={{ color: 'var(--text-muted)' }}>850 posts</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>🇮🇹 Italy</span> <span style={{ color: 'var(--text-muted)' }}>620 posts</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>🇹🇭 Thailand</span> <span style={{ color: 'var(--text-muted)' }}>430 posts</span></div>
          </div>
        </div>
      </aside>
      
      </div> {/* End feed-layout */}
    </div>
  );
}
