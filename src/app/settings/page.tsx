'use client';

import Image from 'next/image';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/components/AuthProvider';
import {useTheme} from '@/components/ThemeProvider';
import {SOURCE_COLOR} from '@/lib/colors';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const SOURCE_LABEL: Record<string, string> = {
    simulator: 'Simulator',
    aprsfi: 'APRS.fi',
    aprsis: 'APRS-IS',
    dmr: 'DMR',
    relay: 'LoRa Relay',
    meshtastic: 'Meshtastic',
    mqtt: 'MQTT',
    fixed: 'Fixed',
};

const SETTINGS_KEY = 'e7aprs-settings';

export interface AppSettings {
    capAlerts: boolean;
    hiddenSources: string[];
    staleTimeout: number; // minutes
}

const DEFAULTS: AppSettings = {capAlerts: false, hiddenSources: [], staleTimeout: 10};

export function loadSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULTS;
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return {...DEFAULTS, ...JSON.parse(raw)};
    } catch { /* ignore */ }
    return DEFAULTS;
}

export function saveSettings(settings: AppSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
    const {session, profile, loading, profileLoading} = useAuth();
    const {theme, toggleTheme} = useTheme();
    const router = useRouter();

    const [activeSources, setActiveSources] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
    const [loaded, setLoaded] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        setSettings(loadSettings());
        setLoaded(true);
    }, []);

    // Fetch active sources from backend
    useEffect(() => {
        if (!session) return;
        fetch(`${BACKEND_URL}/api/status`, {
            headers: {Authorization: `Bearer ${session.access_token}`},
        })
            .then(r => r.json())
            .then(data => setActiveSources(data.activeSources ?? []))
            .catch(() => {});
    }, [session]);

    function toggleCapAlerts() {
        setSettings(prev => {
            const next = {...prev, capAlerts: !prev.capAlerts};
            saveSettings(next);
            return next;
        });
    }

    function toggleSource(source: string) {
        setSettings(prev => {
            const hidden = new Set(prev.hiddenSources);
            if (hidden.has(source)) {
                hidden.delete(source);
            } else {
                hidden.add(source);
            }
            const next = {...prev, hiddenSources: [...hidden]};
            saveSettings(next);
            return next;
        });
    }

    function setStaleTimeout(minutes: number) {
        setSettings(prev => {
            const next = {...prev, staleTimeout: minutes};
            saveSettings(next);
            return next;
        });
    }

    if (loading || profileLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-brand-onyx text-gray-600 dark:text-gray-300">
                Loading...
            </div>
        );
    }

    if (!session) {
        router.replace('/login');
        return null;
    }

    if (!profile) {
        router.replace('/complete-profile');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-brand-onyx transition-colors">
            {/* Grid texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(#FF6600 1px, transparent 1px), linear-gradient(90deg, #FF6600 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Top bar */}
            <div className="relative bg-white dark:bg-[#111] border-b border-gray-500/85 dark:border-gray-500/85 shadow-sm dark:shadow-none">
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-6 py-4">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-dark-orange dark:hover:text-brand-orange transition-colors font-roboto"
                    >
                        &larr; Back to map
                    </button>
                    <span className="ml-auto">
                        <Image src="/e7aprs.png" alt="E7APRS" width={40} height={40} className="object-contain" />
                    </span>
                </div>
            </div>

            <div className="relative max-w-2xl mx-auto px-6 py-8">
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 font-rajdhani tracking-wide">
                            Settings
                        </h1>
                    </div>

                    {loaded && (
                        <div className="px-6 py-5 space-y-8">
                            {/* Appearance */}
                            <section>
                                <h2 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 font-roboto uppercase tracking-wide">
                                    Appearance
                                </h2>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={theme === 'dark'}
                                        onChange={toggleTheme}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] cursor-pointer accent-[#FF6600]"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-800 dark:text-gray-200 font-roboto group-hover:text-brand-dark-orange dark:group-hover:text-brand-orange transition-colors">
                                            Dark mode
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-roboto">
                                            Use dark theme for the interface
                                        </p>
                                    </div>
                                </label>
                            </section>

                            {/* Map Overlays */}
                            <section>
                                <h2 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 font-roboto uppercase tracking-wide">
                                    Map Overlays
                                </h2>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={settings.capAlerts}
                                        onChange={toggleCapAlerts}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-dark-orange dark:text-brand-orange focus:ring-brand-dark-orange dark:focus:ring-brand-orange bg-white dark:bg-[#1a1a1a] cursor-pointer accent-[#FF6600]"
                                    />
                                    <div>
                                        <span className="text-sm text-gray-800 dark:text-gray-200 font-roboto group-hover:text-brand-dark-orange dark:group-hover:text-brand-orange transition-colors">
                                            CAP Alerts
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-roboto">
                                            Show weather and hazard alert polygons on the map
                                        </p>
                                    </div>
                                </label>
                            </section>

                            {/* Stale Timeout */}
                            <section>
                                <h2 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 font-roboto uppercase tracking-wide">
                                    Device Staleness
                                </h2>
                                <div>
                                    <label htmlFor="staleTimeout" className="text-sm text-gray-800 dark:text-gray-200 font-roboto">
                                        Mark devices as stale after
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-roboto mb-2">
                                        Devices with no updates longer than this are dimmed in the list
                                    </p>
                                    <select
                                        id="staleTimeout"
                                        value={settings.staleTimeout}
                                        onChange={e => setStaleTimeout(Number(e.target.value))}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark-orange dark:focus:ring-brand-orange focus:border-transparent font-roboto cursor-pointer"
                                    >
                                        <option value={5}>5 minutes</option>
                                        <option value={10}>10 minutes</option>
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={120}>2 hours</option>
                                    </select>
                                </div>
                            </section>

                            {/* Data Sources */}
                            <section>
                                <h2 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 font-roboto uppercase tracking-wide">
                                    Data Sources
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-roboto mb-4">
                                    Choose which position sources are visible on the map.
                                </p>
                                <div className="space-y-3">
                                    {activeSources.map(source => {
                                        const visible = !settings.hiddenSources.includes(source);
                                        return (
                                            <label key={source} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={visible}
                                                    onChange={() => toggleSource(source)}
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a] cursor-pointer accent-[#FF6600]"
                                                />
                                                <span
                                                    className="inline-block w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-brand-onyx/70 dark:ring-white/70"
                                                    style={{backgroundColor: SOURCE_COLOR[source] ?? '#6b7280'}}
                                                />
                                                <span className="text-sm text-gray-800 dark:text-gray-200 font-roboto group-hover:text-brand-dark-orange dark:group-hover:text-brand-orange transition-colors">
                                                    {SOURCE_LABEL[source] ?? source}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {activeSources.length === 0 && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-roboto italic">
                                            No data sources active on the server.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
