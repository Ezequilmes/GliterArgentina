/**
 * Firebase Admin initialization for server-side utilities.
 *
 * Initializes the Admin SDK using Application Default Credentials (ADC),
 * which are available in Firebase App Hosting. Exposes Firestore for
 * persistence needs such as webhook idempotency.
 */
import admin from 'firebase-admin';

// Initialize Admin app once per process
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Get the Firestore Admin instance.
 *
 * @returns Firestore from Firebase Admin SDK.
 */
export function getFirestoreAdmin(): admin.firestore.Firestore {
  return admin.firestore();
}

export { admin };

