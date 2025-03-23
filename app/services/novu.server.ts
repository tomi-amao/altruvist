import { Novu } from "@novu/api";
import { users } from "@prisma/client";

// Initialize Novu with your API key
// You should store this in an environment variable
const novu = new Novu({ secretKey: process.env.NOVU_API_KEY, });

// Map Novu template types to our application types
const templateTypeMap: Record<string, string> = {
  message_received: 'message',
  system_alert: 'alert',
  project_update: 'update',
  collaboration_invite: 'invitation',
};

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'message' | 'alert' | 'update' | 'invitation';
  link?: string;
  templateId?: string;
}

/**
 * Fetch notifications for a user from Novu
 */
export async function getUserNotifications(subscriberId: string): Promise<NotificationItem[]> {
  try {
    // Fetch notifications with pagination
    const response = await novu.notifications.list({
      subscriberIds: [subscriberId],
      page: 0,
      limit: 20,
    });



    // Early return if no data
    if (!response?.result?.data) {
      console.warn('No notifications data received from Novu');
      return [];
    }

    const notifications = response.result.data;
    console.log("Received notifications:", notifications);

    // Transform the Novu response to our NotificationItem format
    return (notifications || []).map((notification: any) => {
      // Extract template ID to determine notification type
      const templateId = notification.templateId || '';

      return {
        id: notification._id,
        title: notification.title || 'Notification',
        content: notification.content || '',
        timestamp: notification.createdAt,
        read: !!notification.read,
        type: mapTemplateToType(templateId),
        link: extractActionUrl(notification),
        templateId,
      };
    });
  } catch (error) {
    console.error('Failed to fetch notifications from Novu:', error);
    return [];
  }
}

/**
 * Mark a notification as read in Novu
 */
export async function markNotificationAsRead(subscriberId: string, notificationId: string): Promise<boolean> {
  try {
    await novu.subscribers.markMessageSeen({
      subscriberId,
      messageId: notificationId,
    });
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a subscriber
 */
export async function markAllNotificationsAsRead(subscriberId: string): Promise<boolean> {
  try {
    await novu.subscribers.markAllMessagesAsSeen({
      subscriberId,
    });
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
}

/**
 * Map a Novu template ID to our application's notification type
 */
function mapTemplateToType(templateId: string): 'message' | 'alert' | 'update' | 'invitation' {
  const type = templateTypeMap[templateId];

  if (type && ['message', 'alert', 'update', 'invitation'].includes(type)) {
    return type as any;
  }

  // Default to 'alert' if the template type is unknown
  return 'alert';
}

/**
 * Extract action URL from notification payload if available
 */
function extractActionUrl(notification: any): string | undefined {
  try {
    // Find the first action that has a redirect URL
    const action = notification.cta?.find((action: any) => action.type === 'redirect');
    return action?.data?.url;
  } catch {
    return undefined;
  }
}



interface NotificationTriggerPayload {
  subject: string;
  body: string;
  type: "message" | "alert" | "update" | "applied" | "approved" | "rejected";

  taskApplicationId?: string;
  
  taskId?: string;  
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}


interface NotificationTriggerParams {
  userInfo: users;
  workflowId: string;
  notification: NotificationTriggerPayload;
  type: "Subscriber" | "Topic";
  topicKey?: string;
  event?: string;
}

export const triggerNotification = async ({
  userInfo,
  workflowId = "activity-feed",
  notification,
  type = "Subscriber",
  topicKey,
}: NotificationTriggerParams) => {
  try {
    const nameParts = userInfo.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!topicKey && type === "Topic") {
      console.error('Missing topic key for topic notification');
      return { notificationResult: null };

    }
    console.log('Triggering notification:', notification);

    // Trigger the notification
    const response = await novu.trigger({
      workflowId: workflowId,
      to: type === "Topic"
        ? [{ type: 'Topic', topicKey: topicKey! }]
        : [{ type: 'Subscriber', subscriberId: userInfo.id, email: userInfo.email, firstName, lastName }],
      payload: {
        subject: notification.subject,
        body: {
          message: notification.body,
          type: notification.type,
          avatar: userInfo.profilePicture,
          taskApplicationId: notification.taskApplicationId,
          userId: userInfo.id,
          taskId: notification.taskId,
        },
      },

    });

    console.log("Trigger notification response", response.result);

    return { notificationResult: response.result };
  } catch (error) {
    console.error('Failed to trigger notification:', error);
    return { notificationResult: null };
  }
}

export const createTopic = async (topicKey: string, topicName: string) => {
  try {
    const newTopic = await novu.topics.create({
      key: topicKey,
      name: topicName,
    });
    console.log('Created novu topic:', newTopic.result.key);

    return { topicKey: newTopic.result.key };
  } catch (error) {
    console.error('Failed to create topic:', error);
    return { topicKey: null };
  }
}

export const getTopicEntity = async (topicKey: string) => {
  try {
    const response = await novu.topics.retrieve(topicKey);
    return { response };
  } catch (error) {
    console.error('Failed to get topic:', error);
    return false;
  }
}

export const createNovuSubscriber = async (userInfo: users) => {
  const nameParts = userInfo.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  try {

    // const existingSubscriber = await novu.subscribers.retrieve(userInfo.id);
    // if (existingSubscriber) {
    //   console.log('Subscriber already exists:', existingSubscriber.result);
    //   return { response: existingSubscriber.result };
    // }
    const newSubscriber = await novu.subscribers.create({
      subscriberId: userInfo.id,
      email: userInfo.email,
      firstName: firstName,
      lastName: lastName,
    });

    console.log('Created novu subscriber:', newSubscriber);

    return { response: newSubscriber };
  } catch (error) {
    console.error('Failed to create subscriber:', error);
    return false;
  }
}

export const addNovuSubscriberToTopic = async (subscriberId: string[], topicKey: string) => {
  try {
    const response = await novu.topics.subscribers.assign({ subscribers: subscriberId }, topicKey);

    console.log('Added subscriber to topic:', response.result.succeeded);

    return { response };
  } catch (error) {
    console.error('Failed to add subscriber to topic:', error);
    return false;
  }
}

export const deleteNovuMessage = async (messageId: string) => {
  try {
    const response = await novu.messages.delete(messageId);
    console.log('Deleted message:', response);
    return { response };
  } catch (error) {
    console.error('Failed to delete message:', error);
    return false;
  }
}

export const deleteNovuSubscriber = async (subscriberId: string) => {
  try {
    const response = await novu.subscribers.delete(subscriberId);
    console.log('Deleted subscriber:', response.result);
    return { response };
  } catch (error) {
    console.error('Failed to delete subscriber:', error);
    return false;
  }
}