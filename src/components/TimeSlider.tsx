'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Position } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface Props {
    accessToken: string;
    onHistoryData: (positions: Position[], isLive: boolean) => void;
}

const PRESETS = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '7d', hours: 168 },
] as const;

export default function TimeSlider({ accessToken, onHistoryData }: Props) {
    const [open, setOpen] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [sliderValue, setSliderValue] = useState(100);
    const [rangeHours, setRangeHours] = useState(24);
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef<Position[] | null>(null);
    const rangeRef = useRef({ start: '', end: '' });

    const fetchRange = useCallback(async (hours: number) => {
        setLoading(true);
        const end = new Date().toISOString();
        const start = new Date(Date.now() - hours * 3600_000).toISOString();
        rangeRef.current = { start, end };

        try {
            const res = await fetch(
                `${BACKEND_URL}/api/positions/history?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            if (res.ok) {
                const data: Position[] = await res.json();
                cacheRef.current = data;
                return data;
            }
        } catch { /* ignore */ }
        setLoading(false);
        return null;
    }, [accessToken]);

    const goLive = useCallback(() => {
        setIsLive(true);
        setSliderValue(100);
        cacheRef.current = null;
        onHistoryData([], true);
    }, [onHistoryData]);

    const handlePreset = useCallback(async (hours: number) => {
        setRangeHours(hours);
        setIsLive(false);
        setSliderValue(100);
        const data = await fetchRange(hours);
        if (data) {
            onHistoryData(data, false);
        }
        setLoading(false);
    }, [fetchRange, onHistoryData]);

    const handleSliderChange = useCallback((value: number) => {
        setSliderValue(value);
        const all = cacheRef.current;
        if (!all || all.length === 0) return;

        const cutoffIndex = Math.floor((value / 100) * all.length);
        const slice = all.slice(0, Math.max(1, cutoffIndex));
        onHistoryData(slice, false);
    }, [onHistoryData]);

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 dark:bg-brand-onyx/95 text-xs px-3 py-1.5 rounded shadow border border-gray-500/85 dark:border-gray-500/85 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
                History Playback
            </button>
        );
    }

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 dark:bg-brand-onyx/95 rounded shadow-lg border border-gray-500/85 dark:border-gray-500/85 px-4 py-3 min-w-[340px]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    History Playback
                </span>
                <button
                    onClick={() => { setOpen(false); goLive(); }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    Close
                </button>
            </div>

            <div className="flex gap-1.5 mb-2">
                {PRESETS.map(p => (
                    <button
                        key={p.label}
                        onClick={() => handlePreset(p.hours)}
                        className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                            !isLive && rangeHours === p.hours
                                ? 'bg-brand-orange text-brand-onyx border-brand-orange'
                                : 'border-gray-500/85 dark:border-gray-500/85 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
                <button
                    onClick={goLive}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        isLive
                            ? 'bg-green-500 text-white border-green-500'
                            : 'border-gray-500/85 dark:border-gray-500/85 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                >
                    LIVE
                </button>
            </div>

            {!isLive && (
                <>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={sliderValue}
                        onChange={e => handleSliderChange(Number(e.target.value))}
                        className="w-full h-1.5 accent-brand-orange"
                        disabled={loading}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>{new Date(Date.now() - rangeHours * 3600_000).toLocaleTimeString()}</span>
                        <span>{loading ? 'Loading...' : `${cacheRef.current?.length ?? 0} positions`}</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                </>
            )}
        </div>
    );
}
