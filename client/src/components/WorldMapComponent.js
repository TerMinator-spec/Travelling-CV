'use client';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import Link from 'next/link';

export default function WorldMapComponent({ travelers, posts }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback rough coordinates for common countries to avoid massive geocoding delays
  const commonCoords = {
    'Japan': [36.2048, 138.2529], 'USA': [37.0902, -95.7129], 'UK': [55.3781, -3.4360],
    'France': [46.2276, 2.2137], 'Italy': [41.8719, 12.5674], 'Spain': [40.4637, -3.7492],
    'Thailand': [15.8700, 100.9925], 'Bali': [-8.4095, 115.1889], 'Indonesia': [-0.7893, 113.9213],
    'Australia': [-25.2744, 133.7751], 'Brazil': [-14.2350, -51.9253], 'India': [20.5937, 78.9629],
    'Vietnam': [14.0583, 108.2772], 'Mexico': [23.6345, -102.5528], 'Canada': [56.1304, -106.3468],
    'Germany': [51.1657, 10.4515], 'Greece': [39.0742, 21.8243], 'Peru': [-9.1900, -75.0152]
  };

  useEffect(() => {
    // Generate map markers from data
    const generateMarkers = async () => {
      const markers = [];
      
      // Process Travelers (Green for visited/current)
      for (const t of travelers) {
        if (t.current_location) {
          const loc = t.current_location.split(',')[0].trim();
          let coords = commonCoords[loc];
          if (!coords && Object.keys(commonCoords).length < 50) { // arbitrary limit for this demo
             try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`);
                const data = await res.json();
                if (data && data.length > 0) coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                await new Promise(r => setTimeout(r, 400));
             } catch(e) {}
          }
          if (coords) {
             markers.push({ type: 'traveler', coords, color: '#10b981', user: t, location: loc, label: 'Currently exploring' });
          }
        }
      }

      // Process Posts (Blue for planned trips)
      for (const p of posts) {
        if (p.type === 'trip_plan' && p.destination) {
          const loc = p.destination.split('->')[0].split(',')[0].trim();
          let coords = commonCoords[loc];
          if (!coords) {
             try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`);
                const data = await res.json();
                if (data && data.length > 0) coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                await new Promise(r => setTimeout(r, 400));
             } catch(e) {}
          }
          if (coords) {
             markers.push({ type: 'trip', coords, color: '#3b82f6', post: p, location: loc, label: 'Upcoming Trip' });
          }
        }
      }

      setLocations(markers);
      setLoading(false);
    };

    if (travelers.length > 0 || posts.length > 0) {
      generateMarkers();
    } else {
      setLoading(false);
    }
  }, [travelers, posts]);

  if (loading) return <div style={{height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)'}}>Loading World Map Data...</div>;

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', zIndex: 0, position: 'relative', border: '1px solid var(--border)' }}>
      <MapContainer center={[20, 0]} zoom={2.5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} minZoom={2}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {locations.map((loc, i) => (
          <CircleMarker 
            key={i} 
            center={loc.coords} 
            radius={8}
            pathOptions={{ fillColor: loc.color, color: '#ffffff', weight: 2, fillOpacity: 0.8 }}
          >
            <Popup className="custom-popup">
              <div style={{ boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: loc.color, textTransform: 'uppercase', marginBottom: '4px' }}>{loc.label}</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#333' }}>{loc.location}</h4>
                
                {loc.type === 'traveler' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                       {loc.user.avatar ? <img src={loc.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : loc.user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>{loc.user.name}</div>
                      <Link href={`/profile/${loc.user.id}`} style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none' }}>View Profile</Link>
                    </div>
                  </div>
                )}

                {loc.type === 'trip' && (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Organized by {loc.post.user_name}</div>
                    <Link href={`/posts/${loc.post.id}`} style={{ display: 'inline-block', padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '4px', fontSize: '0.8rem', textDecoration: 'none' }}>View Trip Plan</Link>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(20, 20, 40, 0.85)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '8px', zIndex: 1000, border: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Map Legend</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.8rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid white' }}></div>
          <span>Traveler Location</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', border: '2px solid white' }}></div>
          <span>Upcoming Trip</span>
        </div>
      </div>
    </div>
  );
}
