'use client';

import { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import L from 'leaflet';
import { Position } from '@/lib/types';
import { SOURCE_COLOR, TRACE_COLOR } from '@/lib/colors';

// Fix missing marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const APRS_SYMBOLS_BASE = 'https://cdn.jsdelivr.net/gh/hessu/aprs-symbols@master/png';

function getAprsSprite(symbolTable: string, symbolCode: string): { url: string; x: number; y: number } | null {
    const code = symbolCode.charCodeAt(0);
    if (code < 33 || code > 126) return null;
    const index = code - 33;
    const x = (index % 16) * 24;
    const y = Math.floor(index / 16) * 24;
    const sheet = symbolTable === '\\' ? '1' : '0';
    return {url: `${APRS_SYMBOLS_BASE}/aprs-symbols-24-${sheet}.png`, x, y};
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
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #1A1A1A;box-shadow:0 0 0 1px rgba(255,255,255,0.9),0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
    });
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

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function buildPopupHtml(pos: Position): string {
    const rows = [
        ['Lat', pos.lat.toFixed(5)],
        ['Lon', pos.lon.toFixed(5)],
        ['Alt', pos.altitude !== undefined ? `${pos.altitude} m` : '—'],
        ['Speed', pos.speed !== undefined ? `${pos.speed.toFixed(2)} km/h` : '—'],
        ['Course', pos.course !== undefined ? `${pos.course}°` : '—'],
        ['Comment', pos.comment || '—'],
        ['Source', pos.source],
        ['Updated', new Date(pos.timestamp).toLocaleTimeString()],
    ];

    return `
        <div class="text-sm font-mono space-y-0.5">
            <div class="font-bold text-base mb-1">${escapeHtml(pos.callsign)}</div>
            ${rows.map(([label, value]) => `<div><span class="text-gray-500">${label}:</span> ${escapeHtml(value)}</div>`).join('')}
        </div>
    `;
}

function tileLayerFor(key: TileLayerKey): L.TileLayer {
    const layer = TILE_LAYERS[key];
    return L.tileLayer(layer.url, {
        attribution: layer.attribution,
        maxZoom: layer.maxZoom,
        ...( 'maxNativeZoom' in layer ? { maxNativeZoom: layer.maxNativeZoom } : {}),
    });
}

export interface MapHandle {
    getMap(): L.Map | null;
}

function MapInner({positions, history, selectedId, activeSources = []}: Props, ref: React.ForwardedRef<MapHandle>) {
    const [tileLayer, setTileLayer] = useState<TileLayerKey>('street');
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const baseLayerRef = useRef<L.TileLayer | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const trailsLayerRef = useRef<L.LayerGroup | null>(null);
    const selectedRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
        getMap: () => mapRef.current,
    }));

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const container = containerRef.current as HTMLDivElement & { _leaflet_id?: unknown };
        if (container._leaflet_id) {
            delete container._leaflet_id;
        }

        const map = L.map(container, {
            center: [43.8563, 18.4131],
            zoom: 13,
            zoomControl: true,
        });

        const baseLayer = tileLayerFor(tileLayer).addTo(map);
        const trailsLayer = L.layerGroup().addTo(map);
        const markersLayer = L.layerGroup().addTo(map);

        mapRef.current = map;
        baseLayerRef.current = baseLayer;
        trailsLayerRef.current = trailsLayer;
        markersLayerRef.current = markersLayer;

        return () => {
            baseLayerRef.current = null;
            trailsLayerRef.current = null;
            markersLayerRef.current = null;
            selectedRef.current = null;
            map.remove();
            mapRef.current = null;
        };
        // Intentionally run once on mount/unmount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapRef.current || !baseLayerRef.current) return;

        const map = mapRef.current;
        map.removeLayer(baseLayerRef.current);
        baseLayerRef.current = tileLayerFor(tileLayer).addTo(map);
    }, [tileLayer]);

    useEffect(() => {
        if (!markersLayerRef.current || !trailsLayerRef.current) return;

        markersLayerRef.current.clearLayers();
        trailsLayerRef.current.clearLayers();

        for (const pos of positions.values()) {
            // Trail only for the selected device, and only if location actually changed
            if (selectedId && pos.radioId === selectedId) {
                const trail = history.get(pos.radioId) ?? [];
                const unique = trail.filter((p, i, arr) =>
                    i === 0 || p.lat !== arr[i - 1].lat || p.lon !== arr[i - 1].lon,
                );
                const trailCoords = unique.map(p => [p.lat, p.lon] as [number, number]);

                if (trailCoords.length > 1) {
                    L.polyline(trailCoords, {
                        color: TRACE_COLOR[pos.source] ?? '#6b7280',
                        weight: 4,
                        opacity: 1,
                    }).addTo(trailsLayerRef.current);
                }
            }

            const marker = L.marker([pos.lat, pos.lon], {
                icon: createIcon(pos.source, pos.symbol, pos.symbolTable),
            }).addTo(markersLayerRef.current);

            marker.bindPopup(buildPopupHtml(pos));
        }
    }, [positions, history, selectedId]);

    useEffect(() => {
        if (!mapRef.current || !selectedId || selectedRef.current === selectedId) return;

        const selected = positions.get(selectedId);
        if (selected) {
            mapRef.current.flyTo([selected.lat, selected.lon], 14, {duration: 1.2});
            selectedRef.current = selectedId;
        }
    }, [selectedId, positions]);

    return (
        <div className="relative w-full h-full">
            {/* APRS.fi attribution — required by ToS when using their API */}
            {activeSources.includes('aprsfi') && (
                <div
                    className="absolute bottom-8 left-2 z-[1000] bg-white/95 dark:bg-brand-onyx/95 text-brand-onyx dark:text-gray-300 text-xs px-2 py-1 rounded shadow border border-gray-500/85 dark:border-gray-500/85 pointer-events-auto">
                    Location data from{' '}
                    <a
                        href="https://aprs.fi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-dark-orange dark:text-brand-orange underline"
                    >
                        aprs.fi
                    </a>
                </div>
            )}
            {/* Tile layer switcher */}
            <div
                className="absolute top-2 right-2 z-[1000] flex rounded overflow-hidden shadow border border-gray-500/85 dark:border-gray-500/85">
                {(Object.entries(TILE_LAYERS) as [TileLayerKey, typeof TILE_LAYERS[TileLayerKey]][]).map(([key, layer]) => (
                    <button
                        key={key}
                        onClick={() => setTileLayer(key)}
                        className={`px-3 py-1 text-xs font-medium border-r border-gray-500/85 dark:border-gray-500/85 last:border-r-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange ${
                            tileLayer === key
                                ? 'bg-brand-orange text-brand-onyx'
                                : 'bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                    >
                        {layer.label}
                    </button>
                ))}
            </div>

            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}

const Map = forwardRef(MapInner);
export default Map;
