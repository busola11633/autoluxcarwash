// Server-side Firebase access.
//
// The browser app talks to Firestore with the *client* SDK, which is limited by
// firestore.rules. The server needs to do trusted things the browser must never
// be allowed to do (record a payment, add wash credits, save a payout account),
// so it uses the *Admin* SDK, which bypasses the rules.
//
// It needs a service account key. Set FIREBASE_SERVICE_ACCOUNT to the full JSON
// of the key (Firebase Console > Project settings > Service accounts > Generate
// new private key). On Vercel, paste the JSON into an environment variable.

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Same values as firebase-applet-config.json. Kept here as constants (with env
// overrides) because importing JSON on the server behaves differently on Vercel.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0240146258';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-44574057-005a-4867-ba43-3e982ca96f82';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let initError: string | null = null;

function init() {
  if (adminApp || initError) return;
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) {
    initError = 'FIREBASE_SERVICE_ACCOUNT is not set on the server.';
    return;
  }
  try {
    const serviceAccount = JSON.parse(raw);
    adminApp = getApps()[0] || initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
    // This project uses a *named* Firestore database, not "(default)".
    adminDb = getFirestore(adminApp, DATABASE_ID);
  } catch (e: any) {
    initError = `FIREBASE_SERVICE_ACCOUNT could not be parsed: ${e.message}`;
  }
}

export function adminReady(): { ok: boolean; error: string | null } {
  init();
  return { ok: !!adminDb, error: initError };
}

export function db(): Firestore {
  init();
  if (!adminDb) throw new Error(initError || 'Firebase Admin not initialised');
  return adminDb;
}

export async function verifyIdToken(token: string) {
  init();
  if (!adminApp) throw new Error(initError || 'Firebase Admin not initialised');
  return getAuth(adminApp).verifyIdToken(token);
}
