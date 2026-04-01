'use client';

import { Position } from '@/lib/types';

interface Props {
  positions: Map<string, Position>;
  selectedId: string | null;
  onSelect: (radioId: string) => void;
}

const SOURCE_BADGE: Record<string, string> = {
  simulator: 'bg-yellow-500',
  aprsfi:    'bg-blue-500',
  dmr:       'bg-green-500',
};

function timeSince(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function DeviceList({ positions, selectedId, onSelect }: Props) {
  const devices = Array.from(positions.values()).sort((a, b) =>
    a.callsign.localeCompare(b.callsign)
  );

  if (devices.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400 italic">
        Waiting for devices...
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-700">
      {devices.map(pos => (
        <li
          key={pos.radioId}
          className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
            selectedId === pos.radioId ? 'bg-gray-700' : ''
          }`}
          onClick={() => onSelect(pos.radioId)}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold text-white">{pos.callsign}</span>
            <span
              className={`text-xs text-white px-1.5 py-0.5 rounded ${SOURCE_BADGE[pos.source] ?? 'bg-gray-500'}`}
            >
              {pos.source}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {timeSince(pos.timestamp)}
            {pos.speed !== undefined && ` · ${pos.speed} km/h`}
            {pos.altitude !== undefined && ` · ${pos.altitude}m`}
          </div>
        </li>
      ))}
    </ul>
  );
}
