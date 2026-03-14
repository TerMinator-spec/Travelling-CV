'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { MapPin, Globe, Calendar, Award, Edit, MessageCircle, BarChart3, Languages, Compass, Heart, Star, Mountain } from 'lucide-react';
import MapPreview from '../../../components/MapPreview';

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timelineRoute, setTimelineRoute] = useState(null);

  const isOwnProfile = currentUser?.id === params.id;

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const loadProfile = async () => {
    try {
      const data = isOwnProfile ? await api.getMyProfile() : await api.getProfile(params.id);
      setProfile(data);
      
      if (currentUser && !isOwnProfile) {
        try {
          const compat = await api.getCompatibility(params.id);
          setCompatibility(compat);
        } catch (err) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const badgeIcons = {
    newcomer: '🌱', explorer: '🧭', globetrotter: '🌍', world_traveler: '🏆',
    continent_hopper: '✈️', nomad: '💻', trekker: '🏔️'
  };

  if (loading) return <div className="loading-page page"><div className="spinner" /></div>;
  if (!profile) return <div className="page container"><div className="empty-state"><h3>Profile not found</h3></div></div>;

  const cv = profile.cv || {};
  const stats = profile.stats || {};

  return (
    <div className="page">
      {/* Hero section */}
      <div className="profile-hero">
        <div className="profile-cover" />
        <div className="profile-info container">
          <div className="avatar avatar-xxl avatar-placeholder" style={{ margin: '0 auto', border: '4px solid var(--primary)' }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>{profile.name?.charAt(0)}</span>
            )}
          </div>
          <h1>{profile.name}</h1>
          {cv.current_location && (
            <div className="location"><MapPin size={16} /> {cv.current_location}</div>
          )}
          {cv.nationality && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              <Globe size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {cv.nationality}
            </div>
          )}
          {cv.bio && <p className="profile-bio">{cv.bio}</p>}
          
          <div className="profile-badges">
            {profile.badges?.map(b => (
              <span key={b.id} className="badge">
                {badgeIcons[b.badge_type] || '🏅'} {b.badge_name}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            {isOwnProfile ? (
              <Link href="/profile/edit" className="btn btn-primary">
                <Edit size={16} /> Edit Profile
              </Link>
            ) : (
              <>
                <Link href={`/messages?to=${params.id}`} className="btn btn-primary">
                  <MessageCircle size={16} /> Message
                </Link>
                {compatibility && (
                  <div className="compat-score" style={{ padding: '10px 20px' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {compatibility.score >= 80 ? '💚' : compatibility.score >= 60 ? '💛' : '🤍'}
                    </span>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', color: compatibility.score >= 80 ? 'var(--success)' : compatibility.score >= 60 ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {compatibility.score}% Compatible
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Travel Match</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {isOwnProfile && profile.completion !== undefined && (
            <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Profile Completion</span>
                <span style={{ fontWeight: 'bold', color: profile.completion === 100 ? 'var(--success)' : 'var(--primary)' }}>{profile.completion}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${profile.completion}%`, height: '100%', background: profile.completion === 100 ? 'var(--success)' : 'var(--gradient-primary)', transition: 'width 1s ease' }} />
              </div>
              {profile.completion < 100 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  <Link href="/profile/edit" style={{ color: 'var(--primary)' }}>Edit your profile</Link> to reach 100%!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '60px' }}>
        {/* Stats */}
        <div className="grid-4" style={{ margin: '32px 0' }}>
          <div className="card stat-card">
            <div className="stat-value">{stats.totalCountries || 0}</div>
            <div className="stat-label">Countries</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.totalCities || 0}</div>
            <div className="stat-label">Cities</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.continentsExplored || 0}</div>
            <div className="stat-label">Continents</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.travelDistanceEstimate ? `${(stats.travelDistanceEstimate / 1000).toFixed(0)}k` : '0'}</div>
            <div className="stat-label">km Traveled</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['overview', 'gallery', 'history', 'compatibility'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="profile-grid animate-in">
            <div>
              {/* Travel Style */}
              {cv.travel_style && (
                <div className="profile-section">
                  <h2><Compass size={20} /> Travel Style</h2>
                  <div className="tags">
                    {cv.travel_style.split(',').map(s => <span key={s} className="tag">{s.trim()}</span>)}
                  </div>
                </div>
              )}

              {/* Languages */}
              {cv.languages && (
                <div className="profile-section">
                  <h2><Languages size={20} /> Languages</h2>
                  <div className="tags">
                    {cv.languages.split(',').map(l => <span key={l} className="tag tag-accent">{l.trim()}</span>)}
                  </div>
                </div>
              )}

              {/* Skills */}
              {cv.skills && (
                <div className="profile-section">
                  <h2><Star size={20} /> Travel Skills</h2>
                  <div className="tags">
                    {cv.skills.split(',').map(s => <span key={s} className="tag tag-success">{s.trim()}</span>)}
                  </div>
                </div>
              )}
            </div>

            <div>
              {/* Future Plans */}
              {cv.wishlist_destinations && (
                <div className="profile-section">
                  <h2><Heart size={20} /> Wishlist Destinations</h2>
                  <div className="tags">
                    {cv.wishlist_destinations.split(',').map(d => <span key={d} className="tag">{d.trim()}</span>)}
                  </div>
                </div>
              )}

              {/* Preferred Months */}
              {cv.preferred_months && (
                <div className="profile-section">
                  <h2><Calendar size={20} /> Preferred Travel Months</h2>
                  <div className="tags">
                    {cv.preferred_months.split(',').map(m => <span key={m} className="tag tag-accent">{m.trim()}</span>)}
                  </div>
                </div>
              )}

              {/* Interests */}
              {cv.interests && (
                <div className="profile-section">
                  <h2><Mountain size={20} /> Interests</h2>
                  <div className="tags">
                    {cv.interests.split(',').map(i => <span key={i} className="tag tag-success">{i.trim()}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="animate-in">
            <div className="profile-section">
              <h2>📸 Travel Gallery</h2>
              {profile.gallery?.length > 0 ? (
                <div className="grid-3">
                  {profile.gallery.map(img => (
                    <div key={img.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                      <img src={img.image_url} alt={img.caption || 'Travel photo'} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                      {img.caption && <div style={{ padding: '12px', fontSize: '0.85rem' }}>{img.caption}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📷</div>
                  <h3>No photos yet</h3>
                  <p>{isOwnProfile ? 'Add photos to your gallery to showcase your travels!' : 'This traveler hasn\'t uploaded any photos yet.'}</p>
                  {isOwnProfile && <Link href="/profile/edit" className="btn btn-primary" style={{ marginTop: '12px' }}>Add Photos</Link>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in">
            {profile.travelHistory?.length > 0 && (
              <div className="profile-section" style={{ marginBottom: '32px' }}>
                <MapPreview routeStr={timelineRoute || profile.travelHistory.map(h => h.country).join(' -> ')} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  {timelineRoute ? "Showing selected trip" : "Showing all visited countries route"}
                </p>
              </div>
            )}
            
            <div className="profile-section">
              <h2><MapPin size={20} /> Travel Timeline</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px', position: 'relative' }}>
                {/* Vertical Timeline Line */}
                <div style={{ position: 'absolute', left: '23px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }}></div>
                
                {profile.travelHistory?.sort((a,b) => new Date(b.visit_date || 0) - new Date(a.visit_date || 0)).map(entry => (
                  <div 
                    key={entry.id} 
                    className="card" 
                    style={{ position: 'relative', padding: '16px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', borderColor: timelineRoute === (entry.city ? `${entry.city}, ${entry.country}` : entry.country) ? 'var(--primary)' : 'var(--border)', transition: 'all 0.2s ease', marginLeft: '48px' }}
                    onClick={() => setTimelineRoute(entry.city ? `${entry.city}, ${entry.country}` : entry.country)}
                  >
                    {/* Timeline Node */}
                    <div style={{ position: 'absolute', left: '-59px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-primary)', border: `4px solid ${timelineRoute === (entry.city ? `${entry.city}, ${entry.country}` : entry.country) ? 'var(--primary)' : 'var(--border)'}`, zIndex: 1, transition: 'border-color 0.2s ease' }}></div>
                    
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      ✈️
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{entry.country}</h4>
                      {entry.city && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entry.city}</span>}
                    </div>
                    {entry.visit_date && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--primary-light)', fontWeight: '800', fontSize: '1.15rem' }}>{new Date(entry.visit_date).getFullYear() || entry.visit_date}</span>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{new Date(entry.visit_date).toLocaleDateString('default', { month: 'short' })}</div>
                      </div>
                    )}
                  </div>
                ))}
                
                {(!profile.travelHistory || profile.travelHistory.length === 0) && (
                  <div className="empty-state">
                    <div className="empty-state-icon">🌎</div>
                    <h3>No travel history yet</h3>
                    <p>This traveler hasn't added any trips to their timeline.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compatibility' && compatibility && !isOwnProfile && (
          <div className="animate-in">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                  {compatibility.score >= 80 ? '🎉' : compatibility.score >= 60 ? '👍' : '🤔'}
                </div>
                <h2 style={{ fontSize: '2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {compatibility.score}% Compatible
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  You and {profile.name} for traveling together
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(compatibility.breakdown || {}).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '140px', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: value >= 70 ? 'var(--success)' : value >= 40 ? 'var(--accent)' : 'var(--danger)', borderRadius: '4px', transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ width: '40px', textAlign: 'right', fontWeight: '700', fontSize: '0.9rem' }}>{value}%</span>
                  </div>
                ))}
              </div>

              {compatibility.matches && (
                <div style={{ marginTop: '24px' }}>
                  {compatibility.matches.futureDestinations?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>🎯 Matching Future Destinations</h4>
                      <div className="tags">{compatibility.matches.futureDestinations.map(d => <span key={d} className="tag">{d}</span>)}</div>
                    </div>
                  )}
                  {compatibility.matches.styles?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>🎒 Shared Travel Style</h4>
                      <div className="tags">{compatibility.matches.styles.map(s => <span key={s} className="tag tag-accent">{s}</span>)}</div>
                    </div>
                  )}
                  {compatibility.matches.interests?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>⭐ Common Interests</h4>
                      <div className="tags">{compatibility.matches.interests.map(i => <span key={i} className="tag tag-success">{i}</span>)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'compatibility' && isOwnProfile && (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <h3>View your compatibility with others</h3>
            <p>Visit another traveler&apos;s profile to see your travel compatibility score!</p>
            <Link href="/discover" className="btn btn-primary">Discover Travelers</Link>
          </div>
        )}
      </div>
    </div>
  );
}
