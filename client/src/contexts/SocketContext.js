'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Next.js's native reverse proxy (rewrites) drops WebSocket Upgrade headers.
    // If the user accesses the raw EC2 port 3000 (e.g. http://13.235.34.138:3000), Next.js will brick the chat.
    // We intelligently bypass Next.js by connecting straight to the backend Node container on port 5000 instead!
    // But if accessed properly through Nginx via a live domain (no '3000' in port), we use the domain origin.
    let socketUrl = '';
    if (typeof window !== 'undefined') {
      if (window.location.port === '3000') {
        socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
      } else {
        socketUrl = window.location.origin;
      }
    }

    const newSocket = io(socketUrl, {
      path: '/api/socket.io',
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (err) => {
      console.log('Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
