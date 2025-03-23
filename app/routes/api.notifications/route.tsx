import { json, LoaderFunction } from '@remix-run/node';
import { deleteNovuMessage, getUserNotifications } from '~/services/novu.server';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const subscriberId = url.searchParams.get('subscriberId');
  const action = url.searchParams.get('action');
  console.log('subscriberId:', subscriberId);



  try {
    if (action === "delete") {
      const messageId = url.searchParams.get('messageId');

      const result = await deleteNovuMessage(messageId!);
      return json({ result });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
};

