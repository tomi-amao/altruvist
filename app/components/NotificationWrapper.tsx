import React, { useEffect } from 'react';
import { IMessage } from '@novu/shared';
import { CustomNotification } from './CustomNotification';
import { useViewport } from '~/hooks/useViewport';

interface NotificationWrapperProps {
  notification: IMessage;
  storageKey?: string;
}

// This component serves as a stable wrapper around notifications
export const NotificationWrapper: React.FC<NotificationWrapperProps> = ({ notification, storageKey }) => {
  // Use a unique key based on notification ID to force proper re-renders
  const uniqueKey = storageKey || `notification-${notification.id}`;
  const { isMobile } = useViewport();

  // Clean up stale notification data in storage (could be run periodically)
  useEffect(() => {
    const cleanupStorage = () => {
      try {
        // Get all storage keys
        const keys = Object.keys(sessionStorage);
        const now = new Date().getTime();
        const ONE_DAY = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        
        keys.forEach(key => {
          if (key.startsWith('notification-')) {
            try {
              const data = JSON.parse(sessionStorage.getItem(key) || '{}');
              
              // Remove items older than a day
              if (data.timestamp && now - data.timestamp > ONE_DAY) {
                sessionStorage.removeItem(key);
              }
            } catch (e) {
              // If parsing fails, remove the item
              sessionStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.error('Error cleaning up notification storage:', error);
      }
    };
    
    cleanupStorage();
  }, []);

  return (
    <div key={uniqueKey} className={isMobile ? "w-full max-w-full" : ""}>
      <CustomNotification 
        notification={notification} 
        storageKey={uniqueKey}
      />
    </div>
  );
};
