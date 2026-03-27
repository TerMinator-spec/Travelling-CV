'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { MapPin, Globe, Calendar, Award, Edit, MessageCircle, BarChart3, Languages, Compass, Heart, Star, Mountain, Plane, Users, CheckCircle2 } from 'lucide-react';
import MapPreview from '../../../components/MapPreview';

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [topTravelers, setTopTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineRoute, setTimelineRoute] = useState(null);

  const isOwnProfile = currentUser?.id === params.id;

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  useEffect(() => {
    if (currentUser) {
      loadTopTravelers();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      const data = isOwnProfile ? await api.getMyProfile() : await api.getProfile(params.id);
      setProfile(data);
      if (currentUser && !isOwnProfile) {
        try {
          const compat = await api.getCompatibility(params.id);
          setCompatibility(compat);
        } catch (err) { }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTopTravelers = async () => {
    try {
      const travelers = await api.discoverTravelers({ limit: 10 });
      let others = travelers.filter(t => t.id !== currentUser.id);

      const withScores = await Promise.all(others.map(async (t) => {
        try {
          const compat = await api.getCompatibility(t.id);
          return { ...t, compatibility: compat.score };
        } catch { return { ...t, compatibility: 0 }; }
      }));

      setTopTravelers(withScores.sort((a, b) => b.compatibility - a.compatibility).slice(0, 3));
    } catch (e) {
      console.error(e);
    }
  };

  const badgeIcons = { newcomer: '🌱', explorer: '🧭', globetrotter: '🌍', world_traveler: '🏆', continent_hopper: '✈️', nomad: '💻', trekker: '🏔️', storyteller: '📷' };

  const getCoverImage = () => {
    if (profile?.gallery?.length > 0) return profile.gallery[0].image_url;
    return 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=2000&auto=format&fit=crop';
  };

  if (loading) return <div className="loading-page page"><div className="spinner" /></div>;
  if (!profile) return <div className="page container"><div className="empty-state"><h3>Profile not found</h3></div></div>;

  const cv = profile.cv || {};
  const stats = profile.stats || {};
  const sortedHistory = profile.travelHistory?.sort((a, b) => new Date(b.visit_date || 0) - new Date(a.visit_date || 0)) || [];

  const getLocationString = (entry) => {
    if (entry.city && entry.country) return `${entry.city}, ${entry.country}`;
    return entry.city || entry.country || '';
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* 1. HERO COVER SECTION */}
      <div className="container" style={{ padding: 0 }}>
        <div className="profile-cover-immersive" style={{ backgroundImage: `url(${getCoverImage()})` }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px', display: 'flex', alignItems: 'flex-end', gap: '30px', zIndex: 10 }}>
            {/* Avatar */}
            <div className="avatar avatar-xxl avatar-placeholder" style={{ border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: 'var(--bg-secondary)', color: 'var(--primary)' }}>
              {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span>{profile.name?.charAt(0)}</span>}
            </div>

            {/* User Info Overlay */}
            <div style={{ color: 'white', flex: 1, paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '2.5rem', color: 'white', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{profile.name}</h1>

                {/* 7. BADGES & ACHIEVEMENTS (Inline) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {profile.badges?.slice(0, 3).map(b => (
                    <span key={b.id} className="badge" title={b.badge_name}>
                      {badgeIcons[b.badge_type] || '🏅'} {b.badge_name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '0.95rem', opacity: 0.9 }}>
                {cv.current_location && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> Currently in <strong>{cv.current_location}</strong></div>}
                {cv.nationality && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} /> From <strong>{cv.nationality}</strong></div>}
              </div>

              {cv.bio && <p style={{ marginTop: '12px', fontSize: '1.05rem', maxWidth: '600px', lineHeight: 1.5, opacity: 0.95 }}>"{cv.bio}"</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-grid" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>

        {/* LEFT COLUMN: MAIN STORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* 3. VISUAL TRAVEL STATS */}
          <div className="grid-4">
            <div className="card-glass" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><Globe size={28} /></div>
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{stats.totalCountries || 0}</div>
              <div className="stat-label">Countries visited</div>
              {stats.totalCountries > 0 && <div style={{ marginTop: '8px', height: '4px', background: 'rgba(2,132,199,0.1)', borderRadius: '2px' }}><div style={{ width: `${Math.min((stats.totalCountries / 195) * 100, 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }} /></div>}
            </div>
            <div className="card-glass" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ color: 'var(--success)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><MapPin size={28} /></div>
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{stats.totalCities || 0}</div>
              <div className="stat-label">Cities explored</div>
            </div>
            <div className="card-glass" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><Compass size={28} /></div>
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{stats.continentsExplored || 0}</div>
              <div className="stat-label">Continents</div>
            </div>
            <div className="card-glass" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ color: 'var(--warning)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><Plane size={28} /></div>
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>{stats.travelDistanceEstimate ? `${(stats.travelDistanceEstimate / 1000).toFixed(0)}k` : '0'}</div>
              <div className="stat-label">km Traveled</div>
            </div>
          </div>

          {/* 4. TRAVEL MAP (CORE FEATURE) */}
          <div className="card-glass" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} className="text-primary" /> Interactive Travel Map</h2>
            </div>
            {sortedHistory.length > 0 ? (
              <MapPreview routeStr={timelineRoute || sortedHistory.map(h => getLocationString(h)).filter(Boolean).join(' -> ')} />
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>No travel history to map yet.</div>
            )}
          </div>

          {/* 5. ABOUT / TRAVEL STORY SECTION */}
          <div className="card-glass travel-personality">
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Compass size={20} /> Travel Personality</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {profile.name} is a traveler who prefers
              {cv.travel_style ? ` ${cv.travel_style.toLowerCase().split(',').join(' and ')} destinations` : ' exploring new destinations'}
              {cv.interests ? `, with a strong interest in ${cv.interests.toLowerCase()}` : ''}.
              {cv.preferred_months ? ` They typically plan trips around ${cv.preferred_months}.` : ''}
              {cv.languages ? ` Speaks: ${cv.languages}.` : ''}
            </p>
          </div>

          {/* 9. TRAVEL TIMELINE */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Travel Timeline</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '3px', background: 'var(--gradient-ocean)', borderRadius: '3px' }}></div>
              
              {sortedHistory.map(entry => {
                const isSelected = timelineRoute === getLocationString(entry);
                const hasPhotos = entry.photos && entry.photos.length > 0;
                const photoArray = hasPhotos ? entry.photos.split(',') : [];
                const coverImage = hasPhotos ? photoArray[0] : `https://picsum.photos/seed/${entry.id}/800/400`;
                
                return (
                  <div 
                    key={entry.id} 
                    className="card-glass timeline-route-node" 
                    style={{ position: 'relative', display: 'flex', flexDirection: 'column', cursor: 'pointer', marginLeft: '52px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', borderColor: isSelected ? 'var(--primary)' : 'var(--glass-border)', boxShadow: isSelected ? '0 10px 40px rgba(2, 132, 199, 0.15)' : 'var(--glass-shadow)', transform: isSelected ? 'scale(1.02)' : 'scale(1)', padding: 0 }}
                    onClick={() => setTimelineRoute(prev => prev === getLocationString(entry) ? null : getLocationString(entry))}
                  >
                    <div style={{ position: 'absolute', left: '-64px', top: '24px', width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? 'var(--gradient-ocean)' : 'var(--bg-secondary)', border: `4px solid ${isSelected ? 'var(--bg-secondary)' : 'var(--border)'}`, zIndex: 10, transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? 'white' : 'transparent', boxShadow: isSelected ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none' }}>
                      {isSelected && <MapPin size={12} strokeWidth={3} />}
                    </div>
                    
                    {/* Top Image Section */}
                    <div style={{ height: '120px', width: '100%', backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--border)' }}></div>

                    {/* Bottom Text Section */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>{entry.city || entry.country}</h4>
                          {entry.city && entry.country && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {entry.country}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ padding: '4px 12px', background: 'var(--bg-hover)', borderRadius: '20px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>{entry.visit_date ? new Date(entry.visit_date).getFullYear() : ''}</span>
                          {entry.rating && (
                            <div style={{ display: 'flex', color: '#fbbf24', gap: '2px' }}>
                              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < entry.rating ? 'currentColor' : 'none'} color={i < entry.rating ? '#fbbf24' : 'var(--border)'} />)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {entry.description && (
                        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          "{entry.description}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {sortedHistory.length === 0 && (
                <div className="empty-state" style={{ marginLeft: '48px' }}><p>No passport stamps yet.</p></div>
              )}
            </div>
          </div>

          {/* 8. TRAVEL GALLERY (PREVIEW GRID) - MOVED TO LEFT COLUMN */}
          <div className="card-glass">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={20} /> Travel Photo Gallery</h3>
            {profile.gallery?.length > 0 ? (
              <div className="gallery-grid">
                {profile.gallery.slice(0, 6).map(img => (
                  <div key={img.id} className="gallery-item">
                    <img src={img.image_url} alt={img.caption || 'Photo'} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>No photos</div>
            )}
            {profile.gallery?.length > 6 && (
              <button className="btn btn-ghost btn-full" style={{ marginTop: '16px' }}>View all {profile.gallery.length} photos</button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIONS, WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 2. ACTION BUTTONS (ENHANCED) */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isOwnProfile ? (
              <>
                <Link href="/profile/edit" className="btn btn-primary btn-full" style={{ padding: '16px', fontSize: '1.05rem', borderRadius: '12px' }}><Edit size={20} /> Edit Your Profile</Link>
                <Link href="/posts/create" className="btn btn-secondary btn-full" style={{ padding: '16px', fontSize: '1.05rem', borderRadius: '12px' }}><Plane size={20} /> Plan a New Trip</Link>
              </>
            ) : (
              <>
                <Link href={`/messages?to=${params.id}`} className="btn btn-primary btn-full" style={{ padding: '16px', fontSize: '1.05rem', borderRadius: '12px' }}><MessageCircle size={20} /> Message {profile.name.split(' ')[0]}</Link>
                <Link href="/discover" className="btn btn-secondary btn-full" style={{ padding: '16px', fontSize: '1.05rem', borderRadius: '12px', background: 'var(--gradient-ocean)', color: 'white', border: 'none' }}><Users size={20} /> Find Travel Buddies</Link>
              </>
            )}
          </div>

          {/* 6. COMPATIBILITY SECTION (Surfaced for Visitors) */}
          {!isOwnProfile && compatibility && (
            <div className="card-glass" style={{ borderTop: '4px solid var(--primary)', background: 'linear-gradient(180deg, rgba(2, 132, 199, 0.05) 0%, var(--bg-glass) 100%)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', textAlign: 'center' }}>Travel Match</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '3rem', fontWeight: '900', background: compatibility.score >= 80 ? 'var(--gradient-aurora)' : compatibility.score >= 50 ? 'var(--gradient-ocean)' : 'var(--text-muted)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {compatibility.score}%
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Compatibility Score</div>
              </div>

              {compatibility.matches?.styles?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Shared Travel Style</div>
                  <div className="tags">{compatibility.matches.styles.map(s => <span key={s} className="tag"><CheckCircle2 size={12} /> {s}</span>)}</div>
                </div>
              )}
            </div>
          )}

          {/* 10. WISHLIST DESTINATIONS */}
          {cv.wishlist_destinations && (
            <div className="card-glass">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Heart size={18} className="text-danger" /> Wishlist</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cv.wishlist_destinations.split(',').map(d => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-ocean)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{d.trim().charAt(0)}</div>
                    <div style={{ fontWeight: '500' }}>{d.trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW: TOP COMPATIBLE TRAVELERS WIDGET */}
          {currentUser && topTravelers.length > 0 && (
            <div className="card-glass">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} className="text-primary" /> Top Compatible Travelers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topTravelers.map(t => (
                  <Link href={`/profile/${t.id}`} key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', transition: 'transform 0.2s ease', color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                    <div className="avatar avatar-sm avatar-placeholder" style={{ border: 'none', overflow: 'hidden' }}>
                      {t.avatar ? <img src={t.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{t.name.charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.current_location || 'World Traveler'}</div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary-dark)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {t.compatibility}% match
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Mobile styling overrides injected directly */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 900px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
