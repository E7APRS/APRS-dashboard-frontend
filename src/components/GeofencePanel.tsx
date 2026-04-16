'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface Geofence {
    id: string;
    name: string;
    description: string;
    geometry: GeoJSON.Polygon;
    color: string;
    active: boolean;
}

interface GeofenceAlert {
    type: 'enter' | 'exit';
    radioId: string;
    callsign: string;
    fenceName: string;
    timestamp: string;
}

interface Props {
    accessToken: string;
    mapRef: React.RefObject<L.Map | null>;
    socketAlerts: GeofenceAlert[];
}

export default function GeofencePanel({ accessToken, mapRef, socketAlerts }: Props) {
    const [visible, setVisible] = useState(false);
    const [fences, setFences] = useState<Geofence[]>([]);
    const [drawing, setDrawing] = useState(false);
    const [newName, setNewName] = useState('');
    const layerGroupRef = useRef<L.LayerGroup | null>(null);
    const drawLayerRef = useRef<L.Layer | null>(null);

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const fetchFences = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/geofences`, { headers });
            if (res.ok) setFences(await res.json());
        } catch { /* ignore */ }
    }, [accessToken]);

    useEffect(() => { fetchFences(); }, [fetchFences]);

    // Render geofences on map
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Import leaflet and geoman dynamically (client-side only)
        import('leaflet').then((L) => {
            if (!layerGroupRef.current) {
                layerGroupRef.current = L.layerGroup().addTo(map);
            }
            layerGroupRef.current.clearLayers();

            if (!visible) return;

            for (const fence of fences) {
                if (!fence.active) continue;
                const coords = fence.geometry.coordinates[0].map(c => [c[1], c[0]] as [number, number]);
                L.polygon(coords, {
                    color: fence.color,
                    fillColor: fence.color,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '6 4',
                }).bindPopup(`<b>${fence.name}</b><br/>${fence.description}`)
                  .addTo(layerGroupRef.current!);
            }
        });
    }, [visible, fences, mapRef]);

    // Drawing mode with leaflet-geoman
    const startDrawing = useCallback(async () => {
        const map = mapRef.current;
        if (!map) return;

        await import('leaflet');
        await import('@geoman-io/leaflet-geoman-free');
        await import('@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css');

        // Remove any stale listener before adding a new one
        map.off('pm:create');

        setDrawing(true);
        map.pm.enableDraw('Polygon', { snappable: true });

        map.on('pm:create', (e: { layer: L.Layer }) => {
            drawLayerRef.current = e.layer;
            map.pm.disableDraw();
        });
    }, [mapRef]);

    const saveDrawing = useCallback(async () => {
        if (!drawLayerRef.current || !newName.trim()) return;
        const layer = drawLayerRef.current as L.Polygon;
        const geoJson = layer.toGeoJSON();
        const geometry = geoJson.geometry;

        try {
            await fetch(`${BACKEND_URL}/api/geofences`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: newName.trim(), geometry }),
            });
            // Remove the drawn layer from the map
            mapRef.current?.removeLayer(layer);
            drawLayerRef.current = null;
            setNewName('');
            setDrawing(false);
            fetchFences();
        } catch { /* ignore */ }
    }, [newName, accessToken, mapRef, fetchFences]);

    const cancelDrawing = useCallback(() => {
        const map = mapRef.current;
        if (map) {
            map.pm.disableDraw();
            if (drawLayerRef.current) {
                map.removeLayer(drawLayerRef.current);
                drawLayerRef.current = null;
            }
        }
        setDrawing(false);
        setNewName('');
    }, [mapRef]);

    const toggleFence = useCallback(async (id: string, active: boolean) => {
        await fetch(`${BACKEND_URL}/api/geofences/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ active }),
        });
        fetchFences();
    }, [accessToken, fetchFences]);

    const removeFence = useCallback(async (id: string) => {
        await fetch(`${BACKEND_URL}/api/geofences/${id}`, { method: 'DELETE', headers });
        fetchFences();
    }, [accessToken, fetchFences]);

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setVisible(v => !v)}
                className={`absolute top-14 right-2 z-[1000] px-3 py-1 text-xs rounded shadow border transition-colors ${
                    visible
                        ? 'bg-brand-orange text-brand-onyx border-brand-orange'
                        : 'bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 border-gray-500/85 dark:border-gray-500/85 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
            >
                Geofences
            </button>

            {/* Alerts toast */}
            {socketAlerts.length > 0 && (
                <div className="absolute top-24 right-2 z-[1001] flex flex-col gap-1 max-w-[260px]">
                    {socketAlerts.slice(-5).map((a, i) => (
                        <div key={i} className={`text-xs px-2 py-1 rounded shadow border ${
                            a.type === 'enter'
                                ? 'bg-red-500/90 text-white border-red-600'
                                : 'bg-yellow-500/90 text-black border-yellow-600'
                        }`}>
                            <b>{a.callsign}</b> {a.type === 'enter' ? 'entered' : 'exited'} <b>{a.fenceName}</b>
                        </div>
                    ))}
                </div>
            )}

            {/* Panel */}
            {visible && (
                <div className="absolute top-24 right-2 z-[1000] bg-white/95 dark:bg-brand-onyx/95 rounded shadow-lg border border-gray-500/85 dark:border-gray-500/85 p-3 w-64 max-h-[60vh] overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                        Geofence Zones
                    </div>

                    {fences.map(f => (
                        <div key={f.id} className="flex items-center gap-2 py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: f.color, opacity: f.active ? 1 : 0.3 }} />
                            <span className={`text-xs flex-1 truncate ${f.active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                                {f.name}
                            </span>
                            <button
                                onClick={() => toggleFence(f.id, !f.active)}
                                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {f.active ? 'off' : 'on'}
                            </button>
                            <button
                                onClick={() => removeFence(f.id)}
                                className="text-[10px] text-red-400 hover:text-red-600"
                            >
                                del
                            </button>
                        </div>
                    ))}

                    {!drawing ? (
                        <button
                            onClick={startDrawing}
                            className="mt-2 w-full text-xs py-1 rounded border border-dashed border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            + Draw New Zone
                        </button>
                    ) : (
                        <div className="mt-2 space-y-1.5">
                            <input
                                type="text"
                                placeholder="Zone name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#222] text-gray-700 dark:text-gray-200"
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={saveDrawing}
                                    disabled={!newName.trim()}
                                    className="flex-1 text-xs py-1 rounded bg-brand-orange text-brand-onyx disabled:opacity-40"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={cancelDrawing}
                                    className="flex-1 text-xs py-1 rounded border border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
