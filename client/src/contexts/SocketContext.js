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

    // Initialize socket connection using a relative path to stay on the current origin.
    // This allows the connection to work whether on localhost:3000, 13.235.34.138:3000, or travellingcv.com.
    // Next.js will proxy these requests to the backend.
    const newSocket = io({
      path: '/api/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'], // Allow polling as fallback since Next.js rewrites don't natively support WS upgrades well
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
