'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { ArrowLeft, Send, MapPin, Calendar, DollarSign, Users, Tag, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    type: 'experience',
    title: '',
    destination: '',
    description: '',
    travel_dates: '',
    budget_estimate: '',
    travelers_wanted: '',
    tags: ''
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      const submissionForm = { ...form };
      
      if (dateRange.start || dateRange.end) {
        const formatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        const s = dateRange.start ? new Date(dateRange.start).toLocaleDateString(undefined, formatOptions) : '';
        const e = dateRange.end ? new Date(dateRange.end).toLocaleDateString(undefined, formatOptions) : '';
        submissionForm.travel_dates = s && e ? `${s} - ${e}` : (s || e);
      }
      
      Object.entries(submissionForm).forEach(([key, val]) => { if (val) formData.append(key, val); });
      images.forEach(image => formData.append('images', image));
      
      await api.createPost(formData);
      router.push('/feed');
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  if (authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  const postTypes = [
    { key: 'experience', label: '🌄 Experience', desc: 'Share a travel story' },
    { key: 'collaboration', label: '🤝 Collaboration', desc: 'Find travel partners' },
    { key: 'advice', label: '💡 Advice', desc: 'Share travel tips' },
    { key: 'trip_plan', label: '🗺️ Trip Plan', desc: 'Plan a trip' },
  ];

  return (
    <div className="page container" style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/feed" className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></Link>
        <div>
          <h1>Create Post</h1>
          <p>Share your travel experience with the community</p>
        </div>
      </div>

      {/* Post type selector */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {postTypes.map(t => (
          <button key={t.key} className={`card ${form.type === t.key ? '' : ''}`} onClick={() => setForm({ ...form, type: t.key })}
            style={{
              cursor: 'pointer', textAlign: 'center', padding: '16px',
              borderColor: form.type === t.key ? 'var(--primary)' : 'var(--border)',
              background: form.type === t.key ? 'var(--primary-glow)' : 'var(--gradient-card)'
            }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{t.label.split(' ')[0]}</div>
            <h4 style={{ fontSize: '0.9rem' }}>{t.label.split(' ').slice(1).join(' ')}</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label><Tag size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Title</label>
            <input className="form-input" placeholder="Give your post a catchy title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Destination</label>
            <input className="form-input" placeholder="e.g. Thailand, Japan, Europe" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" placeholder="Share the details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} required />
          </div>
        </div>

        {(form.type === 'collaboration' || form.type === 'trip_plan') && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Trip Details</h3>
            <div className="grid-2">
              <div className="form-group">
                <label><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Travel Dates</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={dateRange.start} 
                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })} 
                    style={{ flex: 1, padding: '10px 12px' }} 
                  />
                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={dateRange.end} 
                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })} 
                    style={{ flex: 1, padding: '10px 12px' }} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label><DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Budget Estimate</label>
                <input className="form-input" placeholder="e.g. $1500" value={form.budget_estimate} onChange={e => setForm({ ...form, budget_estimate: e.target.value })} />
              </div>
            </div>
            {form.type === 'collaboration' && (
              <div className="form-group">
                <label><Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Travelers Wanted</label>
                <input type="number" className="form-input" placeholder="How many travelers?" value={form.travelers_wanted} onChange={e => setForm({ ...form, travelers_wanted: e.target.value })} min="1" max="20" />
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Tags (comma-separated)</label>
            <input className="form-input" placeholder="e.g. trekking, europe, solo, budget" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label><ImageIcon size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Images (optional, max 5)</label>
            <div 
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
                marginTop: '8px'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Click to upload images</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPEG, PNG up to 5MB each</p>
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={e => {
                if (e.target.files) {
                  const newImages = Array.from(e.target.files).slice(0, 5 - images.length);
                  setImages([...images, ...newImages]);
                }
              }} 
            />
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img 
                      src={URL.createObjectURL(img)} 
                      alt="preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImages(images.filter((_, i) => i !== idx));
                      }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
          <Send size={18} /> {loading ? 'Publishing...' : 'Publish Post'}
        </button>
      </form>
    </div>
  );
}
