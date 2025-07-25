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
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Required for Flutter nav
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'emergency_alarm', // ✅ Use your custom sound file (no extension)
          channelId: 'emergency_alerts', // ✅ Must match the one in MainActivity.kt
        },
      },
    };

    console.log("🔔 Sending FCM with the following payload:");
    console.log(JSON.stringify(message, null, 2));

    await messaging.send(message);
    console.log(`✅ FCM sent to ${token}`);
  } catch (error) {
    console.error('❌ Error sending FCM:', error);
  }
};
