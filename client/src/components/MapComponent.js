'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { api } from '../lib/api';

export default function MapComponent({ routeStr }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!routeStr) return;

    // Parse places from string like "Delhi -> Bangkok" or "Paris, France"
    const places = routeStr.split(/->|-|to/i).map(p => p.trim()).filter(Boolean);
    if (places.length === 0) {
      setLoading(false);
      return;
    }

    const fetchCoords = async () => {
      const coords = [];
      for (const place of places) {
        try {
          const data = await api.geocode(place);
          if (data && data.length > 0) {
            coords.push([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        } catch (err) {
          console.error("Geocode skipped for", place, err);
        }
        // Strict 1-second delay to guarantee Nominatim API compliance
        await new Promise(r => setTimeout(r, 1100));
      }
      setPoints(coords);
      setLoading(false);
    };

    fetchCoords();
  }, [routeStr]);

  if (loading) return <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>Loading route map...</div>;
  if (points.length === 0) return <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>Could not locate destinations on the map.</div>;

  const center = points[0];

  return (
    <div style={{ height: '220px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 0, position: 'relative', border: '1px solid var(--border)' }}>
      <MapContainer center={center} zoom={points.length > 1 ? 4 : 8} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {points.map((pt, i) => <Marker key={i} position={pt} />)}
        {points.length > 1 && <Polyline positions={points} color="#6366f1" weight={4} dashArray="5, 10" />}
      </MapContainer>
    </div>
  );
}
