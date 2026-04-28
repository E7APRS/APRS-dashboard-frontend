'use client';

import {useEffect, useState} from 'react';
import {SOURCE_COLOR} from '@/lib/colors';
import {Position} from '@/lib/types';
import {loadSettings} from '@/app/settings/page';

interface Props {
    positions: Map<string, Position>;
    selectedId: string | null;
    onSelect: (radioId: string) => void;
}

type SortField = 'name' | 'time';
type SortDir = 'asc' | 'desc';

function timeSince(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DeviceList({positions, selectedId, onSelect}: Props) {
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [query, setQuery] = useState('');
    const [staleMs, setStaleMs] = useState(loadSettings().staleTimeout * 60_000);
    const [, setTick] = useState(0);

    // Force re-render every 15s so timeSince labels stay current
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 15_000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        function refresh() { setStaleMs(loadSettings().staleTimeout * 60_000); }
        window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, []);

    function isStale(iso: string): boolean {
        return Date.now() - new Date(iso).getTime() > staleMs;
    }

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
        let cmp: number;
        if (sortField === 'name') {
            cmp = a.callsign.localeCompare(b.callsign);
        } else {
            const ta = new Date(a.timestamp).getTime();
            const tb = new Date(b.timestamp).getTime();
            cmp = (isNaN(ta) || isNaN(tb)) ? 0 : ta - tb;
        }
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const arrow = (field: SortField) => {
        if (sortField !== field) return <span className="text-gray-500 dark:text-gray-500">↕</span>;
        return sortDir === 'asc' ? '↑' : '↓';
    };

    return (
        <>
            <div className="px-3 py-2 border-b border-gray-500/85 dark:border-gray-500/85">
                <input
                    type="text"
                    placeholder="Search callsign..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-brand-onyx text-brand-onyx dark:text-white text-xs px-2 py-1.5 rounded border border-gray-500/85 dark:border-gray-500/85 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx"
                />
            </div>

            {devices.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 dark:text-gray-400 italic">
                    {positions.size === 0 ? 'Waiting for devices...' : 'No devices found.'}
                </div>
            ) : (<>

                <div
                    className="flex border-b border-gray-500/85 dark:border-gray-500/85 text-xs text-gray-600 dark:text-gray-400">
                    <button
                        className={`flex-1 px-3 py-1.5 text-left transition-colors hover:text-brand-dark-orange dark:hover:text-brand-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange ${sortField === 'name' ? 'text-brand-dark-orange dark:text-brand-orange' : ''}`}
                        onClick={() => toggleSort('name')}
                    >
                        Name {arrow('name')}
                    </button>
                    <button
                        className={`flex-1 px-3 py-1.5 text-left transition-colors hover:text-brand-dark-orange dark:hover:text-brand-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange ${sortField === 'time' ? 'text-brand-dark-orange dark:text-brand-orange' : ''}`}
                        onClick={() => toggleSort('time')}
                    >
                        Last seen {arrow('time')}
                    </button>
                </div>

                <ul className="divide-y divide-gray-500/85 dark:divide-gray-500/85">
                    {devices.map(pos => {
                        const sourceColor = SOURCE_COLOR[pos.source] ?? '#6b7280';
                        const stale = isStale(pos.timestamp);

                        return (
                            <li
                                key={pos.radioId}
                                className={`p-3 cursor-pointer transition-colors ${
                                    stale ? 'opacity-50' : ''
                                } ${
                                    selectedId === pos.radioId
                                        ? 'bg-brand-orange/10 border-l-2 border-brand-dark-orange dark:border-brand-orange'
                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                                onClick={() => onSelect(pos.radioId)}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`font-mono font-semibold ${stale ? 'text-gray-400 dark:text-gray-500' : 'text-brand-onyx dark:text-white'}`}>{pos.callsign}</span>
                                    <div className="flex items-center gap-1">
                                        {stale && <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">stale</span>}
                                        <span
                                            className="text-xs text-black px-1.5 py-0.5 rounded"
                                            style={{backgroundColor: sourceColor, opacity: stale ? 0.5 : 1}}
                                        >
                                          {pos.source}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                    {pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
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
