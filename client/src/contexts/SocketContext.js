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

    // In local development (next dev), WebSockets natively hang because of proxy bugs.
    // To solve this, we connect directly to port 5000 if we detect 'localhost', exactly as it was originally.
    // But in production, we seamlessly connect to the current Live Domain and let Nginx/Next handle the proxy.
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const socketUrl = isLocalhost ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : '');

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
