import { messaging } from '../config/firebase.js';

export const sendFCM = async (token, title, body, data = {}) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Required for Flutter navigation
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'high_importance_channel', // Must match Flutter config
        },
      },
    };

    await messaging.send(message);
    console.log(`✅ FCM sent to ${token}`);
  } catch (error) {
    console.error('❌ Error sending FCM:', error);
  }
};
