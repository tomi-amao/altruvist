import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { ActivityFeed } from '~/components/ActivityFeed';
import { getUserInfo } from '~/models/user2.server';
import { getSession } from '~/services/session.server';
import { Bell, Inbox, InboxContent, Notifications } from '@novu/react';
import {Bell as BellIcon, BellRinging } from "phosphor-react"
import { NotificationWrapper } from '~/components/NotificationWrapper';

import { IMessage } from '@novu/shared';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { CustomNotification } from '~/components/CustomNotification';

export default function InboxPage() {
  const navigate = useNavigate();
  const { userInfo, zitUserInfo } = useLoaderData<typeof loader>();

  // This is used to refresh notifications when needed
  // const handleNotificationClick = (notification) => {
  //   // You can implement specific actions here when notifications are clicked
  //   console.log("Notification clicked:", notification.unread());
  // };

  const tabs = [
    { label: 'All Notifications', value: [] },
    { label: 'Updates', value: ['updates'] },
    { label: 'Promotions', value: ['promotions'] },
  ];

  const appearance = {
    variables: {

      "colorPrimary": "#F5F5DC",

    },

  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-header font-bold mb-6 text-darkGrey">Your Inbox</h1>
      <p>{userInfo?.id}</p>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">Activity Feed</div>
        <div className="relative">
          <Inbox applicationIdentifier="rrCIU_4tFdsZ" subscriberId={userInfo?.id ?? ""} tabs={tabs} appearance={appearance}>
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
                    <NotificationWrapper notification={notification} />
                  )}
                />
              </PopoverContent>
            </Popover>
          </Inbox>
        </div>
      </div>

      {/* Activity feed content can go here */}
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo, zitUserInfo } = await getUserInfo(accessToken);
  return { userInfo, zitUserInfo };
}



