import React, { useEffect } from 'react';
import { IMessage } from '@novu/shared';
import { CustomNotification } from './CustomNotification';

interface NotificationWrapperProps {
  notification: IMessage;
}

// This component serves as a stable wrapper around notifications
export const NotificationWrapper: React.FC<NotificationWrapperProps> = ({ notification }) => {
  // Use a unique key based on notification ID to force proper re-renders
  const uniqueKey = `notification-${notification.id}`;

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
    <div key={uniqueKey}>
      <CustomNotification 
        notification={notification} 
        storageKey={uniqueKey}
      />
    </div>
  );
};
