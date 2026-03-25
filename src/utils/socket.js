// ═══ SOCKET.IO CLIENT — Real-time updates ═══
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

let socket = null;

export function connectSocket(companyId) {
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { autoConnect: true, reconnection: true, reconnectionDelay: 1000 });
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (companyId) socket.emit('join-company', companyId);
  });
  socket.on('disconnect', () => console.log('Socket disconnected'));
  return socket;
}

export function onEvent(event, callback) {
  if (socket) socket.on(event, callback);
}

export function offEvent(event, callback) {
  if (socket) socket.off(event, callback);
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export { socket };
