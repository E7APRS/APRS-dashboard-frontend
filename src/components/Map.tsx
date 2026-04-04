'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Position } from '@/lib/types';
import {SOURCE_COLOR, TRACE_COLOR} from '@/lib/colors';

// Fix missing marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const APRS_SYMBOLS_BASE = 'https://cdn.jsdelivr.net/gh/hessu/aprs-symbols@master/png';

function getAprsSprite(symbolTable: string, symbolCode: string): { url: string; x: number; y: number } | null {
  const code = symbolCode.charCodeAt(0);
  if (code < 33 || code > 126) return null;
  const index = code - 33;
  const x = (index % 16) * 24;
  const y = Math.floor(index / 16) * 24;
  const sheet = symbolTable === '\\' ? '1' : '0';
  return { url: `${APRS_SYMBOLS_BASE}/aprs-symbols-24-${sheet}.png`, x, y };
}

function createIcon(source: string, symbol?: string, symbolTable?: string): L.DivIcon {
  if (symbol) {
    const sprite = getAprsSprite(symbolTable ?? '/', symbol);
    if (sprite) {
      return L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;overflow:hidden;background-image:url('${sprite.url}');background-position:-${sprite.x}px -${sprite.y}px;background-repeat:no-repeat;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });
    }
  }

  // Fallback — plain colored circle (no symbol data)
  const color = SOURCE_COLOR[source] ?? '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
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

const TILE_LAYERS = {
  street: {
    label: 'Karta',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  topo: {
    label: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    maxZoom: 19,
    maxNativeZoom: 17,
  },
  satellite: {
    label: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    maxZoom: 19,
    maxNativeZoom: 18,
  },
};

type TileLayerKey = keyof typeof TILE_LAYERS;

export default function Map({ positions, history, selectedId, activeSources = [] }: Props) {
  const selected = selectedId ? positions.get(selectedId) ?? null : null;
  const devices = Array.from(positions.values());
  const [tileLayer, setTileLayer] = useState<TileLayerKey>('street');

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
    {/* Tile layer switcher */}
    <div className="absolute top-2 right-2 z-[1000] flex rounded overflow-hidden shadow">
      {(Object.entries(TILE_LAYERS) as [TileLayerKey, typeof TILE_LAYERS[TileLayerKey]][]).map(([key, layer]) => (
        <button
          key={key}
          onClick={() => setTileLayer(key)}
          className={`px-3 py-1 text-xs font-medium border-r last:border-r-0 ${
            tileLayer === key
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>

    <MapContainer
      center={[43.8563, 18.4131]}
      zoom={13}
      maxZoom={19}
      className="w-full h-full"
    >
      <TileLayer
        key={tileLayer}
        attribution={TILE_LAYERS[tileLayer].attribution}
        url={TILE_LAYERS[tileLayer].url}
        maxZoom={TILE_LAYERS[tileLayer].maxZoom}
        {...('maxNativeZoom' in TILE_LAYERS[tileLayer] && { maxNativeZoom: (TILE_LAYERS[tileLayer] as { maxNativeZoom: number }).maxNativeZoom })}
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
                color={TRACE_COLOR[pos.source] ?? '#6b7280'}
                weight={4}
                opacity={1}
              />
            )}
            <Marker position={[pos.lat, pos.lon]} icon={createIcon(pos.source, pos.symbol, pos.symbolTable)}>
              <Popup>
                <div className="text-sm font-mono space-y-0.5">
                  <div className="font-bold text-base mb-1">{pos.callsign}</div>
                  <div><span className="text-gray-500">Lat:</span> {pos.lat.toFixed(5)}</div>
                  <div><span className="text-gray-500">Lon:</span> {pos.lon.toFixed(5)}</div>
                  <div><span className="text-gray-500">Alt:</span> {pos.altitude !== undefined ? `${pos.altitude} m` : '—'}</div>
                  <div><span className="text-gray-500">Speed:</span> {pos.speed !== undefined ? `${pos.speed.toFixed(2)} km/h` : '—'}</div>
                  <div><span className="text-gray-500">Course:</span> {pos.course !== undefined ? `${pos.course}°` : '—'}</div>
                  <div><span className="text-gray-500">Comment:</span> {pos.comment || '—'}</div>
                  <div><span className="text-gray-500">Source:</span> {pos.source}</div>
                  <div><span className="text-gray-500">Updated:</span> {new Date(pos.timestamp).toLocaleTimeString()}</div>
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
