'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Users, MapPin, Send, LogIn, LogOut } from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => { loadGroup(); }, [params.id]);

  const loadGroup = async () => {
    try {
      const data = await api.getGroup(params.id);
      setGroup(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const isMember = group?.members?.some(m => m.user_id === user?.id);

  const handleJoin = async () => {
    try {
      await api.joinGroup(params.id);
      loadGroup();
    } catch (err) { alert(err.message); }
  };

  const handleLeave = async () => {
    try {
      await api.leaveGroup(params.id);
      loadGroup();
    } catch (err) { alert(err.message); }
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    try {
      await api.postInGroup(params.id, postContent);
      setPostContent('');
      loadGroup();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="loading-page page"><div className="spinner" /></div>;
  if (!group) return <div className="page container"><div className="empty-state"><h3>Group not found</h3></div></div>;

  return (
    <div className="page container" style={{ paddingBottom: '60px' }}>
      <div style={{ paddingTop: '20px', marginBottom: '16px' }}>
        <Link href="/groups" className="btn btn-ghost"><ArrowLeft size={18} /> Groups</Link>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', background: 'var(--gradient-ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👥</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem' }}>{group.name}</h1>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              <span><Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {group.member_count} members</span>
              {group.destination_focus && <span><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {group.destination_focus}</span>}
            </div>
          </div>
          {user && (
            isMember ? (
              <button className="btn btn-ghost" onClick={handleLeave}><LogOut size={16} /> Leave</button>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin}><LogIn size={16} /> Join Group</button>
            )
          )}
        </div>
        {group.description && <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{group.description}</p>}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members ({group.members?.length})</button>
      </div>

      {activeTab === 'posts' && (
        <div>
          {isMember && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input className="form-input" placeholder="Share something with the group..." value={postContent} onChange={e => setPostContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePost()} />
              <button className="btn btn-primary" onClick={handlePost}><Send size={16} /></button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {group.posts?.map(post => (
              <div key={post.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="avatar avatar-sm avatar-placeholder">{post.user_name?.charAt(0)}</div>
                  <Link href={`/profile/${post.user_id}`} style={{ fontWeight: '600', fontSize: '0.9rem' }}>{post.user_name}</Link>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{post.content}</p>
              </div>
            ))}
            {(!group.posts || group.posts.length === 0) && (
              <div className="empty-state">
                <p>No posts yet. {isMember ? 'Be the first to post!' : 'Join to start posting!'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="grid-3 animate-in">
          {group.members?.map(member => (
            <Link key={member.user_id} href={`/profile/${member.user_id}`} className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <div className="avatar avatar-lg avatar-placeholder" style={{ margin: '0 auto 10px' }}>
                {member.avatar ? <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : member.name?.charAt(0)}
              </div>
              <h4>{member.name}</h4>
              <span className="tag" style={{ marginTop: '6px' }}>{member.role}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
