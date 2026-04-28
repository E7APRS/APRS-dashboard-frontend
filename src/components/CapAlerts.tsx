'use client';

import { useCallback, useEffect, useRef } from 'react';

import { BACKEND_URL } from '@/lib/config';

interface CapArea {
    areaDesc: string;
    polygon: [number, number][] | null;
    circle: string | null;
}

interface CapAlert {
    id: string;
    headline: string;
    description: string;
    severity: string;
    urgency: string;
    expires: string;
    areas: CapArea[];
}

import { SEVERITY_COLOR } from '@/lib/colors';

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Props {
    accessToken: string;
    mapRef: React.RefObject<L.Map | null>;
    visible: boolean;
}

export default function CapAlerts({ accessToken, mapRef, visible }: Props) {
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    const fetchAndRender = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !visible || !map.getContainer()) return;

        const L = (await import('leaflet')).default;

        // Verify the map is still valid (not destroyed by React remount)
        try { map.getSize(); } catch { return; }

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

        try {
            const res = await fetch(`${BACKEND_URL}/api/cap/alerts`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) return;

            const alerts: CapAlert[] = await res.json();

            for (const alert of alerts) {
                const color = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.Unknown;

                for (const area of alert.areas) {
                    if (area.polygon && area.polygon.length > 2) {
                        const coords = area.polygon.map(([lat, lon]) => [lat, lon] as [number, number]);
                        L.polygon(coords, {
                            color,
                            fillColor: color,
                            fillOpacity: 0.12,
                            weight: 2,
                        }).bindPopup(
                            `<div class="text-sm"><b>${esc(alert.headline || 'Alert')}</b><br/>` +
                            `<span class="text-gray-500">Severity:</span> ${esc(alert.severity)}<br/>` +
                            `<span class="text-gray-500">Urgency:</span> ${esc(alert.urgency)}<br/>` +
                            `<span class="text-gray-500">Area:</span> ${esc(area.areaDesc)}<br/>` +
                            `${alert.description ? `<p class="mt-1 text-xs">${esc(alert.description.slice(0, 200))}</p>` : ''}` +
                            `</div>`,
                        ).addTo(layerGroupRef.current!);
                    }
                }
            }
        } catch { /* ignore */ }
    }, [accessToken, mapRef, visible]);

    useEffect(() => {
        if (visible) {
            fetchAndRender();
            const interval = setInterval(fetchAndRender, 300_000); // refresh every 5 min
            return () => clearInterval(interval);
        } else {
            // Clear layers when hidden
            layerGroupRef.current?.clearLayers();
        }
    }, [visible, fetchAndRender]);

    return null;
}
