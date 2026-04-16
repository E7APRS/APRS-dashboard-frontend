'use client';

import { useCallback, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

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

const SEVERITY_COLORS: Record<string, string> = {
    Extreme: '#dc2626',
    Severe: '#ef4444',
    Moderate: '#f97316',
    Minor: '#eab308',
    Unknown: '#6b7280',
};

interface Props {
    accessToken: string;
    mapRef: React.RefObject<L.Map | null>;
    visible: boolean;
}

export default function CapAlerts({ accessToken, mapRef, visible }: Props) {
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    const fetchAndRender = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !visible) return;

        const L = (await import('leaflet')).default;

        if (!layerGroupRef.current) {
            layerGroupRef.current = L.layerGroup().addTo(map);
        }
        layerGroupRef.current.clearLayers();

        try {
            const res = await fetch(`${BACKEND_URL}/api/cap/alerts`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) return;

            const alerts: CapAlert[] = await res.json();

            for (const alert of alerts) {
                const color = SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.Unknown;

                for (const area of alert.areas) {
                    if (area.polygon && area.polygon.length > 2) {
                        const coords = area.polygon.map(([lat, lon]) => [lat, lon] as [number, number]);
                        L.polygon(coords, {
                            color,
                            fillColor: color,
                            fillOpacity: 0.12,
                            weight: 2,
                        }).bindPopup(
                            `<div class="text-sm"><b>${alert.headline || 'Alert'}</b><br/>` +
                            `<span class="text-gray-500">Severity:</span> ${alert.severity}<br/>` +
                            `<span class="text-gray-500">Urgency:</span> ${alert.urgency}<br/>` +
                            `<span class="text-gray-500">Area:</span> ${area.areaDesc}<br/>` +
                            `${alert.description ? `<p class="mt-1 text-xs">${alert.description.slice(0, 200)}</p>` : ''}` +
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
