import React, { useEffect, useState, useRef } from 'react';
import { IMessage } from '@novu/shared';
import { ArchiveBox, ArrowCounterClockwise, Envelope, EnvelopeOpen, Trash, Check, X, User, Eye } from 'phosphor-react';
import { Avatar } from './cards/ProfileCard';

interface CustomNotificationProps {
  notification: IMessage;
  storageKey: string; // Add storage key prop
}

interface NotificationBody {
  message?: string;
  profilePicture?: string;
  type?: string;
  taskApplicationId?: string;
  userId?: string;
  [key: string]: any;
}

interface StoredNotificationState {
  applicationStatus: 'pending' | 'accepted' | 'rejected';
  isArchived: boolean;
  isRead: boolean;
  statusLoaded: boolean;
  timestamp: number;
}

export const CustomNotification: React.FC<CustomNotificationProps> = ({ notification, storageKey }) => {
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Initialize states from session storage or defaults
  const getInitialState = (): StoredNotificationState => {
    try {
      const storedData = sessionStorage.getItem(storageKey);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error reading from session storage:', error);
    }
    
    // Default state if nothing in storage
    return {
      applicationStatus: 'pending',
      isArchived: notification.isArchived || false,
      isRead: notification.isRead || false,
      statusLoaded: false,
      timestamp: new Date().getTime()
    };
  };

  // State variables
  const [state, setState] = useState<StoredNotificationState>(getInitialState());
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);
  const [parsedBody, setParsedBody] = useState<NotificationBody>({});
  const [isProcessingApplication, setIsProcessingApplication] = useState(false);
  const [realTaskApplicationId, setTaskApplicationId] = useState<string | null>(null);

  // Helper function to update state and save to storage
  const updateState = (updates: Partial<StoredNotificationState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving to session storage:', error);
      }
      return newState;
    });
  };

  // Parse notification body on mount
  useEffect(() => {
    try {
      if (typeof notification.body === 'string') {
        const jsonString = (notification.body as string).replace(/'/g, '"');
        const bodyData = JSON.parse(jsonString);
        setParsedBody(bodyData);

        if (bodyData.taskApplicationId) {
          setTaskApplicationId(bodyData.taskApplicationId);
        }

        if (bodyData.avatar) {
          fetchSignedUrl(bodyData.avatar);
        }
        
        // If we have application status in the notification and haven't loaded yet
        if (bodyData.applicationStatus && !state.statusLoaded) {
          updateState({ 
            applicationStatus: bodyData.applicationStatus,
            statusLoaded: true
          });
        }
      }
    } catch (error) {
      console.error('Error parsing notification body:', error);
      setParsedBody({ message: notification.body as string });
    }
  }, [notification.body]);

  // Fetch application status if needed
  useEffect(() => {
    if (!realTaskApplicationId || state.statusLoaded) return;

    const fetchTaskApplication = async () => {
      try {
        const formData = new FormData();
        formData.append('_action', 'getTaskApplication');
        formData.append('selectedTaskApplication', JSON.stringify({
          id: realTaskApplicationId
        }));

        const response = await fetch('/api/task/applications', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch application data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.taskApplication?.taskApplication && isMounted.current) {
          const dbStatus = result.taskApplication.taskApplication.status?.toLowerCase() || 'pending';
          const applicationStatus = dbStatus === 'accepted' ? 'accepted' : 
                                    dbStatus === 'rejected' ? 'rejected' : 'pending';
          
          updateState({ 
            applicationStatus, 
            statusLoaded: true 
          });
        }
      } catch (error) {
        console.error('Error fetching task application:', error);
      }
    };
    
    fetchTaskApplication();
  }, [realTaskApplicationId, state.statusLoaded]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Rest of the component with modified handlers to use updateState
  
  // Calculate time difference for displaying relative time
  const getTimeAgo = (dateString: string): string => {
    // ...existing code...
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  // Fetch signed URL for profile picture
  const fetchSignedUrl = async (profilePicture: string) => {
    // ...existing code...
    if (!profilePicture) return;

    try {
      const res = await fetch(`/api/s3-get-url?file=${encodeURIComponent(profilePicture)}&action=upload`);
      if (!res.ok) throw new Error('Failed to fetch signed URL');

      const data = await res.json();
      if (data.url) {
        setSignedFileUrl(data.url);
      }
    } catch (error) {
      console.error('Error fetching signed URL:', error);
    }
  };

  const handleNotificationClick = (notif: IMessage) => {
    if (!state.isRead) {
      notif.read();
      updateState({ isRead: true });
    }

    if (notif.cta?.data?.url) {
      window.open(notif.cta.data.url, '_blank');
    }
  };

  const handleUnread = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation();
    if (notif.isRead) {
      notif.unread();
      updateState({ isRead: false });
    }
  };

  const handleDelete = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation();
    const result = await fetch(`/api/notifications?action=delete&messageId=${notif.id}`);
    await result.json();
  };

  const handleArchive = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation();
    if (state.isArchived) return;

    try {
      setIsArchiving(true);
      await notif.archive();
      updateState({ isArchived: true });
    } catch (error) {
      console.error('Error archiving notification:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation();
    if (!state.isArchived) return;

    try {
      setIsUnarchiving(true);
      await notif.unarchive();
      updateState({ isArchived: false });
    } catch (error) {
      console.error('Error unarchiving notification:', error);
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleAcceptApplication = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parsedBody.taskApplicationId || isProcessingApplication) return;

    try {
      setIsProcessingApplication(true);
      const formData = new FormData();
      formData.append('_action', 'acceptTaskApplication');
      formData.append('selectedTaskApplication', JSON.stringify({
        id: parsedBody.taskApplicationId
      }));

      const response = await fetch('/api/task/applications', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to accept application');
      }

      updateState({ 
        applicationStatus: 'accepted', 
        statusLoaded: true 
      });
      
      if (!state.isRead) {
        await notification.read();
        updateState({ isRead: true });
      }
    } catch (error) {
      console.error('Error accepting application:', error);
    } finally {
      setIsProcessingApplication(false);
    }
  };

  const handleRejectApplication = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parsedBody.taskApplicationId || isProcessingApplication) return;

    try {
      setIsProcessingApplication(true);
      const formData = new FormData();
      formData.append('_action', 'rejectTaskApplication');
      formData.append('selectedTaskApplication', JSON.stringify({
        id: parsedBody.taskApplicationId
      }));

      const response = await fetch('/api/task/applications', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      updateState({ 
        applicationStatus: 'rejected', 
        statusLoaded: true 
      });
      
      if (!state.isRead) {
        await notification.read();
        updateState({ isRead: true });
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setIsProcessingApplication(false);
    }
  };

  // Other handlers remain mostly the same, just updating state with updateState function

  const handleViewProfile = (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation();
    if (parsedBody.userId) {
      window.open(`/profile/${parsedBody.userId}`, '_blank');
    }
  };

  const handleViewTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (parsedBody.taskId) {
      window.open(`/dashboard/tasks?taskid=${parsedBody.taskId}`, '_blank');
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await handleDelete(e, notification);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Render JSX with state from our storage-backed state object
  return (
    <div
      className={`bg-basePrimaryLight border-l-4 m-2 ${state.isArchived ? 'border-basePrimary' : 'border-baseSecondary'} p-4 mb-3 rounded-lg shadow hover:shadow-md transition-all duration-200 flex flex-col ${state.isArchived || state.isRead ? 'opacity-70 ' : ''}`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex justify-between items-start">
        <h3 className={`font-header ${state.isArchived ? '' : 'text-darkGrey'} font-semibold`}>
          {notification.subject}
        </h3>
        {!state.isRead && !state.isArchived && (
          <span className="bg-indicator-cyan h-3 w-3 rounded-full inline-block ml-2 mt-1 animate-pulse"></span>
        )}
      </div>

      <p className={`${state.isArchived ? '' : 'text-midGrey'} my-2 font-primary text-sm`}>
        {parsedBody.message || ''}
      </p>
      
      {parsedBody.taskApplicationId && (
        <div className="text-xs text-altMidGrey mb-2">
          Application status: <span className="font-medium">{state.applicationStatus}</span>
        </div>
      )}
      
      {/* Application response buttons for task applications */}
      {parsedBody.type === 'applied' && (
        <div className="flex space-x-2 my-2">
          {state.applicationStatus === 'pending' && (
            <>
              <button
                onClick={handleAcceptApplication}
                className="bg-confirmPrimary/40 text-white px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-successSecondary transition-colors disabled:opacity-50"
                disabled={isProcessingApplication}
              >
                <Check size={16} weight="bold" />
                <span className='text-confirmPrimary'>Accept</span>
              </button>

              <button
                onClick={handleRejectApplication}
                className="bg-dangerPrimary/30 text-dangerPrimary px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-dangerSecondary transition-colors disabled:opacity-50"
                disabled={isProcessingApplication}
              >
                <X size={16} weight="bold" />
                <span className='text-dangerPrimary'>Reject</span>
              </button>
            </>
          )}

          {state.applicationStatus === 'accepted' && (
            <button
              onClick={handleViewTask}
              className="bg-basePrimary/20 text-basePrimary px-3 py-1 rounded-md flex items=center space-x-1 text-sm hover:bg-basePrimary/30 transition-colors"
            >
              <Eye size={16} weight="bold" className='text-darkGrey' />
              <span>View Task</span>
            </button>
          )}

          {state.applicationStatus === 'rejected' && (
            <button
              onClick={handleDeleteNotification}
              className="bg-dangerPrimary/30 text-dangerPrimary px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-dangerSecondary transition-colors"
            >
              <Trash size={16} weight="bold" />
              <span>Delete Notification</span>
            </button>
          )}

          <button
            onClick={(e) => handleViewProfile(e, notification)}
            className="text-darkGrey px-3 py-1 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-300 transition-colors"
          >
            <User size={16} weight="bold" />
            <span>View Profile</span>
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-altMidGrey font-primary">
          {getTimeAgo(notification.createdAt)}
        </span>

        <div className="flex items-center space-x-3">
          {/* Archive/Unarchive buttons */}
          {!state.isArchived ? (
            <>
              <button
                onClick={(e) => handleArchive(e, notification)}
                className="text-altMidGrey transition-colors disabled:opacity-50 p-2 hover:bg-baseSecondary rounded"
                disabled={isArchiving}
                title="Archive"
              >
                <ArchiveBox size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => handleUnarchive(e, notification)}
                className="text-altMidGrey transition-colors disabled:opacity-50 p-2 hover:bg-baseSecondary rounded"
                disabled={isUnarchiving}
                title="Unarchive"
              >
                <ArrowCounterClockwise size={18} />
              </button>
              <button onClick={(e) => handleDelete(e, notification)} className='hover:bg-baseSecondary p-2 rounded' title="Delete">
                <Trash size={18} className="text-dangerPrimary" />
              </button>
            </>
          )}

          {state.isRead ? (
            <>
              <button
                onClick={(e) => handleUnread(e, notification)}
                className='hover:bg-baseSecondary p-2 rounded'
                title="Mark as unread"
              >
                <EnvelopeOpen size={18} className="text-altMidGrey" />
              </button>
            </>
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className='hover:bg-baseSecondary p-2 rounded'
              title="Read"
            >
              <Envelope size={18} className="text-baseSecondary" />
            </button>
          )}
          
          {notification.cta?.data?.url && (
            <a
              href={notification.cta.data.url}
              className="text-sm text-txtprimary hover:underline transition-all font-primary p-2"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.cta.data.text || 'View Details'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
