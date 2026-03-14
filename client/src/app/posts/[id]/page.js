'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share2, MapPin, Calendar, DollarSign, Users, ArrowLeft, UserPlus, Flag, Send } from 'lucide-react';
import MapPreview from '../../../components/MapPreview';

export default function PostDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadPost();
  }, [params.id]);

  const loadPost = async () => {
    try {
      const data = await api.getPost(params.id);
      setPost(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLike = async () => {
    try {
      const res = await api.likePost(post.id);
      setPost({ ...post, liked: res.liked, likes_count: post.likes_count + (res.liked ? 1 : -1) });
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    try {
      const res = await api.savePost(post.id);
      setPost({ ...post, saved: res.saved });
    } catch (err) { console.error(err); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const comment = await api.commentPost(post.id, commentText);
      setPost({ ...post, comments: [...(post.comments || []), comment], comments_count: post.comments_count + 1 });
      setCommentText('');
    } catch (err) { console.error(err); }
  };

  const handleJoinRequest = async () => {
    try {
      await api.sendJoinRequest({ post_id: post.id, message: joinMessage });
      setShowJoinModal(false);
      setJoinMessage('');
      loadPost();
    } catch (err) { alert(err.message); }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await api.respondJoinRequest(requestId, status);
      loadPost();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-page page"><div className="spinner" /></div>;
  if (!post) return <div className="page container"><div className="empty-state"><h3>Post not found</h3></div></div>;

  const isOwner = user?.id === post.user_id;

  return (
    <div className="page container" style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '20px', paddingTop: '20px' }}>
        <button onClick={() => router.back()} className="btn btn-ghost"><ArrowLeft size={18} /> Back</button>
      </div>

      <article className="post-card animate-in" style={{ marginBottom: '24px' }}>
        <img 
          src={post.images ? post.images.split(',')[0] : `https://picsum.photos/seed/${encodeURIComponent(post.destination || post.id || 'travel')}/800/400`} 
          alt={post.destination || 'Travel destination'} 
          className="post-cover-image"
          loading="lazy"
        />
        <div className="post-header">
          <Link href={`/profile/${post.user_id}`}>
            <div className="avatar avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
              {post.user_avatar ? <img src={post.user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : post.user_name?.charAt(0)}
            </div>
          </Link>
          <div className="post-meta">
            <h4><Link href={`/profile/${post.user_id}`} style={{ color: 'var(--text-primary)' }}>{post.user_name}</Link></h4>
            <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span className={`post-type-badge post-type-${post.type}`}>{post.type.replace('_', ' ')}</span>
        </div>

        <h2 className="post-title" style={{ fontSize: '1.5rem' }}>{post.title}</h2>

        {post.destination && <div className="post-destination"><MapPin size={18} /> {post.destination}</div>}

        {post.type === 'trip_plan' && post.destination && (
          <div style={{ marginBottom: '20px' }}>
            <MapPreview routeStr={post.destination} />
          </div>
        )}

        <p className="post-body" style={{ whiteSpace: 'pre-wrap' }}>{post.description}</p>
        
        {post.images && post.images.split(',').length > 1 && (
          <div className="grid-2" style={{ gap: '12px', marginBottom: '24px' }}>
            {post.images.split(',').slice(1).map((imgUrl, i) => (
              <img 
                key={i} 
                src={imgUrl} 
                alt={`${post.title} gallery image ${i+1}`} 
                style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                loading="lazy"
              />
            ))}
          </div>
        )}

        {(post.travel_dates || post.budget_estimate || post.travelers_wanted) && (
          <div className="post-details">
            {post.travel_dates && <div className="post-detail-item"><Calendar size={14} /> <strong>{post.travel_dates}</strong></div>}
            {post.budget_estimate && <div className="post-detail-item"><DollarSign size={14} /> <strong>{post.budget_estimate}</strong></div>}
            {post.travelers_wanted && <div className="post-detail-item"><Users size={14} /> <strong>{post.travelers_wanted} travelers wanted</strong></div>}
          </div>
        )}

        {post.tags && (
          <div className="tags" style={{ marginBottom: '16px' }}>
            {post.tags.split(',').map(tag => <span key={tag} className="tag">{tag.trim()}</span>)}
          </div>
        )}

        <div className="post-actions">
          <button className={`post-action-btn ${post.liked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes_count}
          </button>
          <button className="post-action-btn"><MessageCircle size={18} /> {post.comments_count}</button>
          <button className={`post-action-btn ${post.saved ? 'saved' : ''}`} onClick={handleSave}>
            <Bookmark size={18} fill={post.saved ? 'currentColor' : 'none'} /> Save
          </button>
          <button className="post-action-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
            <Share2 size={18} /> Share
          </button>
          {post.type === 'collaboration' && !isOwner && user && (
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowJoinModal(true)}>
              <UserPlus size={16} /> Join Trip
            </button>
          )}
        </div>
      </article>

      {/* Join Requests (owner only) */}
      {isOwner && post.joinRequests?.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Join Requests ({post.joinRequests.length})</h3>
          {post.joinRequests.map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar avatar-placeholder avatar-sm">{req.user_name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <Link href={`/profile/${req.user_id}`} style={{ fontWeight: '600' }}>{req.user_name}</Link>
                {req.message && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{req.message}</p>}
              </div>
              {req.status === 'pending' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleRespondRequest(req.id, 'accepted')}>Accept</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRespondRequest(req.id, 'rejected')}>Decline</button>
                </div>
              ) : (
                <span className={`tag ${req.status === 'accepted' ? 'tag-success' : ''}`}>{req.status}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Comments ({post.comments?.length || 0})</h3>
        
        {user && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              className="form-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button className="btn btn-primary" onClick={handleComment}><Send size={16} /></button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {post.comments?.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
              <div className="avatar avatar-placeholder avatar-sm" style={{ flexShrink: 0 }}>{c.user_name?.charAt(0)}</div>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <Link href={`/profile/${c.user_id}`} style={{ fontWeight: '600', fontSize: '0.9rem' }}>{c.user_name}</Link>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.content}</p>
              </div>
            </div>
          ))}
          {(!post.comments || post.comments.length === 0) && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No comments yet. Be the first!</p>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request to Join Trip</h2>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Message (optional)</label>
              <textarea className="form-textarea" placeholder="Introduce yourself and why you'd like to join..." value={joinMessage} onChange={e => setJoinMessage(e.target.value)} rows={3} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleJoinRequest}>
              <UserPlus size={16} /> Send Join Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
