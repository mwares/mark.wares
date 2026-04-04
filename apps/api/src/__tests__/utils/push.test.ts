import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSendPush } = vi.hoisted(() => {
  const mockSendPush = vi.fn();
  return { mockSendPush };
});

vi.mock('expo-server-sdk', () => {
  return {
    Expo: Object.assign(
      class {
        sendPushNotificationsAsync = mockSendPush;
      },
      {
        isExpoPushToken: (token: string) => token.startsWith('ExponentPushToken['),
      },
    ),
  };
});

import { sendPushNotification } from '../../utils/push.js';

describe('Push Notification Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a push notification with correct format', async () => {
    mockSendPush.mockResolvedValueOnce([{ status: 'ok', id: 'receipt-1' }]);

    await sendPushNotification('ExponentPushToken[abc123]', 'Test Title', 'Test Body');

    expect(mockSendPush).toHaveBeenCalledWith([
      expect.objectContaining({
        to: 'ExponentPushToken[abc123]',
        title: 'Test Title',
        body: 'Test Body',
        sound: 'default',
      }),
    ]);
  });

  it('skips invalid push tokens', async () => {
    await sendPushNotification('invalid-token', 'Title', 'Body');

    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it('handles send errors gracefully', async () => {
    mockSendPush.mockResolvedValueOnce([{ status: 'error', message: 'DeviceNotRegistered' }]);

    await expect(
      sendPushNotification('ExponentPushToken[abc123]', 'Title', 'Body'),
    ).resolves.toBeUndefined();
  });

  it('handles network errors gracefully', async () => {
    mockSendPush.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      sendPushNotification('ExponentPushToken[abc123]', 'Title', 'Body'),
    ).resolves.toBeUndefined();
  });
});
