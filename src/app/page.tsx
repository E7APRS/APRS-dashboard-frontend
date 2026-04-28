'use client';

import dynamic from 'next/dynamic';
import type L from 'leaflet';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {disconnectSocket, getSocket} from '@/lib/socket';
import {Position} from '@/lib/types';
import DeviceList from '@/components/DeviceList';
import StatusBar from '@/components/StatusBar';
import Legend from '@/components/Legend';
import TimeSlider from '@/components/TimeSlider';
import GeofencePanel from '@/components/GeofencePanel';
import CapAlerts from '@/components/CapAlerts';
import {useAuth} from '@/components/AuthProvider';
import {loadSettings} from '@/app/settings/page';
import type {MapHandle} from '@/components/Map';
import {createClient} from '@/lib/supabase';
import {BACKEND_URL} from '@/lib/config';

// Leaflet cannot be SSR-rendered (rename avoids shadowing global Map<K,V>)
const TrackingMap = dynamic(() => import('@/components/Map'), {ssr: false});

const HISTORY_LIMIT = 50;

export default function Home() {
    const {session, profile, loading, profileLoading} = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [positions, setPositions] = useState<Map<string, Position>>(new Map());
    const [history, setHistory] = useState<Map<string, Position[]>>(new Map());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [activeSources, setActiveSources] = useState<string[]>([]);
    const [historyMode, setHistoryMode] = useState(false);
    const [geofenceAlerts, setGeofenceAlerts] = useState<Array<{type: 'enter' | 'exit'; radioId: string; callsign: string; fenceName: string; timestamp: string}>>([]);
    const [capAlertsVisible, setCapAlertsVisible] = useState(false);
    const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());
    const livePositionsRef = useRef<Map<string, Position>>(new Map());
    const liveHistoryRef = useRef<Map<string, Position[]>>(new Map());
    const historyModeRef = useRef(false);
    const mapHandleRef = useRef<MapHandle>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const initialCentered = useRef(false);

    // Load display settings from localStorage (and refresh on window focus)
    const hiddenSourcesRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        function applySettings() {
            const s = loadSettings();
            setCapAlertsVisible(prev => prev === s.capAlerts ? prev : s.capAlerts);
            // Only update if the actual hidden sources changed
            const next = new Set(s.hiddenSources);
            const prev = hiddenSourcesRef.current;
            if (next.size !== prev.size || [...next].some(x => !prev.has(x))) {
                hiddenSourcesRef.current = next;
                setHiddenSources(next);
            }
        }
        applySettings();
        window.addEventListener('focus', applySettings);
        return () => window.removeEventListener('focus', applySettings);
    }, []);

    // Keep leafletMapRef in sync with the dynamically loaded map component
    useEffect(() => {
        const interval = setInterval(() => {
            const map = mapHandleRef.current?.getMap() ?? null;
            if (map && !leafletMapRef.current) {
                leafletMapRef.current = map;
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    // Redirect to login if not authenticated, or to complete-profile if no profile
    useEffect(() => {
        if (!loading && !session) {
            router.replace('/login');
        } else if (!loading && session && !profileLoading && !profile) {
            router.replace('/complete-profile');
        }
    }, [session, profile, loading, profileLoading, router]);

    const applyPosition = useCallback((pos: Position) => {
        // Always update live refs so we can restore after history mode
        livePositionsRef.current = new Map(livePositionsRef.current).set(pos.radioId, pos);
        const liveTrail = [...(liveHistoryRef.current.get(pos.radioId) ?? []), pos];
        if (liveTrail.length > HISTORY_LIMIT) liveTrail.shift();
        liveHistoryRef.current = new Map(liveHistoryRef.current).set(pos.radioId, liveTrail);

        // Only update display state if in live mode
        if (!historyModeRef.current) {
            setPositions(prev => new Map(prev).set(pos.radioId, pos));
            setHistory(prev => {
                const map = new Map(prev);
                const trail = [...(map.get(pos.radioId) ?? []), pos];
                if (trail.length > HISTORY_LIMIT) trail.shift();
                return map.set(pos.radioId, trail);
            });
        }
    }, []);

    const handleHistoryData = useCallback((data: Position[], isLive: boolean) => {
        if (isLive) {
            historyModeRef.current = false;
            setHistoryMode(false);
            setPositions(new Map(livePositionsRef.current));
            setHistory(new Map(liveHistoryRef.current));
            return;
        }
        historyModeRef.current = true;
        setHistoryMode(true);
        // Group positions by radioId, use latest as current position
        const posMap = new Map<string, Position>();
        const histMap = new Map<string, Position[]>();
        for (const pos of data) {
            posMap.set(pos.radioId, pos);
            const trail = histMap.get(pos.radioId) ?? [];
            trail.push(pos);
            histMap.set(pos.radioId, trail);
        }
        setPositions(posMap);
        setHistory(histMap);
    }, []);

    // Fetch status — active sources + feature flags
    useEffect(() => {
        if (!session) return;
        fetch(`${BACKEND_URL}/api/status`, {
            headers: {Authorization: `Bearer ${session.access_token}`},
        })
            .then(r => r.json())
            .then(data => setActiveSources(data.activeSources ?? []))
            .catch(() => {
            });
    }, [session]);

    // WebSocket
    useEffect(() => {
        if (!session) return;
        const socket = getSocket(session.access_token);

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('positions:snapshot', (data: Position[]) => {
            data.forEach(applyPosition);
            if (!initialCentered.current) {
                const e70ab = data.find(p => p.radioId === 'E70AB' || p.radioId.startsWith('E70AB-'));
                if (e70ab) {
                    setSelectedId(e70ab.radioId);
                    initialCentered.current = true;
                }
            }
        });

        socket.on('history:snapshot', (data: Record<string, Position[]>) => {
            // Always update live refs
            for (const [radioId, trail] of Object.entries(data)) {
                liveHistoryRef.current = new Map(liveHistoryRef.current).set(radioId, trail);
            }
            // Only update display if not in history playback mode
            if (!historyModeRef.current) {
                setHistory(prev => {
                    const map = new Map(prev);
                    for (const [radioId, trail] of Object.entries(data)) {
                        map.set(radioId, trail);
                    }
                    return map;
                });
            }
        });

        socket.on('position:update', (pos: Position) => {
            applyPosition(pos);
        });

        socket.on('geofence:alert', (alert: {type: 'enter' | 'exit'; radioId: string; callsign: string; fenceName: string; timestamp: string}) => {
            setGeofenceAlerts(prev => [...prev.slice(-9), alert]);
            // Auto-dismiss after 10 seconds
            setTimeout(() => setGeofenceAlerts(prev => prev.filter(a => a !== alert)), 10000);
        });

        // If socket is already connected (e.g. navigated back from /profile),
        // just mark as connected — data is already in refs from prior session.
        // Only request snapshots if we have no data yet (fresh page load).
        if (socket.connected) {
            setConnected(true);
            if (livePositionsRef.current.size === 0) {
                socket.emit('snapshots:request');
            }
        }

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('positions:snapshot');
            socket.off('history:snapshot');
            socket.off('position:update');
            socket.off('geofence:alert');
        };
    }, [session, applyPosition]);

    async function handleSignOut() {
        disconnectSocket();
        await supabase.auth.signOut();
        router.replace('/login');
    }

    function handleProfile() {
        router.push('/profile');
    }

    function handleSettings() {
        router.push('/settings');
    }

    // Filter positions and sources by user visibility settings (memoized)
    const visibleSources = useMemo(
        () => activeSources.filter(s => !hiddenSources.has(s)),
        [activeSources, hiddenSources],
    );
    const filteredPositions = useMemo(
        () => new Map([...positions].filter(([, pos]) => !hiddenSources.has(pos.source))),
        [positions, hiddenSources],
    );
    const filteredHistory = useMemo(
        () => new Map([...history].map(([id, trail]) => [id, trail.filter(pos => !hiddenSources.has(pos.source))])),
        [history, hiddenSources],
    );

    const forwardToAprs = useCallback((radioId: string) => {
        if (!session) return;
        fetch(`${BACKEND_URL}/api/positions/${encodeURIComponent(radioId)}/forward`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => {});
    }, [session]);

    if (loading || !session || profileLoading || !profile) {
        return <div
            className="flex items-center justify-center h-screen bg-gray-50 dark:bg-brand-onyx text-gray-600 dark:text-gray-300">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen">
            <StatusBar
                connected={connected}
                activeSources={visibleSources}
                deviceCount={filteredPositions.size}
                profile={profile}
                onSignOut={handleSignOut}
                onProfile={handleProfile}
                onSettings={handleSettings}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside
                    className="w-64 bg-white dark:bg-brand-onyx border-r border-gray-500/85 dark:border-gray-500/85 overflow-y-auto flex-shrink-0 shadow-sm dark:shadow-none">
                    <div
                        className="px-4 py-3 text-xs font-rajdhani font-semibold text-brand-dark-orange dark:text-brand-orange uppercase tracking-widest border-b border-gray-500/85 dark:border-gray-500/85">
                        Devices
                    </div>
                    <DeviceList
                        positions={filteredPositions}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </aside>

                {/* Map */}
                <main className="flex-1 relative">
                    <TrackingMap
                        ref={mapHandleRef}
                        positions={filteredPositions}
                        history={filteredHistory}
                        selectedId={selectedId}
                        activeSources={visibleSources}
                        onForwardToAprs={forwardToAprs}
                    />
                    <Legend activeSources={visibleSources}/>
                    <GeofencePanel
                        accessToken={session.access_token}
                        mapRef={leafletMapRef}
                        socketAlerts={geofenceAlerts}
                    />
                    <CapAlerts
                        accessToken={session.access_token}
                        mapRef={leafletMapRef}
                        visible={capAlertsVisible}
                    />
                    <TimeSlider
                        accessToken={session.access_token}
                        onHistoryData={handleHistoryData}
                    />
                </main>
            </div>
        </div>
    );
}
