'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Calendar, DollarSign, Users, ArrowLeft, BookmarkX } from 'lucide-react';

export default function SavedPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadSavedPosts();
  }, [user]);

  const loadSavedPosts = async () => {
    try {
      const data = await api.getSavedPosts();
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

  const handleUnsave = async (postId) => {
    try {
      await api.savePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => router.back()} style={{ flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>🔖 Saved Posts</h1>
          <p>{posts.length} {posts.length === 1 ? 'post' : 'posts'} saved</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🔖</div>
            <h3>No saved posts yet</h3>
            <p>Bookmark posts from your feed to save them here for later.</p>
            <Link href="/feed" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Feed</Link>
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
                    <div className="avatar avatar-placeholder" style={{ width: '42px', height: '42px', fontSize: '1rem', flexShrink: 0 }}>
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : post.user_name?.charAt(0)}
                    </div>
                  </Link>
                  <div className="post-meta">
                    <h4><Link href={`/profile/${post.user_id}`} style={{ color: 'var(--text-primary)' }}>{post.user_name}</Link></h4>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                  <span className={`post-type-badge post-type-${post.type}`}>{post.type?.replace('_', ' ')}</span>
                </div>

                <Link href={`/posts/${post.id}`} style={{ color: 'inherit' }}>
                  <h3 className="post-title">{post.title}</h3>
                </Link>

                {post.destination && (
                  <div className="post-destination">
                    <MapPin size={16} /> {post.destination}
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
                  <Link href={`/posts/${post.id}`} className="post-action-btn">
                    <MessageCircle size={18} /> {post.comments_count || 0}
                  </Link>
                  <button className="post-action-btn saved" onClick={() => handleUnsave(post.id)} title="Remove from saved">
                    <Bookmark size={18} fill="currentColor" /> Saved
                  </button>
                  <button className="post-action-btn" onClick={() => navigator.clipboard?.writeText(window.location.origin + `/posts/${post.id}`)}>
                    <Share2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
