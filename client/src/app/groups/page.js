'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, MapPin, Search, LogIn, LogOut, MessageCircle } from 'lucide-react';

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '', destination_focus: '' });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    loadGroups();
  }, [user, authLoading]);

  const loadGroups = async (q = '') => {
    try {
      const data = await api.getGroups(q ? { search: q } : {});
      setGroups(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await api.createGroup(newGroup);
      setShowCreate(false);
      setNewGroup({ name: '', description: '', destination_focus: '' });
      loadGroups();
    } catch (err) { alert(err.message); }
  };

  const handleSearch = () => { setLoading(true); loadGroups(search); };

  if (authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  return (
    <div className="page container" style={{ paddingBottom: '60px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h1>Travel Groups</h1>
          <p>Join communities of like-minded travelers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Group
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ paddingLeft: '42px' }} />
        </div>
        <button className="btn btn-secondary" onClick={handleSearch}><Search size={16} /></button>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No groups found</h3>
          <p>Create a group to connect with travelers who share your interests!</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Group</button>
        </div>
      ) : (
        <div className="grid-2">
          {groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`} className="card animate-in" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  👥
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem' }}>{group.name}</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{group.member_count} members</span>
                </div>
              </div>
              {group.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>{group.description}</p>}
              {group.destination_focus && (
                <div className="tag"><MapPin size={12} /> {group.destination_focus}</div>
              )}
              <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Created by {group.creator_name}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Travel Group</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Group Name</label>
              <input className="form-input" placeholder="e.g. Europe Backpackers" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-textarea" placeholder="What's this group about?" value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Destination Focus</label>
              <input className="form-input" placeholder="e.g. Southeast Asia, Europe" value={newGroup.destination_focus} onChange={e => setNewGroup({ ...newGroup, destination_focus: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleCreate}>Create Group</button>
          </div>
        </div>
      )}
    </div>
  );
}
