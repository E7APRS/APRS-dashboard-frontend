# APRS Tracker — Frontend

Next.js frontend for real-time GPS tracking. Displays live radio positions on an interactive map with movement trails, device sidebar, and multi-source support.

## Features

- **Live map** — Leaflet + OpenStreetMap, auto-pans to selected device
- **Real-time updates** — Socket.io WebSocket, zero polling
- **Movement trails** — last 50 positions per device shown as a path
- **Multi-source colour coding** — distinct marker colours per data source
- **Device sidebar** — list of active radios with last position, speed, altitude, age
- **Source legend** — shows which data sources are currently active
- **APRS.fi attribution** — ToS-compliant credit shown when APRS.fi source is active
- **Startup snapshot** — receives full current state on connect, no stale data

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Map | Leaflet + react-leaflet |
| Real-time | Socket.io client |
| Styling | Tailwind CSS |
| Language | TypeScript |

## Quick Start

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

Backend must be running on the URL set in `NEXT_PUBLIC_BACKEND_URL`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3001` | Backend URL (WebSocket + REST) |

## Marker Colours

| Colour | Source |
|---|---|
| Amber | Simulator |
| Blue | APRS.fi |
| Purple | APRS-IS |
| Green | DMR (direct push) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page — WebSocket hook, state management
│   ├── layout.tsx        # Root layout, Leaflet CSS import
│   └── globals.css       # Tailwind + Leaflet overrides
├── components/
│   ├── Map.tsx           # Leaflet map, markers, trails, APRS.fi attribution
│   ├── DeviceList.tsx    # Sidebar list of active radios
│   ├── StatusBar.tsx     # Connection status + active sources
│   └── Legend.tsx        # Colour legend overlay
└── lib/
    ├── socket.ts         # Socket.io singleton client
    └── types.ts          # Shared TypeScript types
```

## WebSocket Events

The frontend connects to the backend via Socket.io and listens for:

| Event | Payload | Description |
|---|---|---|
| `positions:snapshot` | `Position[]` | Full state snapshot on connect |
| `position:update` | `Position` | Live position update |

## Position Type

```typescript
interface Position {
  radioId:   string;
  callsign:  string;
  lat:       number;
  lon:       number;
  altitude?: number;
  speed?:    number;
  course?:   number;
  comment?:  string;
  timestamp: string;
  source:    'simulator' | 'aprsfi' | 'aprsis' | 'dmr';
}
```

## Related

- [aprs-backend](../aprs-backend) — Node.js backend, APRS-IS/APRS.fi ingestion, Supabase persistence

## License

MIT
