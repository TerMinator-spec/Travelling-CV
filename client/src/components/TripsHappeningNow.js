'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Link from 'next/link';
import { Users, Calendar } from 'lucide-react';

export default function TripsHappeningNow() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent trip plans and collaborations
    api.getFeed({ type: 'trip_plan,collaboration', sort: 'recent', limit: 50 })
      .then(data => {
        // Just take the top 4 upcoming/active trips
        setTrips(data.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading active trips...</div>;

  if (trips.length === 0) return (
    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
      No active trips right now.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {trips.map(trip => (
        <div key={trip.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Link href={`/profile/${trip.user_id}`}>
            <div className="avatar avatar-sm avatar-placeholder" style={{ flexShrink: 0 }}>
              {trip.user_avatar ? (
                <img src={trip.user_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : trip.user_name?.charAt(0)}
            </div>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/posts/${trip.id}`} style={{ color: 'inherit' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {trip.user_name} — {trip.destination || 'Planning a trip'}
              </div>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {trip.travelers_wanted && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> {trip.travelers_wanted} travelers</span>}
              {trip.travel_dates && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {trip.travel_dates}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
