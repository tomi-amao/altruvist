import { Bell, Inbox, InboxContent } from '@novu/react';
import { Bell as BellIcon, BellRinging } from "phosphor-react";
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CustomNotification } from '~/components/CustomNotification';

interface InboxNotificationsProps {
  applicationIdentifier: string;
  subscriberId: string;
  tabs?: Array<{ label: string; value: string[] }>;
  appearance?: {
    variables?: Record<string, string>;
    elements?: Record<string, string>;
  };
}

export function InboxNotifications({
  applicationIdentifier,
  subscriberId,
  tabs = [
    { label: 'All Notifications', value: [] },
    { label: 'Applications', value: ['applications'] },
    { label: 'Promotions', value: ['promotions'] },
  ],
  appearance = {
    variables: {
      "colorPrimary": "#F5F5DC",
    },
    elements: {
        "inboxContent": {
            "background": "#DDDDDD"
        },
    }
    
  }
}: InboxNotificationsProps) {
  return (
    <div className="relative ">
      <Inbox 
        applicationIdentifier={applicationIdentifier} 
        subscriberId={subscriberId} 
        tabs={tabs} 
        appearance={appearance}
      >
        <Popover>
          <PopoverTrigger>
            <div className="cursor-pointer text-2xl hover:text-accentPrimary transition-colors">
              <Bell renderBell={(unreadCount) => (
                <div className="relative inline-block">
                  {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-dangerPrimary text-basePrimary p-2 text-xs rounded-full h-3 w-3 flex items-center justify-center">
                    {unreadCount}
                  </span>
                  )}
                  {unreadCount > 0 ? (
                  <BellRinging size={24} />
                  ) : (
                  <BellIcon size={24} />
                  )}
                </div>
              )} />
            </div>
          </PopoverTrigger>
          <PopoverContent className="h-[600px] w-[400px] p-0 overflow-hidden">
            <InboxContent
              renderNotification={(notification) => (
                <CustomNotification notification={notification} />
              )}
            />
          </PopoverContent>
        </Popover>
      </Inbox>
    </div>
  );
}
