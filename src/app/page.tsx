'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Position } from '@/lib/types';
import DeviceList from '@/components/DeviceList';
import StatusBar from '@/components/StatusBar';
import Legend from '@/components/Legend';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase';

// Leaflet cannot be SSR-rendered (rename avoids shadowing global Map<K,V>)
const TrackingMap = dynamic(() => import('@/components/Map'), { ssr: false });

const HISTORY_LIMIT = 50;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [positions, setPositions]   = useState<Map<string, Position>>(new Map());
  const [history, setHistory]       = useState<Map<string, Position[]>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected]   = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const initialCentered = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [session, loading, router]);

  const applyPosition = useCallback((pos: Position) => {
    setPositions(prev => new Map(prev).set(pos.radioId, pos));
    setHistory(prev => {
      const map = new Map(prev);
      const trail = [...(map.get(pos.radioId) ?? []), pos];
      if (trail.length > HISTORY_LIMIT) trail.shift();
      return map.set(pos.radioId, trail);
    });
  }, []);

  // Fetch status — active sources + feature flags
  useEffect(() => {
    if (!session) return;
    fetch(`${BACKEND_URL}/api/status`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => setActiveSources(data.activeSources ?? []))
      .catch(() => {});
  }, [session]);

  // WebSocket
  useEffect(() => {
    if (!session) return;
    const socket = getSocket(session.access_token);

    socket.on('connect',    () => setConnected(true));
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
      setHistory(prev => {
        const map = new Map(prev);
        for (const [radioId, trail] of Object.entries(data)) {
          map.set(radioId, trail);
        }
        return map;
      });
    });

    socket.on('position:update', (pos: Position) => {
      applyPosition(pos);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('positions:snapshot');
      socket.off('history:snapshot');
      socket.off('position:update');
    };
  }, [session, applyPosition]);

  async function handleSignOut() {
    disconnectSocket();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading || !session) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-400">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <StatusBar
        connected={connected}
        activeSources={activeSources}
        deviceCount={positions.size}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
            Devices
          </div>
          <DeviceList
            positions={positions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <TrackingMap
            positions={positions}
            history={history}
            selectedId={selectedId}
            activeSources={activeSources}
          />
          <Legend activeSources={activeSources} />
        </main>
      </div>
    </div>
  );
}
