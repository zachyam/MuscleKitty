import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFriendRequestCount } from './friends';
import { useUser } from './UserContext';

type FriendRequestContextType = {
  pendingRequestsCount: number;
  refreshRequestCount: () => Promise<void>;
};

const FriendRequestContext = createContext<FriendRequestContextType>({
  pendingRequestsCount: 0,
  refreshRequestCount: async () => {},
});

export const useFriendRequests = () => useContext(FriendRequestContext);

export const FriendRequestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const { user } = useUser();

  // Function to refresh the request count
  const refreshRequestCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await getFriendRequestCount(user.id);
      setPendingRequestsCount(count);
    } catch (error) {
      console.error('Error refreshing friend request count:', error);
    }
  };
  
  // Set up regular database polling for friend requests
  useEffect(() => {
    if (!user?.id) return;
    
    // Initial load
    refreshRequestCount();
    
    // Set up a polling interval (every 30 seconds)
    // This could be replaced with Supabase realtime subscriptions in a future version
    const interval = setInterval(refreshRequestCount, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <FriendRequestContext.Provider value={{ 
      pendingRequestsCount, 
      refreshRequestCount
    }}>
      {children}
    </FriendRequestContext.Provider>
  );
};