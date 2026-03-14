'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const WorldMap = dynamic(() => import('../../../components/WorldMapComponent'), {
  ssr: false,
  loading: () => <div style={{height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)'}}>Loading World Map Data...</div>
});

export default function DiscoverMapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState({ travelers: [], posts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      Promise.all([
        api.discoverTravelers({}),
        api.getFeed({ type: 'trip_plan' })
      ]).then(([travelersData, postsData]) => {
        setData({ travelers: travelersData, posts: postsData });
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load map data", err);
        setLoading(false);
      });
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="page container" style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <h1>Global Travel Map</h1>
        <p>Visually discover active travelers and upcoming trips around the world.</p>
      </div>

      <div className="card fade-in" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
        <WorldMap travelers={data.travelers} posts={data.posts} />
      </div>
    </div>
  );
}
