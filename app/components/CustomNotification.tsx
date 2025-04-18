import React, { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { IMessage } from "@novu/shared";
import {
  ArchiveBox,
  ArrowCounterClockwise,
  Envelope,
  EnvelopeOpen,
  Trash,
  User,
  Eye,
} from "phosphor-react";
import { useViewport } from "~/hooks/useViewport";

interface CustomNotificationProps {
  notification: IMessage;
}

interface NotificationBody {
  message?: string;
  profilePicture?: string;
  type?: string;
  taskId?: string;
  userId?: string;
}

export const CustomNotification: React.FC<CustomNotificationProps> = ({
  notification,
}) => {
  const navigate = useNavigate();
  const { isMobile } = useViewport();

  // Parse the notification body
  const [parsedBody, setParsedBody] = useState<NotificationBody>({});
  useEffect(() => {
    try {
      if (typeof notification.body === "string") {
        setParsedBody(JSON.parse(notification.body.replace(/'/g, '"')));
      }
    } catch (error) {
      console.error("Error parsing notification body:", error);
      setParsedBody({ message: notification.body as string });
    }
  }, [notification.body]);

  // State for notification actions
  const [isArchived, setIsArchived] = useState(
    notification.isArchived || false,
  );
  const [isRead, setIsRead] = useState(notification.isRead || false);

  const handleNotificationClick = () => {
    if (!isRead) {
      notification.read();
      setIsRead(true);
    }
  };

  const handleUnread = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRead) {
      notification.unread();
      setIsRead(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(
      `/api/notifications?action=delete&messageId=${notification.id}`,
    );
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isArchived) {
      await notification.archive();
      setIsArchived(true);
    }
  };

  const handleUnarchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isArchived) {
      await notification.unarchive();
      setIsArchived(false);
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (parsedBody.userId)
      window.open(`/profile/${parsedBody.userId}`, "_blank");
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`bg-basePrimaryLight border-l-4 m-2 p-3 sm:p-4 mb-3 rounded-lg shadow hover:shadow-md transition-all duration-200 flex flex-col ${isArchived || isRead ? "opacity-70 " : ""} max-w-full`}
      onClick={handleNotificationClick}
      onKeyDown={(e) => e.key === "Enter" && handleNotificationClick()}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-start">
        <h3
          className={`font-header font-semibold ${isArchived ? "" : "text-baseSecondary"} text-sm sm:text-base break-words`}
        >
          {notification.subject}
        </h3>
        {!isRead && !isArchived && (
          <span className="bg-confirmPrimary h-3 w-3 rounded-full inline-block ml-2 mt-1 animate-pulse flex-shrink-0"></span>
        )}
      </div>

      <p
        className={`${isArchived ? "" : "text-midGrey"} my-2 font-primary text-xs sm:text-sm break-words`}
      >
        {parsedBody.message || ""}
      </p>

      <div className="flex flex-wrap gap-2 my-2">
        {parsedBody.taskId && (
          <button
            onClick={() =>
              navigate(`/dashboard/tasks?taskid=${parsedBody.taskId}`)
            }
            className="bg-basePrimary/20 text-basePrimary px-2 sm:px-3 py-1 rounded-md flex items-center space-x-1 text-xs sm:text-sm hover:bg-basePrimary/30 transition-colors"
          >
            <Eye size={isMobile ? 14 : 16} className="text-darkGrey" />
            <span>View Task</span>
          </button>
        )}
        {parsedBody.userId && (
          <button
            onClick={handleViewProfile}
            className="text-darkGrey px-2 sm:px-3 py-1 rounded-md flex items-center space-x-1 text-xs sm:text-sm hover:bg-gray-300 transition-colors"
          >
            <User size={isMobile ? 14 : 16} />
            <span>View Profile</span>
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mt-1 flex-wrap sm:flex-nowrap">
        <span className="text-xs text-altMidGrey">
          {getTimeAgo(notification.createdAt)}
        </span>

        <div className="flex items-center gap-1 sm:gap-3 mt-1 sm:mt-0">
          {!isArchived ? (
            <button
              onClick={handleArchive}
              className="p-1 sm:p-2 hover:bg-baseSecondary rounded"
              title="Archive"
            >
              <ArchiveBox size={isMobile ? 16 : 18} />
            </button>
          ) : (
            <>
              <button
                onClick={handleUnarchive}
                className="p-1 sm:p-2 hover:bg-baseSecondary rounded"
                title="Unarchive"
              >
                <ArrowCounterClockwise size={isMobile ? 16 : 18} />
              </button>
              <button
                onClick={handleDelete}
                className="hover:bg-baseSecondary p-1 sm:p-2 rounded"
                title="Delete"
              >
                <Trash
                  size={isMobile ? 16 : 18}
                  className="text-dangerPrimary"
                />
              </button>
            </>
          )}

          {isRead ? (
            <button
              onClick={handleUnread}
              className="hover:bg-baseSecondary p-1 sm:p-2 rounded"
              title="Mark as unread"
            >
              <EnvelopeOpen
                size={isMobile ? 16 : 18}
                className="text-altMidGrey"
              />
            </button>
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className="hover:bg-baseSecondary p-1 sm:p-2 rounded"
              title="Read"
            >
              <Envelope
                size={isMobile ? 16 : 18}
                className="text-baseSecondary"
              />
            </button>
          )}

          {notification.cta?.data?.url && (
            <a
              href={notification.cta.data.url}
              className="text-xs sm:text-sm text-txtprimary hover:underline transition-all font-primary p-1 sm:p-2"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.cta.data.text || "View Details"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
