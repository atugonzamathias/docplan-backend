import admin from 'firebase-admin';

// Parse the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n')  // Fix line breaks
  })
});

// Export Firestore and Messaging services
export const db = admin.firestore();
export const messaging = admin.messaging();
