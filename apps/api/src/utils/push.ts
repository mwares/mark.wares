import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { title, body },
  };

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([message]);
    if (ticket.status === 'error') {
      console.error(`Push notification error: ${ticket.message}`);
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}
