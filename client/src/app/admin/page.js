'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { Shield, Users, FileText, Flag, AlertTriangle, Check, X, BarChart3 } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        api.getAdminStats().catch(() => ({ totalUsers: 0, totalPosts: 0, totalGroups: 0, pendingReports: 0 })),
        api.getReports().catch(() => [])
      ]);
      setStats(statsData);
      setReports(reportsData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleModerate = async (postId, action) => {
    try {
      await api.moderatePost(postId, action);
      loadData();
    } catch (err) { alert(err.message); }
  };

  if (authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  return (
    <div className="page container" style={{ paddingBottom: '60px' }}>
      <div className="page-header">
        <h1><Shield size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Admin Dashboard</h1>
        <p>Manage content and monitor platform activity</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <div className="card stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label"><Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Users</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.totalPosts}</div>
            <div className="stat-label"><FileText size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Posts</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.totalGroups}</div>
            <div className="stat-label"><Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Groups</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: stats.pendingReports > 0 ? 'var(--danger)' : undefined }}>{stats.pendingReports}</div>
            <div className="stat-label"><Flag size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Reports</div>
          </div>
        </div>
      )}

      {/* Reports */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}><Flag size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Pending Reports</h2>
      {reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <h3>No pending reports</h3>
          <p style={{ color: 'var(--text-secondary)' }}>All clear! No content requires moderation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map(report => (
            <div key={report.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                <AlertTriangle size={24} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '4px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem' }}>{report.post_title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0' }}>{report.post_description?.slice(0, 150)}</p>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>Post by <strong>{report.post_author}</strong></span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>Reported by <strong>{report.reporter_name}</strong></span>
                  </div>
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong>Reason:</strong> {report.reason}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleModerate(report.post_id, 'remove')}>
                    <X size={14} /> Remove
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleModerate(report.post_id, 'approve')}>
                    <Check size={14} /> Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
