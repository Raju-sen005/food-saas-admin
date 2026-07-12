import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.restaurantId) return;

    const socketInstance = io(`${import.meta.env.VITE_APP_API_BASE}`, {
      withCredentials: true,
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      // Secure multi-tenant workspace tracking channels binding call
      socketInstance.emit('join_restaurant_room', user.restaurantId);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);