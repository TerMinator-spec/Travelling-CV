'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { Save, Camera, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHistory, setNewHistory] = useState({ country: '', city: '', visit_date: '' });
  const [newGallery, setNewGallery] = useState({ file: null, caption: '' });
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
    if (user) loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      const data = await api.getMyProfile();
      setProfile(data);
      setForm({
        name: data.name || '',
        bio: data.cv?.bio || '',
        current_location: data.cv?.current_location || '',
        nationality: data.cv?.nationality || '',
        travel_style: data.cv?.travel_style || '',
        budget_preference: data.cv?.budget_preference || 'moderate',
        preferred_months: data.cv?.preferred_months || '',
        wishlist_destinations: data.cv?.wishlist_destinations || '',
        languages: data.cv?.languages || '',
        skills: data.cv?.skills || '',
        interests: data.cv?.interests || '',
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(form);
      setMessage('Profile saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.uploadAvatar(formData);
      setProfile({ ...profile, avatar: res.avatar });
    } catch (err) { console.error(err); }
  };

  const handleAddHistory = async () => {
    if (!newHistory.country) return;
    try {
      const formData = new FormData();
      formData.append('country', newHistory.country);
      formData.append('city', newHistory.city);
      formData.append('visit_date', newHistory.visit_date);
      const entry = await api.addTravelHistory(formData);
      setProfile({ ...profile, travelHistory: [...(profile.travelHistory || []), entry] });
      setNewHistory({ country: '', city: '', visit_date: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.deleteTravelHistory(id);
      setProfile({ ...profile, travelHistory: profile.travelHistory.filter(h => h.id !== id) });
    } catch (err) { console.error(err); }
  };

  const handleUploadGallery = async () => {
    if (!newGallery.file) return;
    setUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append('image', newGallery.file);
      if (newGallery.caption) formData.append('caption', newGallery.caption);
      
      const res = await api.uploadGalleryImage(formData);
      setProfile({ ...profile, gallery: [res, ...(profile.gallery || [])] });
      setNewGallery({ file: null, caption: '' });
    } catch (err) { setMessage('Error: ' + err.message); }
    finally { setUploadingGallery(false); }
  };

  const handleDeleteGallery = async (id) => {
    try {
      await api.deleteGalleryImage(id);
      setProfile({ ...profile, gallery: profile.gallery.filter(img => img.id !== id) });
    } catch (err) { console.error(err); }
  };

  if (loading || authLoading) return <div className="loading-page page"><div className="spinner" /></div>;

  return (
    <div className="page container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/profile/${user?.id}`} className="btn btn-ghost btn-icon"><ArrowLeft size={20} /></Link>
        <div>
          <h1>Edit Your Travelling CV</h1>
          <p>Update your travel profile and information</p>
        </div>
      </div>

      {profile?.completion !== undefined && (
        <div style={{ marginBottom: '24px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600' }}>Profile Completion</span>
            <span style={{ fontWeight: 'bold', color: profile.completion === 100 ? 'var(--success)' : 'var(--primary)' }}>{profile.completion}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${profile.completion}%`, height: '100%', background: profile.completion === 100 ? 'var(--success)' : 'var(--gradient-primary)', transition: 'width 1s ease' }} />
          </div>
        </div>
      )}

      {message && (
        <div style={{ padding: '12px 16px', background: message.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${message.startsWith('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.9rem', color: message.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>
          {message}
        </div>
      )}

      {/* Avatar */}
      <div className="card" style={{ marginBottom: '24px', padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <div className="avatar avatar-xxl avatar-placeholder" style={{ margin: '0 auto' }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>{profile?.name?.charAt(0)}</span>
            )}
          </div>
          <label style={{ position: 'absolute', bottom: '0', right: '0', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid var(--bg-secondary)' }}>
            <Camera size={16} color="white" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Basic Information</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nationality</label>
            <input className="form-input" placeholder="e.g. American" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Current Location</label>
          <input className="form-input" placeholder="e.g. Bali, Indonesia" value={form.current_location} onChange={e => setForm({ ...form, current_location: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea className="form-textarea" placeholder="Tell us about your travel journey..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} />
        </div>
      </div>

      {/* Travel Style */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Travel Preferences</h3>
        <div className="form-group">
          <label>Travel Style (comma-separated)</label>
          <input className="form-input" placeholder="e.g. backpacking, digital nomad, adventure" value={form.travel_style} onChange={e => setForm({ ...form, travel_style: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Budget Preference</label>
          <select className="form-select" value={form.budget_preference} onChange={e => setForm({ ...form, budget_preference: e.target.value })}>
            <option value="budget">Budget</option>
            <option value="moderate">Moderate</option>
            <option value="comfort">Comfort</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>
        <div className="form-group">
          <label>Preferred Travel Months (comma-separated)</label>
          <input className="form-input" placeholder="e.g. march, april, september" value={form.preferred_months} onChange={e => setForm({ ...form, preferred_months: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Interests (comma-separated)</label>
          <input className="form-input" placeholder="e.g. trekking, beaches, culture, food" value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} />
        </div>
      </div>

      {/* Skills & Languages */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Skills & Languages</h3>
        <div className="form-group">
          <label>Languages (comma-separated)</label>
          <input className="form-input" placeholder="e.g. English, Spanish, French" value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Travel Skills (comma-separated)</label>
          <input className="form-input" placeholder="e.g. photography, hiking, camping, budgeting" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
        </div>
      </div>

      {/* Future Plans */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Future Plans</h3>
        <div className="form-group">
          <label>Wishlist Destinations (comma-separated)</label>
          <input className="form-input" placeholder="e.g. Japan, Peru, Iceland" value={form.wishlist_destinations} onChange={e => setForm({ ...form, wishlist_destinations: e.target.value })} />
        </div>
      </div>

      {/* Travel History */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Travel History</h3>
        {profile?.travelHistory?.map(entry => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span>🌐</span>
            <span style={{ flex: 1 }}>{entry.country}{entry.city ? `, ${entry.city}` : ''}</span>
            {entry.visit_date && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{entry.visit_date}</span>}
            <button className="btn btn-ghost btn-icon" onClick={() => handleDeleteHistory(entry.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Country" value={newHistory.country} onChange={e => setNewHistory({ ...newHistory, country: e.target.value })} style={{ flex: 1, minWidth: '120px' }} />
          <input className="form-input" placeholder="City (optional)" value={newHistory.city} onChange={e => setNewHistory({ ...newHistory, city: e.target.value })} style={{ flex: 1, minWidth: '120px' }} />
          <input type="date" className="form-input" value={newHistory.visit_date} onChange={e => setNewHistory({ ...newHistory, visit_date: e.target.value })} style={{ width: '160px' }} />
          <button className="btn btn-secondary btn-sm" onClick={handleAddHistory}><Plus size={16} /> Add</button>
        </div>
      </div>

      {/* Gallery */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Travel Gallery</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload photos of your favorite places to enhance your Travelling CV.</p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {profile?.gallery?.map(img => (
            <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px' }}>
              <img src={img.image_url} alt={img.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              <button className="btn btn-danger btn-sm btn-icon" style={{ position: 'absolute', top: '4px', right: '4px', padding: '4px' }} onClick={() => handleDeleteGallery(img.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input type="text" className="form-input" placeholder="Caption for new photo (optional)" value={newGallery.caption} onChange={e => setNewGallery({ ...newGallery, caption: e.target.value })} style={{ flex: 1, minWidth: '200px' }} />
          <label className="btn btn-secondary">
            <Camera size={16} style={{ marginRight: '6px' }} /> Choose Photo
            <input type="file" accept="image/*" onChange={(e) => setNewGallery({ ...newGallery, file: e.target.files[0] })} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-primary" onClick={handleUploadGallery} disabled={!newGallery.file || uploadingGallery}>
            <Plus size={16} /> {uploadingGallery ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {newGallery.file && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Selected: {newGallery.file.name}</div>}
      </div>

      <button className="btn btn-primary btn-lg btn-full" onClick={handleSave} disabled={saving}>
        <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
