import React, { useEffect, useState } from 'react';
import { IMessage } from '@novu/shared';
import { ArchiveBox, ArrowCounterClockwise, Envelope, EnvelopeOpen, Trash } from 'phosphor-react';
import { Avatar } from './cards/ProfileCard';

interface CustomNotificationProps {
  notification: IMessage;
}

interface NotificationBody {
  message?: string;
  profilePicture?: string;
  [key: string]: any;
}

export const CustomNotification: React.FC<CustomNotificationProps> = ({ notification }) => {
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(notification.isArchived || false);
  const [isRead, setIsRead] = useState(notification.isRead || false);
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);
  const [parsedBody, setParsedBody] = useState<NotificationBody>({});

  // Calculate time difference for displaying relative time
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  // Parse notification body on component mount
  useEffect(() => {
    try {
      if (typeof notification.body === 'string') {
        // Convert single quotes to double quotes for proper JSON parsing
        const jsonString = (notification.body as string).replace(/'/g, '"');
        const bodyData = JSON.parse(jsonString);
        setParsedBody(bodyData);

        // If avatar exists in the parsed data, fetch the signed URL
        if (bodyData.avatar) {
          fetchSignedUrl(bodyData.avatar);
        }
      }
    } catch (error) {
      console.error('Error parsing notification body:', error);
      // If parsing fails, just use the body as plain text
      setParsedBody({ message: notification.body as string });
    }
  }, [notification.body]); // Add notification.body as dependency to run when it changes

  // Fetch signed URL for profile picture
  const fetchSignedUrl = async (profilePicture: string) => {
    if (!profilePicture) return;

    try {

      const res = await fetch(`/api/s3-get-url?file=${encodeURIComponent(parsedBody.avatar)}&action=upload`);
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
    notif.read();
    setIsRead(notif.isRead);

    // Handle navigation or other actions based on notification data
    if (notif.cta?.data?.url) {
      window.open(notif.cta.data.url, '_blank');
    }
    console.log(notif);

  };

  const handleUnread = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation(); // Prevent triggering the parent click handler

    if (notif.isRead) {
      notif.unread();
      setIsRead(notif.isRead);
    }
  }
  const handleDelete = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation();
    const result = await fetch(`/api/notifications?action=delete&messageId=${notif.id}`);
    const data = await result.json();
    console.log(data);

  } // Prevent triggering the parent click handler

  const handleArchive = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation(); // Prevent triggering the parent click handler

    if (isArchived) return; // Already archived

    try {
      setIsArchiving(true);
      await notif.archive();
      setIsArchived(true);
    } catch (error) {
      console.error('Error archiving notification:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async (e: React.MouseEvent, notif: IMessage) => {
    e.stopPropagation(); // Prevent triggering the parent click handler

    if (!isArchived) return; // Not archived

    try {
      setIsUnarchiving(true);
      await notif.unarchive();
      setIsArchived(false);
    } catch (error) {
      console.error('Error unarchiving notification:', error);
    } finally {
      setIsUnarchiving(false);
    }
  };

  return (
    <div
      className={`bg-basePrimaryLight border-l-4 m-2 ${isArchived ? 'border-basePrimary' : 'border-baseSecondary'} p-4 mb-3 rounded-lg shadow hover:shadow-md transition-all duration-200 flex flex-col ${isArchived || notification.isRead ? 'opacity-70 ' : ''}`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex justify-between items-start">
        <h3 className={`font-header ${isArchived ? '' : 'text-darkGrey'} font-semibold`}>
          {notification.subject}
        </h3>
        {!notification.isRead && !isArchived && (
          <span className="bg-indicator-cyan h-3 w-3 rounded-full inline-block ml-2 mt-1 animate-pulse"></span>
        )}
      </div>

      <p className={`${isArchived ? '' : 'text-midGrey'} my-2 font-primary text-sm`}>
        {parsedBody.message || ''}
      </p>


      
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-altMidGrey font-primary">
          {getTimeAgo(notification.createdAt)}
        </span>

        {/* Only render Avatar if we have a valid URL or name */}
        {/* {JSON.parse(notification.body).message} */}
        <div className="flex items-center space-x-3">
          {/* Archive/Unarchive buttons */}
          {!isArchived ? (
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

          {notification.isRead ? (
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
