import {io, Socket} from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
    if (socket && token && socket.auth && (socket.auth as Record<string, string>).token !== token) {
        socket.disconnect();
        socket = null;
    }
    if (!socket) {
        socket = io(BACKEND_URL, {
            auth: {token},
            autoConnect: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
        });
    }
    return socket;
}

export function disconnectSocket(): void {
    socket?.disconnect();
    socket = null;
}
