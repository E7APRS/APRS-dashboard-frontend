'use client';

import { useState } from 'react';
import { SOURCE_COLOR } from '@/lib/colors';
import { Position } from '@/lib/types';

interface Props {
  positions: Map<string, Position>;
  selectedId: string | null;
  onSelect: (radioId: string) => void;
}

type SortField = 'name' | 'time';
type SortDir   = 'asc' | 'desc';

function timeSince(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function DeviceList({ positions, selectedId, onSelect }: Props) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir,   setSortDir]   = useState<SortDir>('asc');
  const [query,     setQuery]     = useState('');

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const q = query.trim().toLowerCase();

  const devices = Array.from(positions.values()).filter(p =>
    !q || p.callsign.toLowerCase().includes(q)
  ).sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.callsign.localeCompare(b.callsign);
    } else {
      cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const arrow = (field: SortField) => {
    if (sortField !== field) return <span className="text-gray-600">↕</span>;
    return sortDir === 'asc' ? '↑' : '↓';
  };

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search callsign..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-600 placeholder-gray-500 focus:outline-none focus:border-gray-400"
        />
      </div>

      {devices.length === 0 ? (
        <div className="p-4 text-sm text-gray-400 italic">
          {positions.size === 0 ? 'Waiting for devices...' : 'No devices found.'}
        </div>
      ) : (<>

      <div className="flex border-b border-gray-700 text-xs text-gray-400">
        <button
          className={`flex-1 px-3 py-1.5 text-left hover:text-white transition-colors ${sortField === 'name' ? 'text-white' : ''}`}
          onClick={() => toggleSort('name')}
        >
          Name {arrow('name')}
        </button>
        <button
          className={`flex-1 px-3 py-1.5 text-left hover:text-white transition-colors ${sortField === 'time' ? 'text-white' : ''}`}
          onClick={() => toggleSort('time')}
        >
          Last seen {arrow('time')}
        </button>
      </div>

      <ul className="divide-y divide-gray-700">
        {devices.map(pos => {
          const sourceColor = SOURCE_COLOR[pos.source] ?? '#6b7280';

          return (
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
                  className="text-xs text-white px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: sourceColor }}
                >
                  {pos.source}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {timeSince(pos.timestamp)}
                {pos.speed !== undefined && ` · ${pos.speed.toFixed(2)} km/h`}
                {pos.altitude !== undefined && ` · ${pos.altitude}m`}
              </div>
            </li>
          );
        })}
      </ul>
      </>)}
    </>
  );
}
