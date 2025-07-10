import { messaging } from '../config/firebase.js';

export const sendFCM = async (token, title, body, data) => {
  const message = {
    token,
    notification: { title, body },
    data,
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "high_importance_channel"
      }
    }
  };
  await messaging.send(message);
};