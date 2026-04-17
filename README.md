# APRS Tracker — Frontend

Next.js frontend for real-time GPS tracking. Displays live radio positions on an interactive map with movement trails,
device sidebar, search, sorting, and APRS symbol icons.

## Features

- **Live map** — Leaflet + OpenStreetMap/Topo/Satellite tile layers
- **APRS symbol icons** — sprite sheet from [hessu/aprs-symbols](https://github.com/hessu/aprs-symbols) via CDN
- **Real-time updates** — Socket.io WebSocket, zero polling
- **Trail history** — last 50 positions per device shown as a polyline
- **Auto-center on E70AB** — map centers on E70AB on startup if present
- **Device sidebar** — searchable, sortable list (name / last seen, ASC / DESC)
- **Tile layer switcher** — Karta / Topo / Satelit
- **Multi-source colour coding** — trail colour per data source
- **APRS.fi attribution** — ToS-compliant credit when APRS.fi source is active

## Tech Stack

| Layer     | Choice                  |
|-----------|-------------------------|
| Framework | Next.js 14 (App Router) |
| Map       | Leaflet + react-leaflet |
| Real-time | Socket.io client        |
| Styling   | Tailwind CSS            |
| Language  | TypeScript              |

## Quick Start

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Backend must be running at `NEXT_PUBLIC_BACKEND_URL`.

## Environment Variables

| Variable                  | Default                 | Description                    |
|---------------------------|-------------------------|--------------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3001` | Backend URL (WebSocket + REST) |

## APRS Symbol Icons

Icons are rendered using the [hessu/aprs-symbols](https://github.com/hessu/aprs-symbols) sprite sheets loaded from
jsDelivr CDN. No local assets needed.

Each symbol is a 24×24px tile in a 16-column grid. Position formula:

```
index = charCode(symbolCode) - 33
x     = (index % 16) * 24
y     = Math.floor(index / 16) * 24
```

Sheet `0` = primary table (`/`), Sheet `1` = alternate table (`\`).

Fallback to a coloured circle if no symbol data is present (e.g. devices loaded from cache without symbol info).

## Source Colours (trail lines)

| Colour | Source         |
|--------|----------------|
| Blue   | APRS.fi        |
| Purple | APRS-IS        |
| Green  | DMR            |
| Orange | Relay (LoRa)   |
| Gray   | Fixed stations |

## WebSocket Events

| Event                | Payload                       | Description                      |
|----------------------|-------------------------------|----------------------------------|
| `positions:snapshot` | `Position[]`                  | All current positions on connect |
| `history:snapshot`   | `Record<radioId, Position[]>` | Trail history on connect         |
| `position:update`    | `Position`                    | Live position update             |

## Position Type

```typescript
interface Position {
    radioId: string;
    callsign: string;
    lat: number;
    lon: number;
    altitude?: number;
    speed?: number;
    course?: number;
    comment?: string;
    symbol?: string;       // APRS symbol code e.g. '-', '[', '>'
    symbolTable?: string;       // '/' = primary, '\' = alternate
    timestamp: string;
    source: 'aprsfi' | 'aprsis' | 'dmr' | 'relay' | 'fixed';
}
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Root — WebSocket, state, auto-center logic
│   ├── layout.tsx        # Root layout, Leaflet CSS import
│   └── globals.css       # Tailwind + Leaflet overrides
├── components/
│   ├── Map.tsx           # Leaflet map, APRS icon sprites, trails, tile switcher
│   ├── DeviceList.tsx    # Sidebar — search + sort + device list
│   ├── StatusBar.tsx     # Connection status + active sources + device count
│   └── Legend.tsx        # Source colour legend overlay
└── lib/
    ├── socket.ts         # Socket.io singleton client
    ├── types.ts          # Shared TypeScript types
    └── colors.ts         # Source → colour mapping
```

## License

Copyright (c) 2026 Adin Bešlagić. All rights reserved.  
Reuse permitted only with written permission from the author.  
See [LICENSE](./LICENSE) for full terms.
