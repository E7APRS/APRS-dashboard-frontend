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
    watchedCallsigns: string[];
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

type DrawPhase = 'idle' | 'placing' | 'done';

export default function GeofencePanel({ accessToken, mapRef, socketAlerts }: Props) {
    const [visible, setVisible] = useState(false);
    const [fences, setFences] = useState<Geofence[]>([]);
    const [drawPhase, setDrawPhase] = useState<DrawPhase>('idle');
    const [vertexCount, setVertexCount] = useState(0);
    const [newName, setNewName] = useState('');
    const [newWatchedCallsigns, setNewWatchedCallsigns] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCallsigns, setEditCallsigns] = useState('');
    const [editColor, setEditColor] = useState('');
    const layerGroupRef = useRef<L.LayerGroup | null>(null);
    const drawLayerRef = useRef<L.Layer | null>(null);

    // Click-to-draw refs
    const drawVerticesRef = useRef<L.LatLng[]>([]);
    const drawMarkersRef = useRef<L.CircleMarker[]>([]);
    const drawPolylineRef = useRef<L.Polyline | null>(null);
    const drawPreviewRef = useRef<L.Polygon | null>(null);
    const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
    const mouseMoveHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
    const leafletRef = useRef<typeof import('leaflet') | null>(null);

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
        if (!map || !map.getContainer()) return;

        import('leaflet').then((L) => {
            // Verify the map is still valid (not destroyed by React remount)
            try { map.getSize(); } catch { return; }

            // Recreate layer group if the map instance changed (e.g. after reload)
            if (layerGroupRef.current) {
                try {
                    layerGroupRef.current.clearLayers();
                } catch {
                    layerGroupRef.current = null;
                }
            }
            if (!layerGroupRef.current) {
                layerGroupRef.current = L.layerGroup().addTo(map);
            }

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

    // Remove all draw artifacts from the map
    const cleanupDraw = useCallback((map: L.Map) => {
        if (clickHandlerRef.current) map.off('click', clickHandlerRef.current);
        if (mouseMoveHandlerRef.current) map.off('mousemove', mouseMoveHandlerRef.current);
        clickHandlerRef.current = null;
        mouseMoveHandlerRef.current = null;

        for (const m of drawMarkersRef.current) map.removeLayer(m);
        drawMarkersRef.current = [];
        if (drawPolylineRef.current) { map.removeLayer(drawPolylineRef.current); drawPolylineRef.current = null; }
        if (drawPreviewRef.current) { map.removeLayer(drawPreviewRef.current); drawPreviewRef.current = null; }
        drawVerticesRef.current = [];

        map.getContainer().style.cursor = '';
    }, []);

    // Start placing vertices on the map
    const startDrawing = useCallback(async () => {
        const map = mapRef.current;
        if (!map) return;

        const L = await import('leaflet');
        leafletRef.current = L;

        cleanupDraw(map);
        setDrawPhase('placing');
        setVertexCount(0);
        map.getContainer().style.cursor = 'crosshair';

        const onMouseMove = (e: L.LeafletMouseEvent) => {
            const verts = drawVerticesRef.current;
            if (verts.length < 1) return;
            if (drawPreviewRef.current) map.removeLayer(drawPreviewRef.current);
            if (verts.length >= 2) {
                drawPreviewRef.current = L.polygon(
                    [...verts, e.latlng],
                    { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2, dashArray: '6 4' },
                ).addTo(map);
            }
            if (drawPolylineRef.current) {
                drawPolylineRef.current.setLatLngs([...verts, e.latlng]);
            }
        };

        const onClick = (e: L.LeafletMouseEvent) => {
            const verts = drawVerticesRef.current;
            verts.push(e.latlng);

            const marker = L.circleMarker(e.latlng, {
                radius: 5, color: '#ef4444', fillColor: '#fff', fillOpacity: 1, weight: 2,
            }).addTo(map);
            drawMarkersRef.current.push(marker);

            if (!drawPolylineRef.current) {
                drawPolylineRef.current = L.polyline(verts, {
                    color: '#ef4444', weight: 2, dashArray: '6 4',
                }).addTo(map);
            } else {
                drawPolylineRef.current.setLatLngs(verts);
            }

            setVertexCount(verts.length);
        };

        clickHandlerRef.current = onClick;
        mouseMoveHandlerRef.current = onMouseMove;
        map.on('click', onClick);
        map.on('mousemove', onMouseMove);
    }, [mapRef, cleanupDraw]);

    // Finish placing vertices — build the final polygon
    const finishPlacing = useCallback(() => {
        const map = mapRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;

        const verts = drawVerticesRef.current;
        if (verts.length < 3) return;

        // Stop listening for clicks
        if (clickHandlerRef.current) map.off('click', clickHandlerRef.current);
        if (mouseMoveHandlerRef.current) map.off('mousemove', mouseMoveHandlerRef.current);
        clickHandlerRef.current = null;
        mouseMoveHandlerRef.current = null;

        // Remove drawing guides
        for (const m of drawMarkersRef.current) map.removeLayer(m);
        drawMarkersRef.current = [];
        if (drawPolylineRef.current) { map.removeLayer(drawPolylineRef.current); drawPolylineRef.current = null; }
        if (drawPreviewRef.current) { map.removeLayer(drawPreviewRef.current); drawPreviewRef.current = null; }
        map.getContainer().style.cursor = '';

        // Create final polygon
        const finalPoly = L.polygon(verts, {
            color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2,
        }).addTo(map);
        drawLayerRef.current = finalPoly;
        drawVerticesRef.current = [];

        setDrawPhase('done');
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
                body: JSON.stringify({
                    name: newName.trim(),
                    geometry,
                    watchedCallsigns: newWatchedCallsigns
                        .split(',')
                        .map(s => s.trim().toUpperCase())
                        .filter(Boolean),
                }),
            });
            mapRef.current?.removeLayer(layer);
            drawLayerRef.current = null;
            setNewName('');
            setNewWatchedCallsigns('');
            setDrawPhase('idle');
            setVertexCount(0);
            fetchFences();
        } catch { /* ignore */ }
    }, [newName, newWatchedCallsigns, accessToken, mapRef, fetchFences]);

    const cancelDrawing = useCallback(() => {
        const map = mapRef.current;
        if (map) {
            cleanupDraw(map);
            if (drawLayerRef.current) {
                map.removeLayer(drawLayerRef.current);
                drawLayerRef.current = null;
            }
        }
        setDrawPhase('idle');
        setVertexCount(0);
        setNewName('');
        setNewWatchedCallsigns('');
    }, [mapRef, cleanupDraw]);

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

    const startEditing = useCallback((f: Geofence) => {
        setEditingId(f.id);
        setEditName(f.name);
        setEditCallsigns(f.watchedCallsigns?.join(', ') ?? '');
        setEditColor(f.color);
    }, []);

    const saveEdit = useCallback(async () => {
        if (!editingId || !editName.trim()) return;
        await fetch(`${BACKEND_URL}/api/geofences/${editingId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                name: editName.trim(),
                color: editColor,
                watchedCallsigns: editCallsigns
                    .split(',')
                    .map(s => s.trim().toUpperCase())
                    .filter(Boolean),
            }),
        });
        setEditingId(null);
        fetchFences();
    }, [editingId, editName, editCallsigns, editColor, accessToken, fetchFences]);

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
                        <div key={f.id} className="py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            {editingId === f.id ? (
                                <div className="space-y-1.5 py-1">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="Zone name..."
                                        className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#222] text-gray-700 dark:text-gray-200"
                                    />
                                    <input
                                        type="text"
                                        value={editCallsigns}
                                        onChange={e => setEditCallsigns(e.target.value)}
                                        placeholder="Watch callsigns (comma-separated, or empty for all)"
                                        className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#222] text-gray-700 dark:text-gray-200"
                                    />
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-gray-400">Color</label>
                                        <input
                                            type="color"
                                            value={editColor}
                                            onChange={e => setEditColor(e.target.value)}
                                            className="w-6 h-5 p-0 border-0 rounded cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={saveEdit}
                                            disabled={!editName.trim()}
                                            className="flex-1 text-xs py-1 rounded bg-brand-orange text-brand-onyx disabled:opacity-40"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 text-xs py-1 rounded border border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: f.color, opacity: f.active ? 1 : 0.3 }} />
                                        <span className={`text-xs flex-1 truncate ${f.active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                                            {f.name}
                                        </span>
                                        <button
                                            onClick={() => startEditing(f)}
                                            className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            edit
                                        </button>
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
                                    <span className="text-[9px] text-gray-400 truncate block pl-5">
                                        {f.watchedCallsigns?.length > 0 ? f.watchedCallsigns.join(', ') : 'all callsigns'}
                                    </span>
                                </>
                            )}
                        </div>
                    ))}

                    {drawPhase === 'idle' && (
                        <button
                            onClick={startDrawing}
                            className="mt-2 w-full text-xs py-1 rounded border border-dashed border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            + Draw New Zone
                        </button>
                    )}

                    {drawPhase === 'placing' && (
                        <div className="mt-2 space-y-1.5">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                                Click on the map to place vertices ({vertexCount} placed).
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={finishPlacing}
                                    disabled={vertexCount < 3}
                                    className="flex-1 text-xs py-1 rounded bg-brand-orange text-brand-onyx disabled:opacity-40"
                                >
                                    Finish ({vertexCount}/3+)
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

                    {drawPhase === 'done' && (
                        <div className="mt-2 space-y-1.5">
                            <input
                                type="text"
                                placeholder="Zone name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#222] text-gray-700 dark:text-gray-200"
                            />
                            <input
                                type="text"
                                placeholder="Watch callsigns (e.g. E71DM,E72AB) or leave empty for all"
                                value={newWatchedCallsigns}
                                onChange={e => setNewWatchedCallsigns(e.target.value)}
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
