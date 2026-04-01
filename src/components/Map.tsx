'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Position } from '@/lib/types';

// Fix missing marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const SOURCE_COLOR: Record<string, string> = {
  simulator: '#f59e0b',  // amber
  aprsfi:    '#3b82f6',  // blue
  aprsis:    '#a855f7',  // purple
  dmr:       '#22c55e',  // green
};

function createIcon(source: string): L.DivIcon {
  const color = SOURCE_COLOR[source] ?? '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function FlyToSelected({ position }: { position: Position | null }) {
  const map = useMap();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (position && position.radioId !== prev.current) {
      map.flyTo([position.lat, position.lon], 14, { duration: 1.2 });
      prev.current = position.radioId;
    }
  }, [map, position]);

  return null;
}

interface Props {
  positions: Map<string, Position>;
  history: Map<string, Position[]>;
  selectedId: string | null;
  activeSources?: string[];
}

export default function Map({ positions, history, selectedId, activeSources = [] }: Props) {
  const selected = selectedId ? positions.get(selectedId) ?? null : null;
  const devices = Array.from(positions.values());

  return (
    <div className="relative w-full h-full">
    {/* APRS.fi attribution — required by ToS when using their API */}
    {activeSources.includes('aprsfi') && (
      <div className="absolute bottom-8 left-2 z-[1000] bg-white/90 text-xs px-2 py-1 rounded shadow pointer-events-auto">
        Location data from{' '}
        <a
          href="https://aprs.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          aprs.fi
        </a>
      </div>
    )}
    <MapContainer
      center={[43.8563, 18.4131]}
      zoom={13}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToSelected position={selected} />

      {devices.map(pos => {
        const trail = history.get(pos.radioId) ?? [];
        const trailCoords = trail.map(p => [p.lat, p.lon] as [number, number]);

        return (
          <div key={pos.radioId}>
            {trailCoords.length > 1 && (
              <Polyline
                positions={trailCoords}
                color={SOURCE_COLOR[pos.source] ?? '#6b7280'}
                weight={2}
                opacity={0.5}
              />
            )}
            <Marker position={[pos.lat, pos.lon]} icon={createIcon(pos.source)}>
              <Popup>
                <div className="text-sm font-mono">
                  <div className="font-bold text-base">{pos.callsign}</div>
                  <div>ID: {pos.radioId}</div>
                  <div>Lat: {pos.lat.toFixed(5)}</div>
                  <div>Lon: {pos.lon.toFixed(5)}</div>
                  {pos.altitude !== undefined && <div>Alt: {pos.altitude}m</div>}
                  {pos.speed !== undefined && <div>Speed: {pos.speed} km/h</div>}
                  {pos.course !== undefined && <div>Course: {pos.course}°</div>}
                  {pos.comment && <div>Comment: {pos.comment}</div>}
                  <div>Source: {pos.source}</div>
                  <div>Updated: {new Date(pos.timestamp).toLocaleTimeString()}</div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
    </div>
  );
}
