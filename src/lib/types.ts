export interface Position {
  radioId: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude?: number;
  speed?: number;
  course?: number;
  comment?: string;
  timestamp: string;
  source: 'simulator' | 'aprsfi' | 'dmr';
}

export interface Device {
  radioId: string;
  callsign: string;
  lastSeen: string;
  lastPosition: Position;
}
