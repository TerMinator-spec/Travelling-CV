'use client';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>Loading interactive map...</div>
});

export default function MapPreview({ routeStr }) {
  if (!routeStr) return null;
  return <MapComponent routeStr={routeStr} />;
}
